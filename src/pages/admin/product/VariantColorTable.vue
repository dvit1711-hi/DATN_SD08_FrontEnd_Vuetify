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
            v-for="variant in group.items"
            :key="variant.productColorID"
            :class="{ 'inactive-row': variant.status === 'INACTIVE' }"
          >
            <td>{{ variant.sizeName || "—" }}</td>
            <td>{{ formatPrice(variant.price) }}đ</td>
            <td>{{ variant.stockQuantity ?? 0 }}</td>
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
                  v-for="img in variant.images.slice(0, 5)"
                  :key="img.imageID"
                  :src="img.imageUrl"
                  class="thumb-img"
                  :class="{ 'thumb-main': img.isMain }"
                />
                <span
                  v-if="variant.images.length > 5"
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
const props = defineProps({
  group: {
    type: Object,
    required: true,
  },
});

defineEmits(["edit", "delete"]);

const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN").format(Number(price) || 0);
};
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
</style>