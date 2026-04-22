<template>
  <v-dialog
    :model-value="modelValue"
    max-width="980"
    :persistent="submitting"
    @update:modelValue="onDialogChange"
  >
    <v-card class="quick-add-dialog-card">
      <div v-if="loading" class="quick-add-loading">
        <v-progress-circular indeterminate size="42" width="4" />
        <div class="mt-3">Đang tải thông tin sản phẩm...</div>
      </div>

      <template v-else-if="detail">
        <v-btn
          icon="mdi-close"
          variant="text"
          class="quick-add-close-btn"
          @click="$emit('close')"
        />

        <v-row class="ma-0">
          <v-col cols="12" md="6" class="quick-add-left">
            <div class="quick-add-main-image-wrap">
              <v-img
                :src="previewImage || product?.displayImage"
                :alt="detail.productName"
                height="420"
                cover
                class="quick-add-main-image"
              />
            </div>

            <div v-if="selectedImages.length > 0" class="quick-add-thumb-list">
              <button
                v-for="(img, index) in selectedImages"
                :key="`${img.imageUrl}-${index}`"
                class="quick-add-thumb-btn"
                :class="{ active: previewImage === img.imageUrl }"
                @click="$emit('update-preview-image', img.imageUrl)"
              >
                <img :src="img.imageUrl" :alt="detail.productName" />
              </button>
            </div>
          </v-col>

          <v-col cols="12" md="6" class="quick-add-right">
            <div class="quick-add-title">
              {{ detail.productName }}
            </div>

            <div class="quick-add-brand" v-if="detail.brandName">
              {{ detail.brandName }}
            </div>

            <div class="quick-add-price-wrap">
              <template v-if="selectedDiscount">
                <div class="quick-add-original-price">
                  {{ formatPrice(selectedVariant?.price || 0) }}đ
                </div>
                <div class="quick-add-sale-price">
                  {{ formatPrice(discountedPrice) }}đ
                </div>
              </template>

              <template v-else>
                <div class="quick-add-sale-price">
                  {{ formatPrice(selectedVariant?.price || product?.displayPrice || 0) }}đ
                </div>
              </template>
            </div>

            <div class="quick-add-section">
              <div class="quick-add-label">Màu sắc</div>
              <div class="quick-add-color-list">
                <button
                  v-for="color in colorOptions"
                  :key="color.colorID"
                  class="quick-add-color-btn"
                  :class="{ active: Number(selectedColorId) === Number(color.colorID) }"
                  :title="color.colorName"
                  @click="$emit('select-color', color.colorID)"
                >
                  <span
                    class="quick-add-color-dot"
                    :style="{ backgroundColor: color.colorCode || '#ddd' }"
                  />
                </button>
              </div>
            </div>

            <div class="quick-add-section">
              <div class="quick-add-label">Kích thước</div>
              <div class="quick-add-size-list">
                <button
                  v-for="size in sizeOptions"
                  :key="size.sizeID"
                  class="quick-add-size-btn"
                  :class="{
                    active: Number(selectedSizeId) === Number(size.sizeID),
                    disabled: size.disabled,
                  }"
                  :disabled="size.disabled"
                  @click="$emit('select-size', size.sizeID)"
                >
                  {{ size.sizeName }}
                </button>
              </div>
            </div>

            <div
              v-if="selectedVariant"
              class="quick-add-stock"
              :class="{ out: maxQuantity <= 0 }"
            >
              <template v-if="maxQuantity > 0">
                Còn {{ maxQuantity }} sản phẩm
              </template>
              <template v-else>
                Biến thể này đã hết hàng
              </template>
            </div>

            <div class="quick-add-section">
              <div class="quick-add-label">Số lượng</div>
              <div class="quick-add-qty">
                <button
                  class="quick-add-qty-btn"
                  @click="$emit('decrease-qty')"
                  :disabled="quantity <= 1"
                >
                  −
                </button>

                <input
                  :value="quantity"
                  type="number"
                  min="1"
                  :max="maxQuantity || 1"
                  class="quick-add-qty-input"
                  @input="$emit('qty-input', $event.target.value)"
                />

                <button
                  class="quick-add-qty-btn"
                  @click="$emit('increase-qty')"
                  :disabled="!hasValidSelection || quantity >= maxQuantity"
                >
                  +
                </button>
              </div>
            </div>

            <div class="quick-add-actions">
              <v-btn
                variant="outlined"
                size="large"
                class="quick-add-btn"
                @click="$emit('close')"
                :disabled="submitting"
              >
                Đóng
              </v-btn>

              <v-btn
                color="black"
                size="large"
                class="quick-add-btn"
                :loading="submitting"
                :disabled="!hasValidSelection"
                @click="$emit('confirm')"
              >
                Thêm vào giỏ
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
const props = defineProps({
  modelValue: Boolean,
  loading: Boolean,
  submitting: Boolean,
  product: Object,
  detail: Object,
  previewImage: String,
  selectedImages: {
    type: Array,
    default: () => [],
  },
  selectedDiscount: {
    type: Object,
    default: null,
  },
  selectedVariant: {
    type: Object,
    default: null,
  },
  discountedPrice: {
    type: Number,
    default: 0,
  },
  colorOptions: {
    type: Array,
    default: () => [],
  },
  selectedColorId: {
    type: [Number, String, null],
    default: null,
  },
  sizeOptions: {
    type: Array,
    default: () => [],
  },
  selectedSizeId: {
    type: [Number, String, null],
    default: null,
  },
  maxQuantity: {
    type: Number,
    default: 0,
  },
  hasValidSelection: Boolean,
  quantity: {
    type: Number,
    default: 1,
  },
})

const emit = defineEmits([
  "close",
  "update-preview-image",
  "select-color",
  "select-size",
  "decrease-qty",
  "increase-qty",
  "qty-input",
  "confirm",
])

function onDialogChange(value) {
  if (!value) {
    emit("close")
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(Number(price) || 0)
}
</script>

<style scoped>
.quick-add-dialog-card {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
}

.quick-add-close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
}

.quick-add-loading {
  min-height: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.quick-add-left {
  padding: 24px;
  background: #fafafa;
}

.quick-add-right {
  padding: 28px 24px 24px;
}

.quick-add-main-image-wrap {
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
}

.quick-add-main-image {
  background: #fff;
}

.quick-add-thumb-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.quick-add-thumb-btn {
  width: 64px;
  height: 64px;
  border: 1px solid #ddd;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  cursor: pointer;
}

.quick-add-thumb-btn.active {
  border-color: #111;
  box-shadow: 0 0 0 1px #111 inset;
}

.quick-add-thumb-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.quick-add-title {
  font-size: 28px;
  line-height: 1.3;
  font-weight: 700;
  margin-bottom: 8px;
}

.quick-add-brand {
  color: #666;
  margin-bottom: 18px;
}

.quick-add-price-wrap {
  margin-bottom: 20px;
}

.quick-add-original-price {
  color: #999;
  text-decoration: line-through;
  font-size: 15px;
  margin-bottom: 4px;
}

.quick-add-sale-price {
  font-size: 28px;
  font-weight: 700;
  color: #111;
}

.quick-add-section {
  margin-bottom: 18px;
}

.quick-add-label {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 10px;
  color: #333;
}

.quick-add-color-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.quick-add-color-btn {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  border: 1px solid #d9d9d9;
  background: #fff;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.quick-add-color-btn.active {
  border-color: #111;
  box-shadow: 0 0 0 2px #111 inset;
}

.quick-add-color-dot {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.quick-add-size-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.quick-add-size-btn {
  min-width: 70px;
  height: 42px;
  border-radius: 999px;
  border: 1px solid #d9d9d9;
  background: #fff;
  padding: 0 16px;
  font-weight: 600;
  cursor: pointer;
}

.quick-add-size-btn.active {
  background: #111;
  color: #fff;
  border-color: #111;
}

.quick-add-size-btn.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.quick-add-stock {
  font-size: 14px;
  color: #2e7d32;
  font-weight: 600;
  margin-bottom: 18px;
}

.quick-add-stock.out {
  color: #d32f2f;
}

.quick-add-qty {
  height: 52px;
  display: flex;
  align-items: stretch;
  border: 1px solid #ddd;
  border-radius: 12px;
  overflow: hidden;
}

.quick-add-qty-btn {
  width: 56px;
  border: none;
  background: #fff;
  font-size: 28px;
  cursor: pointer;
}

.quick-add-qty-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.quick-add-qty-input {
  flex: 1;
  border: none;
  outline: none;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
}

.quick-add-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 20px;
}

.quick-add-btn {
  text-transform: none;
  font-weight: 700;
  height: 48px;
}

@media (max-width: 960px) {
  .quick-add-title {
    font-size: 22px;
  }

  .quick-add-sale-price {
    font-size: 24px;
  }

  .quick-add-left,
  .quick-add-right {
    padding: 18px;
  }
}
</style>