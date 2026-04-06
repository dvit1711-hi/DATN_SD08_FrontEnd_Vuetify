<template>
  <v-container class="py-8" v-if="product">
    <v-row>
      <v-col cols="2">
        <v-row class="gap-2">
          <v-img
            v-for="(img, index) in images"
            :key="index"
            :src="img"
            height="80"
            width="80"
            class="thumb-img rounded cursor-pointer"
            :class="{ 'thumb-active': mainImage === img }"
            @click="mainImage = img"
          />
        </v-row>
      </v-col>

      <v-col cols="5">
        <v-img :src="mainImage" height="500" class="rounded" contain />
      </v-col>

      <v-col cols="5">
        <div>
          <h1 class="text-h4 font-weight-bold mb-2">
            {{ product.productName }}
          </h1>
          <p class="text-body-2 text-grey mb-2">
            Mã sản phẩm: #{{ product.productID }}
          </p>
          <p class="text-body-2 text-grey mb-1">
            Chất liệu: {{ product.materialName || "—" }}
          </p>
          <p class="text-body-2 text-grey mb-3">
            Thương hiệu: {{ product.brandName || "—" }}
          </p>

          <div class="price mb-4">
            <div
              v-if="getVariantDiscount(selectedVariant)"
              class="price-section"
            >
              <div class="original-price">
                {{ formatPrice(selectedVariant?.price || 0) }}đ
              </div>
              <div class="discounted-price">
                {{ formatPrice(getDiscountedVariantPrice(selectedVariant)) }}đ
              </div>
            </div>
            <div v-else class="text-h5 font-weight-bold text-primary">
              {{ formatPrice(selectedVariant?.price || 0) }}đ
            </div>
          </div>

          <v-alert
            v-if="isSelectedVariantOutOfStock"
            type="warning"
            variant="tonal"
            density="comfortable"
            icon="mdi-alert-circle"
            class="mb-4"
            text="Biến thể đã chọn hiện đang hết hàng"
          />

          <!-- Chọn màu -->
          <div class="mb-4">
            <h3 class="text-subtitle-1 font-weight-bold mb-2">Chọn màu</h3>
            <div class="d-flex gap-2 flex-wrap">
              <div class="mb-4">
                <h3 class="text-subtitle-1 font-weight-bold mb-2">Chọn màu</h3>
                <div class="d-flex gap-3 flex-wrap">
                  <button
                    v-for="color in uniqueColors"
                    :key="color.colorID"
                    class="color-dot-btn"
                    :class="{ active: selectedColorId === color.colorID }"
                    :title="color.colorName"
                    @click="selectColor(color.colorID)"
                  >
                    <span
                      class="color-dot"
                      :style="{ backgroundColor: color.colorCode }"
                    ></span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Chọn size -->
          <div class="mb-4" v-if="availableSizes.length > 0">
            <div class="d-flex align-center gap-2 mb-2">
              <h3 class="text-subtitle-1 font-weight-bold">
                Chọn kích thước
              </h3>
              <v-btn
                icon="mdi-information"
                size="x-small"
                variant="text"
                @click="openSizeDialog"
                title="Hướng dẫn chọn size"
              />
            </div>
            <div class="d-flex gap-2 flex-wrap">
              <button
                v-for="variant in availableSizes"
                :key="variant.productColorID"
                class="size-btn"
                :class="{
                  active:
                    selectedVariant?.productColorID === variant.productColorID,
                }"
                @click="selectVariant(variant)"
              >
                {{ variant.sizeName || "—" }}
              </button>
            </div>
          </div>

          <div class="mb-4">
            <h3 class="text-subtitle-1 font-weight-bold mb-2">Số lượng</h3>
            <v-text-field
              v-model.number="quantity"
              type="number"
              min="1"
              :max="selectedVariantStock > 0 ? selectedVariantStock : 1"
              outlined
              dense
              :disabled="isSelectedVariantOutOfStock"
              style="max-width: 150px"
            />
          </div>

          <v-row class="gap-3">
            <v-col cols="6">
              <v-btn
                color="primary"
                block
                @click="handleAddToCart"
                :loading="isLoading"
                :disabled="isLoading || isSelectedVariantOutOfStock"
              >
                <v-icon left>mdi-shopping-cart</v-icon>
                {{
                  isSelectedVariantOutOfStock ? "Hết hàng" : "Thêm vào giỏ hàng"
                }}
              </v-btn>
            </v-col>
            <v-col cols="6">
              <v-btn
                color="secondary"
                block
                outlined
                @click="handleBuyNow"
                :loading="isLoading"
                :disabled="isLoading || isSelectedVariantOutOfStock"
              >
                {{ isSelectedVariantOutOfStock ? "Hết hàng" : "Mua ngay" }}
              </v-btn>
            </v-col>
          </v-row>

          <v-card class="mt-4 pa-4" outlined>
            <h3 class="text-subtitle-1 font-weight-bold mb-2">
              Mô tả sản phẩm
            </h3>
            <p>{{ product.description || "Không có mô tả" }}</p>
          </v-card>
        </div>
      </v-col>
    </v-row>

    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      timeout="3000"
      top
    >
      {{ snackbarMessage }}
    </v-snackbar>

    <!-- Size Guide Dialog -->
    <v-dialog v-model="sizeDialog" max-width="980px">
  <v-card class="size-guide-dialog">
    <div class="size-guide-header">
      <div class="size-guide-title">HƯỚNG DẪN CHỌN SIZE</div>
      <v-btn
        icon="mdi-close"
        variant="text"
        size="small"
        @click="sizeDialog = false"
      />
    </div>

    <v-divider />

    <div class="size-guide-body">
      <!-- Bên trái: chữ + ảnh -->
      <div class="size-guide-left">
        <div class="size-guide-subtitle">Cách lấy kích thước:</div>
        <p class="size-guide-text">
          Dùng thước đo quanh đầu, đo từ điểm A (giữa trán)
          đến hết chu vi đầu của bạn.
        </p>

        <div class="size-guide-image-wrap">
          <img
            src="/images/HuongDanLaySize.png"
            alt="Hướng dẫn đo size"
            class="size-guide-image"
          />
        </div>
      </div>

      <!-- Bên phải: bảng -->
      <div class="size-guide-right">
        <table class="size-guide-table">
          <thead>
            <tr>
              <th>SIZE</th>
              <th v-for="size in sizes" :key="size.sizeID">
                {{ size.sizeName }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Chu vi đầu <span>(cm)</span></td>
              <td v-for="size in sizes" :key="`head-${size.sizeID}`">
                {{ formatSizeValue(size.sizeDescription) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="size-guide-footer">
      <v-btn variant="text" @click="sizeDialog = false">Đóng</v-btn>
    </div>
  </v-card>
</v-dialog>

    <v-row class="mt-8">
      <v-col cols="12" md="3">
        <v-card class="sticky-card" elevation="0" border>
          <v-card-item>
            <div class="text-subtitle2 font-weight-bold mb-2">
              Tổng quan đánh giá
            </div>
            <div class="d-flex align-center gap-2 mb-2">
              <div class="text-h5 font-weight-bold">
                {{ averageRating.toFixed(1) }}
              </div>
              <v-rating
                :model-value="averageRating"
                readonly
                size="small"
                color="amber"
              />
            </div>
            <div class="text-caption text-grey mb-4">
              {{ totalReviews }} đánh giá
            </div>

            <div>
              <button
                class="star-filter-btn all-reviews-btn"
                :class="{ active: selectedStarFilter === null }"
                @click="selectedStarFilter = null"
              >
                <v-icon icon="mdi-check-all" size="small" class="mr-1" />
                Tất cả
              </button>
              <button
                v-for="star in [5, 4, 3, 2, 1]"
                :key="star"
                class="star-filter-btn"
                :class="{ active: selectedStarFilter === star }"
                @click="
                  selectedStarFilter = selectedStarFilter === star ? null : star
                "
              >
                {{ star }} <v-icon icon="mdi-star" size="small" />
              </button>
            </div>
          </v-card-item>
        </v-card>
      </v-col>

      <v-col cols="12" md="9">
        <div v-if="reviews.length > 0" class="reviews-container">
          <div class="reviews-wrapper pa-6">
            <h2 class="text-h6 font-weight-bold mb-4">
              Đánh giá từ khách hàng
            </h2>

            <div class="reviews-list">
              <v-card
                v-for="review in paginatedReviews"
                :key="review.id"
                class="review-card mb-4"
                elevation="0"
                border
              >
                <v-card-item class="pa-4">
                  <div class="d-flex gap-3">
                    <div class="review-avatar-wrapper">
                      <v-avatar size="48" class="review-avatar">
                        <v-img
                          :src="
                            review.userAvatar ||
                            getDefaultAvatar(review.username)
                          "
                          :alt="review.username"
                          cover
                        />
                      </v-avatar>
                    </div>

                    <div class="flex-grow-1">
                      <div
                        class="d-flex align-center justify-space-between mb-2"
                      >
                        <div>
                          <div class="font-weight-bold text-body-1">
                            {{ review.username }}
                          </div>
                          <div class="text-caption text-grey">
                            {{ formatDate(review.createdAt) }}
                          </div>
                        </div>
                      </div>

                      <v-rating
                        :model-value="review.rating"
                        readonly
                        size="x-small"
                        color="amber"
                        class="mb-2"
                      />

                      <p class="text-body-2 mb-0 review-comment">
                        {{ review.comment }}
                      </p>
                    </div>
                  </div>
                </v-card-item>
              </v-card>
            </div>

            <div class="d-flex justify-center mt-6">
              <v-pagination
                v-model="currentPage"
                :length="totalPages"
                :total-visible="5"
                color="primary"
                size="small"
              />
            </div>
          </div>
        </div>

        <div v-else class="reviews-wrapper pa-8 text-center">
          <v-icon icon="mdi-folder-open-outline" size="64" class="text-grey" />
          <p class="text-body-2 text-grey mt-4">Chưa có đánh giá nào</p>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import productApi from "@/api/productApi";
import reviewApi from "@/api/ReviewApi";
import sizeApi from "@/api/sizeApi";
import { getActiveProductDiscounts } from "@/api/productDiscountApi";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const product = ref(null);
const images = ref([]);
const mainImage = ref("");
const selectedVariant = ref(null);
const selectedColorId = ref(null);
const quantity = ref(1);
const isLoading = ref(false);
const showSnackbar = ref(false);
const snackbarMessage = ref("");
const snackbarColor = ref("success");
const discountMap = ref(new Map());

const reviews = ref([]);
const averageRating = ref(0);
const totalReviews = ref(0);
const selectedStarFilter = ref(null);
const currentPage = ref(1);
const itemsPerPage = 5;

const sizeDialog = ref(false);
const sizes = ref([]);
const loadingSizes = ref(false);
const sizeHeaders = [
  { title: 'Tên Size', key: 'sizeName' },
  { title: 'Mô Tả', key: 'sizeDescription' },
];
const formatSizeValue = (description) => {
  return description || "-";
};

const selectedVariantStock = computed(
  () => Number.parseInt(selectedVariant.value?.stockQuantity, 10) || 0,
);

const isSelectedVariantOutOfStock = computed(
  () => selectedVariantStock.value <= 0,
);

const uniqueColors = computed(() => {
  if (!product.value?.colors?.length) return [];

  const map = new Map();

  product.value.colors.forEach((variant) => {
    if (!map.has(variant.colorID)) {
      map.set(variant.colorID, {
        colorID: variant.colorID,
        colorName: variant.colorName,
        colorCode: variant.colorCode,
      });
    }
  });

  return Array.from(map.values());
});

const availableSizes = computed(() => {
  if (!product.value?.colors?.length || !selectedColorId.value) return [];
  return product.value.colors.filter(
    (variant) => Number(variant.colorID) === Number(selectedColorId.value),
  );
});

function applySelectedVariant(variant) {
  selectedVariant.value = variant;
  images.value = variant?.images || [];
  mainImage.value = images.value[0] || "";
  if (quantity.value < 1) quantity.value = 1;
  if (
    selectedVariantStock.value > 0 &&
    quantity.value > selectedVariantStock.value
  ) {
    quantity.value = selectedVariantStock.value;
  }
}

function selectColor(colorID) {
  selectedColorId.value = colorID;

  const sizesOfColor = availableSizes.value;
  if (!sizesOfColor.length) return;

  const requestedVariantId = Number.parseInt(route.query.variant, 10);

  let matched = null;

  if (Number.isFinite(requestedVariantId) && requestedVariantId > 0) {
    matched = sizesOfColor.find(
      (v) => Number(v.productColorID) === requestedVariantId,
    );
  }

  if (!matched) {
    matched =
      sizesOfColor.find(
        (v) => (Number.parseInt(v.stockQuantity, 10) || 0) > 0,
      ) || sizesOfColor[0];
  }

  applySelectedVariant(matched);
}

function selectVariant(variant) {
  applySelectedVariant(variant);
}

onMounted(async () => {
  try {
    const productID = route.params.id;
    const [res, discountRes] = await Promise.all([
      productApi.getDetail(productID),
      getActiveProductDiscounts(),
    ]);

    product.value = res.data;

    discountMap.value = new Map();
    (discountRes.data || []).forEach((discount) => {
      const productColorId = Number.parseInt(discount.productColorId, 10);
      if (Number.isFinite(productColorId)) {
        discountMap.value.set(productColorId, discount);
      }
    });

    if (product.value?.colors?.length) {
      const requestedVariantId = Number.parseInt(route.query.variant, 10);

      let initialVariant = null;

      if (Number.isFinite(requestedVariantId) && requestedVariantId > 0) {
        initialVariant = product.value.colors.find(
          (v) => Number(v.productColorID) === requestedVariantId,
        );
      }

      if (!initialVariant) {
        initialVariant =
          product.value.colors.find(
            (v) => (Number.parseInt(v.stockQuantity, 10) || 0) > 0,
          ) || product.value.colors[0];
      }

      selectedColorId.value = initialVariant.colorID;
      applySelectedVariant(initialVariant);
    }

    await loadReviews(productID);
  } catch (error) {
    console.error(error);
  }
});

watch(
  () => route.query.variant,
  (newVariantId) => {
    if (!product.value?.colors?.length) return;

    const variantId = Number.parseInt(newVariantId, 10);
    if (!Number.isFinite(variantId) || variantId <= 0) return;

    const matchedVariant = product.value.colors.find(
      (v) => Number(v.productColorID) === variantId,
    );

    if (matchedVariant) {
      selectedColorId.value = matchedVariant.colorID;
      applySelectedVariant(matchedVariant);
    }
  },
);

watch(selectedStarFilter, () => {
  currentPage.value = 1;
});

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(Number(price) || 0);
}

const getVariantDiscount = (variant) => {
  if (!variant) return null;
  const productColorId = Number.parseInt(variant.productColorID, 10);
  if (!Number.isFinite(productColorId)) return null;
  return discountMap.value.get(productColorId) || null;
};

const getDiscountedVariantPrice = (variant) => {
  const discount = getVariantDiscount(variant);
  if (!discount) return variant?.price || 0;

  const price = Number.parseFloat(variant.price) || 0;

  if (discount.discountType === "percent") {
    const discountPercent = Number.parseFloat(discount.discountValue) || 0;
    const discountAmount = price * (discountPercent / 100);
    const maxDiscount =
      Number.parseFloat(discount.maxDiscountValue) || Infinity;
    const actualDiscount = Math.min(discountAmount, maxDiscount);
    return Math.max(0, price - actualDiscount);
  } else {
    const discountAmount = Number.parseFloat(discount.discountValue) || 0;
    return Math.max(0, price - discountAmount);
  }
};

const loadReviews = async (productID) => {
  try {
    const response = await reviewApi.getReviewsByProductId(productID);
    reviews.value = response.data || [];
    await loadRatingStats(productID);
  } catch (error) {
    console.error("Failed to load reviews:", error);
    reviews.value = [];
  }
};

const loadRatingStats = async (productID) => {
  try {
    const avgResponse = await reviewApi.getAverageRatingForProduct(productID);
    const totalResponse = await reviewApi.getTotalReviewsForProduct(productID);
    averageRating.value = avgResponse.data || 0;
    totalReviews.value = totalResponse.data || 0;
  } catch (error) {
    console.error("Failed to load rating stats:", error);
  }
};

const loadSizes = async () => {
  loadingSizes.value = true;
  try {
    const response = await sizeApi.getAllActive();
    sizes.value = response.data || [];
  } catch (error) {
    console.error("Failed to load sizes:", error);
    sizes.value = [];
  } finally {
    loadingSizes.value = false;
  }
};

const openSizeDialog = async () => {
  await loadSizes();
  sizeDialog.value = true;
};

const filteredReviews = computed(() => {
  if (!selectedStarFilter.value) return reviews.value;
  return reviews.value.filter((r) => r.rating === selectedStarFilter.value);
});

const totalPages = computed(() => {
  return Math.ceil(filteredReviews.value.length / itemsPerPage) || 1;
});

const paginatedReviews = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredReviews.value.slice(start, end);
});

const getDefaultAvatar = (username) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=667eea&color=fff&bold=true`;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

async function handleAddToCart() {
  if (!userStore.isLoggedIn) {
    snackbarMessage.value = "Vui lòng đăng nhập để thêm vào giỏ hàng";
    snackbarColor.value = "warning";
    showSnackbar.value = true;
    setTimeout(() => router.push("/login"), 1500);
    return;
  }

  if (!selectedVariant.value) {
    snackbarMessage.value = "Vui lòng chọn biến thể";
    snackbarColor.value = "error";
    showSnackbar.value = true;
    return;
  }

  if (isSelectedVariantOutOfStock.value) {
    snackbarMessage.value = "Biến thể đã chọn đang hết hàng";
    snackbarColor.value = "warning";
    showSnackbar.value = true;
    return;
  }

  if (quantity.value < 1 || quantity.value > selectedVariantStock.value) {
    snackbarMessage.value = "Số lượng không hợp lệ";
    snackbarColor.value = "error";
    showSnackbar.value = true;
    return;
  }

  isLoading.value = true;
  try {
    await userStore.addToCartAPI(
      selectedVariant.value.productColorID,
      quantity.value,
    );
    window.dispatchEvent(new Event("cart-changed"));

    const variantLabel = `${selectedVariant.value.colorName || ""} - Size ${selectedVariant.value.sizeName || "-"}`;
    snackbarMessage.value = `Đã thêm ${quantity.value} sản phẩm "${product.value.productName}" (${variantLabel}) vào giỏ hàng`;
    snackbarColor.value = "success";
    showSnackbar.value = true;
    quantity.value = 1;
  } catch (error) {
    console.error("Lỗi thêm vào giỏ:", error);
    snackbarMessage.value = "Thêm vào giỏ hàng thất bại. Vui lòng thử lại";
    snackbarColor.value = "error";
    showSnackbar.value = true;
  } finally {
    isLoading.value = false;
  }
}

async function handleBuyNow() {
  if (!userStore.isLoggedIn) {
    snackbarMessage.value = "Vui lòng đăng nhập để mua hàng";
    snackbarColor.value = "warning";
    showSnackbar.value = true;
    setTimeout(() => router.push("/login"), 1200);
    return;
  }

  if (!selectedVariant.value) {
    snackbarMessage.value = "Vui lòng chọn biến thể";
    snackbarColor.value = "error";
    showSnackbar.value = true;
    return;
  }

  if (isSelectedVariantOutOfStock.value) {
    snackbarMessage.value = "Biến thể đã chọn đang hết hàng";
    snackbarColor.value = "warning";
    showSnackbar.value = true;
    return;
  }

  if (quantity.value < 1 || quantity.value > selectedVariantStock.value) {
    snackbarMessage.value = "Số lượng không hợp lệ";
    snackbarColor.value = "error";
    showSnackbar.value = true;
    return;
  }

  isLoading.value = true;
  try {
    const addedItem = await userStore.addToCartAPI(
      selectedVariant.value.productColorID,
      quantity.value,
    );

    const addedCartItemId = Number.parseInt(
      addedItem?.id ?? addedItem?.cartItemID,
      10,
    );

    if (Number.isFinite(addedCartItemId) && addedCartItemId > 0) {
      sessionStorage.setItem(
        "selectedCartItemIds",
        JSON.stringify([addedCartItemId]),
      );
      window.dispatchEvent(new Event("cart-changed"));
      router.push({ name: "Checkout" });
      return;
    }

    snackbarMessage.value =
      "Đã thêm vào giỏ. Vui lòng chọn sản phẩm trong giỏ để thanh toán";
    snackbarColor.value = "warning";
    showSnackbar.value = true;
    window.dispatchEvent(new Event("cart-changed"));
    setTimeout(() => {
      router.push({ name: "Cart" });
    }, 800);
  } catch (error) {
    console.error("Lỗi mua ngay:", error);
    snackbarMessage.value = "Không thể xử lý mua ngay. Vui lòng thử lại";
    snackbarColor.value = "error";
    showSnackbar.value = true;
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.thumb-img {
  border: 2px solid rgba(205, 186, 150, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background-color: #f9f9f9;
}
.thumb-img:hover {
  border-color: #cdba96;
  box-shadow: 0 0 6px rgba(205, 186, 150, 0.4);
}
.thumb-active {
  border-color: #cdba96;
  box-shadow: 0 0 8px rgba(205, 186, 150, 0.5);
}

.variant-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #ddd;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.variant-btn:hover {
  border-color: #cdba96;
}

.variant-btn-active {
  border-color: #cdba96;
  box-shadow: 0 0 6px rgba(205, 186, 150, 0.35);
}

.variant-color {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid #ccc;
  display: inline-block;
}

.sticky-card {
  position: sticky;
  top: 20px;
}

.star-filter-btn {
  display: block;
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 8px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  font-size: 0.875rem;
  color: #666;
}

.star-filter-btn:hover {
  background: #f9f9f9;
}

.star-filter-btn.active {
  background: #ffeaa7;
  border-color: #ffd700;
  color: #333;
  font-weight: 500;
}

.all-reviews-btn.active {
  background: #c8e6c9;
  border-color: #4caf50;
  color: #2e7d32;
  font-weight: 500;
}

.reviews-container {
  margin-top: 2rem;
}

.reviews-wrapper {
  background-color: #f5f5f5;
  border-radius: 8px;
  animation: slideUp 0.3s ease-in;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.reviews-list {
  animation: fadeIn 0.3s ease-in;
}

.review-card {
  transition: all 0.3s ease;
  background: #ffffff;
}

.review-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.review-avatar-wrapper {
  display: flex;
  align-items: center;
}

.review-avatar {
  border: 2px solid #ddd;
  transition: all 0.3s ease;
}

.review-card:hover .review-avatar {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.review-comment {
  line-height: 1.6;
  color: #424242;
  word-break: break-word;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
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
  font-size: 16px;
  color: #999;
  text-decoration: line-through;
  font-weight: 500;
}

.discounted-price {
  font-size: 24px;
  font-weight: bold;
  color: #ff6b6b;
}
.color-dot-btn {
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-dot {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid #cfcfcf;
  transition: all 0.2s ease;
}

.color-dot-btn:hover .color-dot {
  transform: scale(1.08);
  border-color: #111;
}

.color-dot-btn.active .color-dot {
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.12);
  border-color: #111;
}
.size-btn {
  min-width: 56px;
  height: 40px;
  border-radius: 20px;
  border: 1px solid #d8d8d8;
  background: #fff;
  color: #111;
  padding: 0 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.size-btn:hover:not(:disabled) {
  border-color: #111;
}

.size-btn.active {
  background: #111;
  color: #fff;
  border-color: #111;
}

.size-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.size-guide-dialog {
  border-radius: 8px;
  overflow: hidden;
}

.size-guide-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px 12px;
}

.size-guide-title {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.3px;
  color: #222;
}

.size-guide-body {
  display: grid;
  grid-template-columns: 0.95fr 1.55fr;
  gap: 24px;
  padding: 18px 22px 8px;
  align-items: start;
}

.size-guide-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.size-guide-subtitle {
  font-size: 15px;
  font-weight: 700;
  color: #222;
}

.size-guide-text {
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  margin: 0;
  max-width: 260px;
}

.size-guide-image-wrap {
  margin-top: 8px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.size-guide-image {
  width: 220px;
  max-width: 100%;
  height: auto;
  object-fit: contain;
}

.size-guide-right {
  width: 100%;
}

.size-guide-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.size-guide-table thead th {
  background: #2f2f2f;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  text-align: center;
  padding: 14px 10px;
  border: 1px solid #777;
}

.size-guide-table tbody td {
  border: 1px solid #999;
  text-align: center;
  padding: 18px 12px;
  font-size: 15px;
  color: #222;
  vertical-align: middle;
}

.size-guide-table tbody td:first-child {
  font-weight: 700;
  width: 180px;
}

.size-guide-table tbody td:first-child span {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #666;
  margin-top: 2px;
}

.size-guide-footer {
  display: flex;
  justify-content: flex-end;
  padding: 10px 18px 16px;
}

@media (max-width: 900px) {
  .size-guide-body {
    grid-template-columns: 1fr;
  }

  .size-guide-text {
    max-width: 100%;
  }

  .size-guide-image-wrap {
    justify-content: center;
  }
}
</style>
