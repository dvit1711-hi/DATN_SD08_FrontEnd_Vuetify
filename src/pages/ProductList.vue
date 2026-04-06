<template>
  <v-container class="py-8" fluid>
    <!-- Header Section -->
    <div class="mb-8">
      <h1 class="text-h4 font-weight-bold mb-2">Danh sách sản phẩm</h1>
      <p class="text-subtitle-1 text-grey">
        Khám phá bộ sưu tập các sản phẩm chất lượng cao
      </p>
    </div>

    <!-- Main Content with Filter Sidebar -->
    <v-row>
      
      <!-- Filter Sidebar -->
      <v-col cols="12" sm="4" md="3" lg="2" class="mb-6 mb-md-0">
        <filter-sidebar @filter-changed="onFilterChanged" />
      </v-col>
      

      <!-- Products Grid -->
      <v-col cols="12" sm="8" md="9" lg="10">
        <div
        class="d-flex justify-space-between align-center mb-4 flex-wrap gap-3"
      >
        <div class="text-subtitle-1 font-weight-medium">
          {{ filteredProducts.length }} sản phẩm
        </div>

        <v-select
          v-model="sortBy"
          :items="[
            { title: 'Mặc định', value: 'default' },
            { title: 'Giá tăng dần', value: 'priceAsc' },
            { title: 'Giá giảm dần', value: 'priceDesc' },
          ]"
          item-title="title"
          item-value="value"
          label="Sắp xếp"
          variant="outlined"
          density="comfortable"
          hide-details
          style="max-width: 220px"
        />
      </div>
        <v-row>
          
          <v-col
            v-for="p in filteredProducts"
            :key="p.productColorID"
            cols="12"
            sm="6"
            md="6"
            lg="4"
            xl="3"
            class="d-flex"
          >
            <v-card
              class="w-100 d-flex flex-column product-card"
              :to="{
                path: `/products/${p.productID}`,
                query: { variant: p.productColorID },
              }"
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
                    Giảm
                    {{ formatCurrency(getProductDiscount(p).discountValue) }}
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
                    <div class="original-price">
                      {{ formatPrice(p.price) }}đ
                    </div>
                    <div class="discounted-price">
                      {{ formatPrice(getDiscountedPrice(p)) }}đ
                    </div>
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
                  {{ isOutOfStock(p) ? "Hết hàng" : "Thêm giỏ" }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <!-- Empty State -->
        <v-empty-state
          v-if="filteredProducts.length === 0"
          title="Không có sản phẩm"
          text="Thử điều chỉnh lại bộ lọc"
          icon="mdi-inbox"
        />

        <!-- No Results Found -->
        <div
          v-if="products.length > 0 && filteredProducts.length === 0"
          class="text-center pa-8"
        >
          <p class="text-h6" style="color: #999">
            Không tìm thấy sản phẩm phù hợp với bộ lọc của bạn
          </p>
        </div>
      </v-col>
    </v-row>

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
import { ref, onMounted, watch, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "@/stores/user";
import FilterSidebar from "@/components/FilterSidebar.vue";
import productApi from "@/api/productApi";
import productColorApi from "@/api/productColorApi";
import ReviewApi from "@/api/ReviewApi";
import { getActiveProductDiscounts } from "@/api/productDiscountApi";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const products = ref([]);
const discountMap = ref(new Map());
const productRatingsMap = ref(new Map());
const showSnackbar = ref(false);
const snackbarMessage = ref("");
const snackbarColor = ref("success");
const sortBy = ref("default");

// Filter state
const activeFilters = ref({
  priceRange: [0, 10000000],
  brands: [],
  colors: [],
  materials: [],
  sizes: [],
  ratings: [],
});

// Computed filtered products
const filteredProducts = computed(() => {
  const filtered = products.value.filter((product) => {
    const productPrice = Number(product.price) || 0;

    if (
      productPrice < activeFilters.value.priceRange[0] ||
      productPrice > activeFilters.value.priceRange[1]
    ) {
      return false;
    }

    if (
      activeFilters.value.brands.length > 0 &&
      !activeFilters.value.brands.includes(Number(product.brandID))
    ) {
      return false;
    }

    if (
      activeFilters.value.colors.length > 0 &&
      !activeFilters.value.colors.includes(Number(product.colorID))
    ) {
      return false;
    }

    if (
      activeFilters.value.materials.length > 0 &&
      !activeFilters.value.materials.includes(Number(product.materialID))
    ) {
      return false;
    }

    if (
      activeFilters.value.sizes.length > 0 &&
      !activeFilters.value.sizes.includes(Number(product.sizeID))
    ) {
      return false;
    }

    if (activeFilters.value.ratings.length > 0) {
      const productId = Number(product.productID);
      const productRating = productRatingsMap.value.get(productId) || 0;

      const matchedRating = activeFilters.value.ratings.some(
        (star) => productRating >= star,
      );

      if (!matchedRating) {
        return false;
      }
    }

    return true;
  });

  const sorted = [...filtered];

  switch (sortBy.value) {
    case "priceAsc":
      sorted.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
      break;

    case "priceDesc":
      sorted.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
      break;

    case "bestSeller":
      sorted.sort(
        (a, b) => Number(b.soldQuantity || 0) - Number(a.soldQuantity || 0),
      );
      break;

    default:
      break;
  }

  return sorted;
});

const loadProducts = async () => {
  try {
    const keyword = route.query.search?.toString().trim() || "";
    const [res, stockRes, discountRes] = await Promise.all([
      productApi.getAllCard(keyword),
      productColorApi.getAll(),
      getActiveProductDiscounts().catch((error) => {
        // Handle 401 error gracefully - return empty discounts
        if (error?.response?.status === 401) {
          console.warn(
            "Không có quyền truy cập danh sách giảm giá, tiếp tục mà không loại giảm giá",
          );
          return { data: [] };
        }
        throw error;
      }),
    ]);

    const stockMap = new Map();
    (stockRes.data || []).forEach((pc) => {
      const productColorId = Number.parseInt(pc.productColorID ?? pc.id, 10);
      if (Number.isFinite(productColorId)) {
        stockMap.set(
          productColorId,
          Number.parseInt(pc.stockQuantity, 10) || 0,
        );
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
      productID: Number(p.productID),
      productColorID: Number(p.productColorID),
      brandID: Number(p.brandID),
      colorID: Number(p.colorID),
      materialID: Number(p.materialID),
      sizeID: Number(p.sizeID),
      price: Number(p.price) || 0,
      stockQuantity: stockMap.get(Number.parseInt(p.productColorID, 10)) ?? 0,
    }));

    // Load ratings for all products
    await loadProductRatings();
  } catch (error) {
    console.error("Lỗi tải sản phẩm:", error);
    products.value = [];
  }
};

const loadProductRatings = async () => {
  try {
    const reviewsRes = await ReviewApi.getAllReviews();
    const reviews = reviewsRes.data || [];

    // Calculate average rating for each product
    const productRatings = new Map();

    reviews.forEach((review) => {
      const productId = review.productID?.id || review.productID;
      if (!productRatings.has(productId)) {
        productRatings.set(productId, { total: 0, count: 0 });
      }

      const current = productRatings.get(productId);
      current.total += review.rating;
      current.count += 1;
    });

    // Convert to average ratings
    productRatings.forEach((value, key) => {
      const avgRating = value.count > 0 ? value.total / value.count : 0;
      productRatingsMap.value.set(key, Math.round(avgRating));
    });
  } catch (error) {
    console.error("Lỗi tải đánh giá sản phẩm:", error);
  }
};

const onFilterChanged = (filters) => {
  activeFilters.value = filters;
};

onMounted(async () => {
  await loadProducts();
});

watch(
  () => route.query.search,
  async () => {
    await loadProducts();
  },
);

const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN").format(price);
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
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

  if (discount.discountType === "percent") {
    const discountPercent = Number.parseFloat(discount.discountValue) || 0;
    const discountAmount = price * (discountPercent / 100);
    const maxDiscount =
      Number.parseFloat(discount.maxDiscountValue) || Infinity;
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
    10,
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
  color: #000000;
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
  border: 2px solid rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-btn:hover {
  border-color: #000000;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.4);
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
