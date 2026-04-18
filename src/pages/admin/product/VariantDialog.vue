<template>
  <v-dialog v-model="localOpen" max-width="880" persistent>
    <v-card>
      <v-card-title class="text-h6 font-weight-bold">
        {{
          mode === "add"
            ? "Thêm biến thể sản phẩm"
            : "Cập nhật biến thể sản phẩm"
        }}
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-5">
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.colorID"
              :items="colors"
              item-title="colorName"
              item-value="colorID"
              label="Chọn màu"
              variant="outlined"
              density="comfortable"
              hide-details
            >
              <template #selection>
                <div v-if="selectedColor" class="color-option">
                  <span
                    class="color-swatch"
                    :style="{
                      backgroundColor: selectedColor.colorCode || '#ddd',
                    }"
                  ></span>
                  <span>{{ selectedColor.colorName }}</span>
                </div>
                <span v-else class="text-grey">Chọn màu</span>
              </template>

              <template #item="{ props, item }">
                <v-list-item v-bind="props" class="color-list-item">
                  <template #prepend>
                    <span
                      class="color-swatch-large"
                      :style="{
                        backgroundColor: item?.colorCode || '#ddd',
                      }"
                    ></span>
                  </template>

                  <template #title>
                    {{
                      item?.colorName || item?.title || "Không có tên màu"
                    }}
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </v-col>

          <v-col cols="12" md="6">
            <v-select
              v-model="form.sizeID"
              :items="sizes"
              item-title="sizeName"
              item-value="sizeID"
              label="Chọn size"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.price"
              type="number"
              label="Giá"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.stockQuantity"
              type="number"
              label="Số lượng tồn"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-select
              v-model="form.status"
              :items="statusOptions"
              label="Trạng thái"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>

          <v-col cols="12">
            <v-switch
              v-model="form.isRepresentative"
              color="primary"
              inset
              label="Đặt làm biến thể đại diện"
              hide-details
            />
          </v-col>
        </v-row>

        <div class="mt-5">
          <div class="text-subtitle-1 font-weight-bold mb-3">Ảnh biến thể</div>

          <div
            v-if="mode === 'edit' && existingImages.length"
            class="existing-images mb-4"
          >
            <div
              v-for="img in existingImages"
              :key="img.imageID"
              class="image-card"
            >
              <img :src="img.imageUrl" class="dialog-image" />
              <div class="image-actions">
                <v-chip
                  v-if="img.isMain"
                  size="x-small"
                  color="success"
                  variant="flat"
                >
                  Ảnh chính
                </v-chip>
                <v-btn
                  v-else
                  size="x-small"
                  color="primary"
                  variant="tonal"
                  @click="$emit('set-main', img)"
                >
                  Đặt chính
                </v-btn>

                <v-btn
                  size="x-small"
                  color="error"
                  variant="tonal"
                  @click="$emit('delete-image', img)"
                >
                  Xóa
                </v-btn>
              </div>
            </div>
          </div>

          <div class="upload-box">
            <input
              type="file"
              multiple
              accept="image/*"
              @change="onFileChange"
              :disabled="remainingSlots === 0"
            />
            <div class="text-caption text-grey mt-2">
              Tối đa 5 ảnh cho mỗi biến thể. Hiện có {{ totalImagesCount }}/5
              ảnh.
            </div>
          </div>

          <div v-if="newFiles.length" class="new-files-preview mt-4">
            <div
              v-for="(file, index) in newFiles"
              :key="`${file.name}-${index}`"
              class="preview-chip"
            >
              {{ file.name }}
              <v-btn
                icon="mdi-close"
                size="x-small"
                variant="text"
                @click="removeNewFile(index)"
              />
            </div>
          </div>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="handleClose">Hủy</v-btn>
        <v-btn color="primary" @click="submit">
          {{ mode === "add" ? "Thêm" : "Lưu thay đổi" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  open: Boolean,
  mode: {
    type: String,
    default: "add",
  },
  colors: {
    type: Array,
    default: () => [],
  },
  sizes: {
    type: Array,
    default: () => [],
  },
  variant: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:open", "submit", "delete-image", "set-main"]);

const localOpen = computed({
  get: () => props.open,
  set: (value) => emit("update:open", value),
});

const statusOptions = ["ACTIVE", "INACTIVE"];

const defaultForm = () => ({
  colorID: null,
  sizeID: null,
  price: 0,
  stockQuantity: 0,
  status: "ACTIVE",
  isRepresentative: false,
});

const form = ref(defaultForm());
const newFiles = ref([]);

const existingImages = computed(() => props.variant?.images || []);
const totalImagesCount = computed(
  () => existingImages.value.length + newFiles.value.length,
);
const remainingSlots = computed(() => Math.max(0, 5 - totalImagesCount.value));

watch(
  () => props.variant,
  (val) => {
    if (!val) {
      form.value = defaultForm();
      newFiles.value = [];
      return;
    }

    form.value = {
      colorID: val.colorID ?? null,
      sizeID: val.sizeID ?? null,
      price: val.price ?? 0,
      stockQuantity: val.stockQuantity ?? 0,
      status: val.status || "ACTIVE",
      isRepresentative: Boolean(val.isRepresentative),
    };

    newFiles.value = [];
  },
  { immediate: true },
);

const onFileChange = (event) => {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  const allowedCount = remainingSlots.value;

  if (allowedCount <= 0) {
    event.target.value = "";
    return;
  }

  const acceptedFiles = files.slice(0, allowedCount);
  newFiles.value = [...newFiles.value, ...acceptedFiles];
  event.target.value = "";
};

const removeNewFile = (index) => {
  newFiles.value.splice(index, 1);
};

const submit = () => {
  if (totalImagesCount.value > 5) return;

  emit("submit", {
    form: { ...form.value },
    files: [...newFiles.value],
  });
};

const handleClose = () => {
  localOpen.value = false;
  newFiles.value = [];
};

const selectedColor = computed(() => {
  return props.colors.find(
    (color) => Number(color.colorID) === Number(form.value.colorID),
  );
});
</script>

<style scoped>
.existing-images {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-card {
  width: 120px;
}

.dialog-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: #fff;
}

.image-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.upload-box {
  padding: 14px;
  border: 1px dashed #bbb;
  border-radius: 10px;
  background: #fafafa;
}

.new-files-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.preview-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f1f1f1;
  font-size: 13px;
}

.color-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.color-list-item :deep(.v-list-item__prepend) {
  margin-inline-end: 0;
}

.color-swatch {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid #cfcfcf;
  display: inline-block;
  flex-shrink: 0;
}

.color-swatch-large {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 2px solid #cfcfcf;
  display: inline-block;
  flex-shrink: 0;
}

.color-item-content {
  display: flex;
  align-items: center;
  gap: 0;
  width: 100%;
}

.color-item-content .ml-2 {
  margin-left: 12px;
}
</style>