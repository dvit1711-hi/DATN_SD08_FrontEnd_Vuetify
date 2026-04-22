<template>
  <v-card
    class="product-card"
    :to="{
      path: `/products/${product.productID}`,
      query: { variant: product.defaultVariantId },
    }"
    variant="elevated"
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false"
  >
    <div class="product-image-wrapper">
      <div v-if="discount" class="discount-badge">
        <span v-if="discount.discountType === 'percent'">
          -{{ discount.discountValue }}%
        </span>
        <span v-else>
          -{{ formatCurrency(discount.discountValue) }}
        </span>
      </div>

      <v-btn
        icon
        size="small"
        variant="flat"
        class="quick-cart-btn"
        :disabled="outOfStock"
        @click.stop.prevent="$emit('quick-add', product)"
      >
        <v-icon size="20">mdi-cart-plus</v-icon>
      </v-btn>

      <v-img
        :src="currentImage"
        :alt="product.productName"
        class="product-image"
        cover
      />
    </div>

    <v-card-text class="product-content">
      <div class="product-brand">
        {{ product.brandName || "—" }}
      </div>

      <h3 class="product-title line-clamp-2">
        {{ product.productName }}
      </h3>

      <div v-if="displayColors.length > 0" class="product-colors">
        <span
          v-for="c in displayColors.slice(0, 5)"
          :key="c.colorID || c.colorName"
          class="color-dot"
          :style="{ backgroundColor: c.colorCode || '#ddd' }"
          :title="c.colorName"
        />
        <span
          v-if="displayColors.length > 5"
          class="more-colors"
        >
          +{{ displayColors.length - 5 }}
        </span>
      </div>

      <div class="product-bottom">
        <div class="product-price">
          <template v-if="discount">
            <span class="sale-price">
              {{ formatPrice(discountedPrice) }}đ
            </span>
            <!-- <span class="old-price">
              {{ formatPrice(product.displayPrice) }}đ
            </span> -->
          </template>

          <template v-else>
            <span class="sale-price">
              {{ formatPrice(product.displayPrice) }}đ
            </span>
          </template>
        </div>

        <v-chip
          v-if="outOfStock"
          size="x-small"
          color="error"
          variant="flat"
          class="stock-chip"
        >
          Hết hàng
        </v-chip>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed, ref } from "vue"

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
  discount: {
    type: Object,
    default: null,
  },
  discountedPrice: {
    type: Number,
    default: 0,
  },
})

defineEmits(["quick-add"])

const isHovering = ref(false)

const outOfStock = computed(() => !Boolean(props.product?.inStock))

const displayColors = computed(() => {
  const map = new Map()
  ;(props.product?.colors || []).forEach((c) => {
    if (!map.has(Number(c.colorID))) {
      map.set(Number(c.colorID), c)
    }
  })
  return Array.from(map.values())
})

const currentImage = computed(() => {
  if (isHovering.value) {
    return props.product?.hoverImage || props.product?.displayImage || ""
  }
  return props.product?.displayImage || ""
})

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(Number(price) || 0)
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}
</script>

<style scoped>
.product-card {
  height: 100%;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
  transition: all 0.25s ease;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.08);
}

.product-image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: #f4f4f4;
}

.product-image {
  width: 100%;
  height: 100%;
}

.product-image :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.product-card:hover .product-image :deep(img) {
  transform: scale(1.04);
}

.discount-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 3;
  min-width: 58px;
  height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  background: #ff5d73;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  box-shadow: 0 8px 18px rgba(255, 93, 115, 0.22);
}

.quick-cart-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 3;
  width: 42px;
  height: 42px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96) !important;
  color: #111 !important;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
}

.quick-cart-btn:deep(.v-btn__content) {
  opacity: 1;
}

.product-content {
  padding: 16px 16px 18px;
}

.product-brand {
  font-size: 13px;
  color: #7b7b7b;
  font-weight: 600;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.product-title {
  margin: 0;
  min-height: 58px;
  font-size: 18px;
  line-height: 1.45;
  font-weight: 700;
  color: #111;
}

.product-colors {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
  min-height: 24px;
}

.color-dot {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.18);
  display: inline-block;
}

.more-colors {
  font-size: 12px;
  color: #666;
  font-weight: 600;
}

.product-bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
}

.product-price {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sale-price {
  font-size: 20px;
  font-weight: 800;
  color: #111;
  line-height: 1.2;
}

.old-price {
  font-size: 14px;
  color: #9b9b9b;
  text-decoration: line-through;
  line-height: 1.2;
}

.stock-chip {
  flex-shrink: 0;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>