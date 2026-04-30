<template>
  <v-card class="mb-5 color-group-card" elevation="0" border>
    <v-card-text class="pa-4">
      <div class="d-flex align-start justify-space-between flex-wrap gap-4 mb-4">
        <div class="d-flex align-center gap-3" style="gap: 10px;">
          <div
            class="color-box"
            :style="{ backgroundColor: group.colorCode || '#eee' }"
          ></div>
          <div>
            <div class="text-h6 font-weight-bold">{{ group.colorName }}</div>
            <div class="text-caption text-grey">
              {{ group.items.length }} biến thể
            </div>
          </div>
        </div>

        <div class="main-image-wrap">
          <img
            v-if="group.mainImageUrl"
            :src="group.mainImageUrl"
            class="main-image"
            alt="main"
          />
          <div v-else class="main-image no-image">Không có ảnh</div>
        </div>
      </div>

      <v-table density="comfortable" class="variant-table">
        <thead>
          <tr>
            <th>Đại diện</th>
            <th>Màu</th>
            <th>Size</th>
            <th>Giá</th>
            <th>Tồn kho</th>
            <th>Trạng thái</th>
            <th>Ảnh</th>
            <th class="text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="variant in sortedItems"
            :key="variant.productColorID"
            :class="{
              'inactive-row': variant.status === 'INACTIVE',
              'representative-row': variant.isRepresentative,
            }"
          >
            <td>
              <div class="representative-cell">
                <v-chip
                  v-if="variant.isRepresentative"
                  size="small"
                  color="primary"
                  variant="flat"
                >
                  Đại diện
                </v-chip>

                <v-btn
                  v-else
                  size="x-small"
                  color="primary"
                  variant="tonal"
                  @click="$emit('set-representative', variant)"
                >
                  Đặt đại diện
                </v-btn>
              </div>
            </td>

            <!-- Color with visual indicator -->
            <td>
              <div class="color-info-cell">
                <span
                  class="color-dot-small"
                  :style="{ backgroundColor: group.colorCode || '#eee' }"
                />
                <span class="color-name-text">{{ group.colorName }}</span>
              </div>
            </td>

            <td>
              <v-chip size="small" variant="outlined">
                {{ variant.sizeName || "—" }}
              </v-chip>
            </td>
            <td class="price-cell">{{ formatPrice(variant.price) }}đ</td>
            <td>
              <v-chip
                :color="variant.stockQuantity > 0 ? 'success' : 'error'"
                variant="tonal"
                size="small"
              >
                {{ variant.stockQuantity ?? 0 }}
              </v-chip>
            </td>
            <td>
              <v-chip
                size="small"
                :color="variant.status === 'ACTIVE' ? 'success' : 'grey'"
                variant="tonal"
              >
                {{ variant.status || "ACTIVE" }}
              </v-chip>
            </td>
            <td>
              <div class="thumb-list">
                <img
                  v-for="img in (variant.images || []).slice(0, 5)"
                  :key="img.imageID"
                  :src="img.imageUrl"
                  class="thumb-img"
                  :class="{ 'thumb-main': img.isMain }"
                />
                <span
                  v-if="(variant.images || []).length > 5"
                  class="text-caption text-grey"
                >
                  +{{ variant.images.length - 5 }}
                </span>
              </div>
            </td>
            <td class="text-right">
              <div class="d-inline-flex gap-2">
                <v-btn
                  color="warning"
                  size="small"
                  variant="tonal"
                  @click="$emit('edit', variant)"
                >
                  Sửa
                </v-btn>
                <v-btn
                  color="error"
                  size="small"
                  variant="tonal"
                  @click="$emit('delete', variant)"
                >
                  Xóa
                </v-btn>
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  group: {
    type: Object,
    required: true,
  },
});

defineEmits(["edit", "delete", "set-representative"]);

const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN").format(Number(price) || 0);
};

const sortedItems = computed(() => {
  return [...(props.group?.items || [])].sort((a, b) => {
    const aRepresentative = a?.isRepresentative ? 0 : 1;
    const bRepresentative = b?.isRepresentative ? 0 : 1;
    if (aRepresentative !== bRepresentative) return aRepresentative - bRepresentative;

    const aStatus = String(a?.status || "").toUpperCase() === "ACTIVE" ? 0 : 1;
    const bStatus = String(b?.status || "").toUpperCase() === "ACTIVE" ? 0 : 1;
    if (aStatus !== bStatus) return aStatus - bStatus;

    return String(a?.sizeName || "").localeCompare(String(b?.sizeName || ""), "vi");
  });
});
</script>

<style scoped>
.color-group-card {
  border-radius: 14px;
}

.color-box {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid #ccc;
}

.main-image-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-image {
  width: 82px;
  height: 82px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #ddd;
  background: #fff;
}

.no-image {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  font-size: 12px;
}

.variant-table th {
  font-weight: 700;
  color: #333;
}

.thumb-list {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.thumb-img {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.thumb-main {
  border: 2px solid #2e7d32;
}

.inactive-row {
  opacity: 0.7;
  background: #f8f8f8;
}

.representative-row {
  background: #f3f8ff;
}

.representative-cell {
  display: flex;
  align-items: center;
  min-height: 32px;
}

/* Color Info Cell */
.color-info-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.color-dot-small {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #ccc;
  flex-shrink: 0;
}

.color-name-text {
  font-weight: 500;
  color: #333;
}

/* Price Cell */
.price-cell {
  font-weight: 600;
  color: #2e7d32;
}
</style>