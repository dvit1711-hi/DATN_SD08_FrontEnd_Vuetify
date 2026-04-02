<template>
  <v-container class="py-8" fluid>
    <!-- Header Section -->
    <div class="mb-8">
      <h1 class="text-h4 font-weight-bold mb-2">Danh sách sản phẩm</h1>
      <p class="text-subtitle-1 text-grey">Khám phá bộ sưu tập các sản phẩm chất lượng cao</p>
    </div>

    <!-- Products Grid -->
    <v-row>
      <v-col
        v-for="p in products"
        :key="p.productID"
        cols="12"
        sm="6"
        md="4"
        lg="3"
        class="d-flex"
      >
        <v-card
          class="w-100 d-flex flex-column product-card"
          :to="`/products/${p.productID}`"
          variant="elevated"
        >
          <!-- Product Image -->
          <div class="product-image-wrapper">
            <v-img
              :src="p.mainImage"
              :alt="p.productName"
              height="240"
              cover
              class="product-image"
            />
            <!-- Discount Badge -->
            <div v-if="getProductDiscount(p)" class="discount-badge">
              <span v-if="getProductDiscount(p).discountType === 'percent'">
                -{{ getProductDiscount(p).discountValue }}%
              </span>
              <span v-else>
                Giảm {{ formatCurrency(getProductDiscount(p).discountValue) }}
              </span>
            </div>
          </div>

          <!-- Card Content -->
          <v-card-text class="pa-4 flex-grow-1 d-flex flex-column">
            <h3 class="text-subtitle-1 font-weight-bold mb-1 line-clamp-2">
              {{ p.productName }}
            </h3>
            <v-chip
              v-if="isOutOfStock(p)"
              size="x-small"
              color="error"
              variant="flat"
              class="mb-2 out-of-stock-chip"
            >
              Hết hàng
            </v-chip>
            <!-- <p class="text-caption text-grey mb-3">
              {{ p.description?.substring(0, 50) }}...
            </p> -->

            <!-- Colors -->
            <div class="mb-3 flex-grow-1">
              <div class="text-caption text-grey mb-2">Màu sắc:</div>
              <div class="d-flex gap-2">
                <button
                  v-for="c in getDisplayColors(p)"
                  :key="c.productColorID || c.colorName"
                  class="color-btn"
                  :style="{ background: c.colorCode }"
                  :title="c.colorName"
                />
              </div>
            </div>

            <!-- Price -->
            <div class="mb-4">
              <div v-if="getProductDiscount(p)" class="price-section">
                <div class="original-price">{{ formatPrice(p.price) }}đ</div>
                <div class="discounted-price">{{ formatPrice(getDiscountedPrice(p)) }}đ</div>
              </div>
              <div v-else class="price-section">
                <span class="text-h6 font-weight-bold text-primary">
                  {{ formatPrice(p.price) }}đ
                </span>
              </div>
            </div>
          </v-card-text>

          <!-- Actions -->
          <v-divider />
          <v-card-actions class="pa-3">
            <v-btn
              color="primary"
              size="small"
              variant="flat"
              block
              :disabled="isOutOfStock(p)"
              @click.stop.prevent="addToCart(p)"
            >
              <v-icon left>mdi-shopping-cart</v-icon>
              {{ isOutOfStock(p) ? 'Hết hàng' : 'Thêm giỏ' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-empty-state
      v-if="products.length === 0"
      title="Không có sản phẩm"
      text="Vui lòng quay lại sau"
      icon="mdi-inbox"
    />

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      timeout="3000"
      top
    >
      {{ snackbarMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "@/stores/user";
import productApi from "@/api/productApi";
import productColorApi from "@/api/productColorApi";
import { getActiveProductDiscounts } from "@/api/productDiscountApi";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const products = ref([]);
const discountMap = ref(new Map());
const showSnackbar = ref(false);
const snackbarMessage = ref("");
const snackbarColor = ref("success");

const loadProducts = async () => {
  try {
    const keyword = route.query.search?.toString().trim() || "";
    const [res, stockRes, discountRes] = await Promise.all([
      productApi.getAllCard(keyword),
      productColorApi.getAll(),
      getActiveProductDiscounts(),
    ]);

    const stockMap = new Map();
    (stockRes.data || []).forEach((pc) => {
      const productColorId = Number.parseInt(pc.productColorID ?? pc.id, 10);
      if (Number.isFinite(productColorId)) {
        stockMap.set(productColorId, Number.parseInt(pc.stockQuantity, 10) || 0);
      }
    });

    // Build discount map by productColorId
    discountMap.value = new Map();
    (discountRes.data || []).forEach((discount) => {
      const productColorId = Number.parseInt(discount.productColorId, 10);
      if (Number.isFinite(productColorId)) {
        discountMap.value.set(productColorId, discount);
      }
    });

    products.value = (res.data || []).map((p) => ({
      ...p,
      stockQuantity: stockMap.get(Number.parseInt(p.productColorID, 10)) ?? 0,
    }));
  } catch (error) {
    console.error("Lỗi tải sản phẩm:", error);
    products.value = [];
  }
};

onMounted(async () => {
  await loadProducts();
});

watch(
  () => route.query.search,
  async () => {
    await loadProducts();
  }
);

const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN").format(price);
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(value);
};

const getProductDiscount = (product) => {
  if (!product) return null;
  const productColorId = Number.parseInt(product.productColorID, 10);
  if (!Number.isFinite(productColorId)) return null;
  return discountMap.value.get(productColorId) || null;
};

const getDiscountedPrice = (product) => {
  const discount = getProductDiscount(product);
  if (!discount) return product.price;
  
  const price = Number.parseFloat(product.price) || 0;
  
  if (discount.discountType === 'percent') {
    const discountPercent = Number.parseFloat(discount.discountValue) || 0;
    const discountAmount = price * (discountPercent / 100);
    const maxDiscount = Number.parseFloat(discount.maxDiscountValue) || Infinity;
    const actualDiscount = Math.min(discountAmount, maxDiscount);
    return Math.max(0, price - actualDiscount);
  } else {
    // Fixed discount
    const discountAmount = Number.parseFloat(discount.discountValue) || 0;
    return Math.max(0, price - discountAmount);
  }
};

const isOutOfStock = (product) => {
  return (Number.parseInt(product?.stockQuantity, 10) || 0) <= 0;
};

function getDisplayColors(product) {
  if (Array.isArray(product?.colors) && product.colors.length > 0) {
    return product.colors;
  }

  if (product?.colorCode || product?.colorName) {
    return [
      {
        productColorID: product.productColorID,
        colorCode: product.colorCode,
        colorName: product.colorName,
      },
    ];
  }

  return [];
}

async function resolveProductColorId(product) {
  const directProductColorId = Number.parseInt(product?.productColorID, 10);
  if (Number.isFinite(directProductColorId) && directProductColorId > 0) {
    return directProductColorId;
  }

  if (Array.isArray(product?.colors) && product.colors.length > 0) {
    const colorId = Number.parseInt(product.colors[0]?.productColorID, 10);
    if (Number.isFinite(colorId) && colorId > 0) {
      return colorId;
    }
  }

  const productId = Number.parseInt(product?.productID, 10);
  if (!Number.isFinite(productId) || productId <= 0) {
    return null;
  }

  const detailRes = await productApi.getDetail(productId);
  const fallbackColorId = Number.parseInt(
    detailRes?.data?.colors?.[0]?.productColorID,
    10
  );

  return Number.isFinite(fallbackColorId) && fallbackColorId > 0
    ? fallbackColorId
    : null;
}

async function addToCart(product) {
  if (isOutOfStock(product)) {
    snackbarMessage.value = "Sản phẩm đã hết hàng";
    snackbarColor.value = "warning";
    showSnackbar.value = true;
    return;
  }

  if (!userStore.isLoggedIn) {
    snackbarMessage.value = "Vui lòng đăng nhập để thêm vào giỏ hàng";
    snackbarColor.value = "warning";
    showSnackbar.value = true;

    setTimeout(() => {
      router.push("/login");
    }, 1500);
    return;
  }

  const productColorId = await resolveProductColorId(product);

  if (!productColorId) {
    snackbarMessage.value = "Không tìm thấy màu sản phẩm để thêm vào giỏ";
    snackbarColor.value = "error";
    showSnackbar.value = true;
    return;
  }

  try {
    await userStore.addToCartAPI(productColorId, 1);
    window.dispatchEvent(new Event("cart-changed"));

    snackbarMessage.value = `Đã thêm "${product.productName}" vào giỏ hàng`;
    snackbarColor.value = "success";
    showSnackbar.value = true;
  } catch (error) {
    console.error("Lỗi thêm vào giỏ:", error);
    snackbarMessage.value =
      error?.response?.data?.message ||
      "Không thể thêm vào giỏ hàng. Vui lòng thử lại";
    snackbarColor.value = "error";
    showSnackbar.value = true;
  }
}
</script>

<style scoped>
.product-card {
  transition: all 0.3s ease;
  border: 1px solid rgba(205, 186, 150, 0.1);
  border-radius: 12px;
}

.product-card:hover {
  box-shadow: 0 8px 24px rgba(205, 186, 150, 0.2);
  transform: translateY(-4px);
}

.product-image-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 12px 12px 0 0;
}

.product-image {
  border-radius: 12px 12px 0 0;
}

.discount-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
  animation: slideInDown 0.3s ease;
  z-index: 10;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.price-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.original-price {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
  font-weight: 500;
}

.discounted-price {
  font-size: 18px;
  font-weight: bold;
  color: #ff6b6b;
}

.color-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid rgba(205, 186, 150, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-btn:hover {
  border-color: #CDBA96;
  box-shadow: 0 0 8px rgba(205, 186, 150, 0.4);
  transform: scale(1.1);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.out-of-stock-chip {
  display: inline-flex;
  width: fit-content;
  align-self: flex-start;
}

:deep(.w-100) {
  width: 100%;
}
</style>