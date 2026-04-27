<template>
  <v-container
    class="py-8 px-md-6 px-lg-10 product-detail-page"
    v-if="product"
    fluid
  >
    <v-row>
      <!-- CỘT TRÁI: ẢNH -->
      <v-col cols="7">
        <v-row>
          <!-- Thumbnail bên trái -->
          <v-col cols="2">
            <div class="d-flex flex-column ga-2">
              <v-img
                v-for="img in images"
                :key="img.imageID || img.imageUrl"
                :src="img.imageUrl"
                height="96"
                width="96"
                class="thumb-img rounded cursor-pointer"
                :class="{ 'thumb-active': mainImage === img.imageUrl }"
                @click="mainImage = img.imageUrl"
              />
            </div>
          </v-col>

          <!-- Ảnh chính -->
          <v-col cols="10">
            <div class="main-image-wrap">
              <v-icon
                v-if="images.length > 1"
                class="image-nav-icon image-nav-icon--left"
                @click="showPrevImage"
              >
                mdi-chevron-left
              </v-icon>

              <v-img
                :src="mainImage"
                height="560"
                class="rounded main-product-image"
                contain
              />

              <v-icon
                v-if="images.length > 1"
                class="image-nav-icon image-nav-icon--right"
                @click="showNextImage"
              >
                mdi-chevron-right
              </v-icon>
            </div>
          </v-col>
          <!-- TAB CHI TIẾT -->
          <ProductDetailTabs
            :product="product"
            :selected-variant="selectedVariant"
          />
        </v-row>
      </v-col>

      <!-- CỘT PHẢI: THÔNG TIN MUA HÀNG -->
      <v-col cols="5">
        <div>
          <h1 class="text-h4 font-weight-bold mb-2">
            {{ product.productName }}
          </h1>

          <p class="text-body-2 text-grey mb-2">
            Mã sản phẩm: #{{ product.productID }}
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
            text="Sản phẩm đã chọn hiện đang hết hàng"
          />

          <!-- Chọn màu -->
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

          <!-- Chọn size -->
          <div class="mb-4" v-if="availableSizes.length > 0">
            <div class="d-flex align-center gap-2 mb-2">
              <h3 class="text-subtitle-1 font-weight-bold">Chọn kích thước</h3>

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
          <!-- Tồn kho -->
          <div class="mb-4" v-if="selectedVariant">
            <h3 class="text-subtitle-1 font-weight-bold mb-2">
              Tình trạng kho
            </h3>

            <div class="stock-info">
              <span class="stock-label">Số lượng có sẵn: </span>
              <span
                class="stock-value"
                :class="selectedVariantStock > 0 ? 'in-stock' : 'out-stock'"
              >
                {{
                  selectedVariantStock > 0
                    ? `${selectedVariantStock} sản phẩm`
                    : "Hết hàng"
                }}
              </span>
            </div>

            <div
              v-if="selectedVariantStock > 0 && selectedVariantStock <= 10"
              class="stock-note text-red-darken-2"
            >
              Chỉ còn {{ selectedVariantStock }} sản phẩm, hãy đặt sớm
            </div>
          </div>

          <!-- Số lượng -->
          <div class="mb-4">
            <h3 class="text-subtitle-1 font-weight-bold mb-2">Số lượng</h3>

            <v-text-field
              v-model.number="quantity"
              type="number"
              min="1"
              :max="selectedVariantStock > 0 ? selectedVariantStock : 1"
              variant="outlined"
              density="comfortable"
              :disabled="isSelectedVariantOutOfStock"
              style="max-width: 150px"
            />
          </div>

          <!-- Nút hành động -->
          <v-row class="gap-3">
            <v-col cols="6">
              <v-btn
                color="primary"
                block
                @click="handleAddToCart"
                :loading="isLoading"
                :disabled="isLoading || isSelectedVariantOutOfStock"
              >
                <v-icon start>mdi-shopping-cart</v-icon>
                {{
                  isSelectedVariantOutOfStock ? "Hết hàng" : "Thêm vào giỏ hàng"
                }}
              </v-btn>
            </v-col>

            <v-col cols="6">
              <v-btn
                color="black"
                block
                variant="outlined"
                @click="handleBuyNow"
                :loading="isLoading"
                :disabled="isLoading || isSelectedVariantOutOfStock"
              >
                {{ isSelectedVariantOutOfStock ? "Hết hàng" : "Mua ngay" }}
              </v-btn>
            </v-col>
          </v-row>
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
          <div class="size-guide-left">
            <div class="size-guide-subtitle">Cách lấy kích thước:</div>
            <p class="size-guide-text">
              Dùng thước đo quanh đầu, đo từ điểm A (giữa trán) đến hết chu vi
              đầu của bạn.
            </p>

            <div class="size-guide-image-wrap">
              <img
                src="/images/HuongDanLaySize.png"
                alt="Hướng dẫn đo size"
                class="size-guide-image"
              />
            </div>
          </div>

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

    <!-- REVIEW -->
    <ProductReviews v-if="product?.productID" :product-id="product.productID" />
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import productApi from "@/api/productApi";
import sizeApi from "@/api/sizeApi";
import { getById as getProductColorById } from "@/api/productColorApi";
import { getActiveProductDiscounts } from "@/api/productDiscountApi";
import ProductDetailTabs from "@/components/product/ProductDetailTabs.vue";
import ProductReviews from "@/components/product/ProductReviews.vue";

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

const sizeDialog = ref(false);
const sizes = ref([]);
const loadingSizes = ref(false);

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
  
  // Check if variant has images, if not, try to load from API
  if (Array.isArray(variant?.images) && variant.images.length > 0) {
    images.value = variant.images;
  } else if (variant?.productColorID) {
    // Load images from API for this color variant
    getProductColorById(variant.productColorID)
      .then((res) => {
        const colorData = res.data;
        images.value = Array.isArray(colorData?.images) ? colorData.images : [];
        
        const main = images.value.find((img) => img?.isMain);
        mainImage.value = main?.imageUrl || images.value[0]?.imageUrl || "";
      })
      .catch((error) => {
        console.error("Failed to load color variant images:", error);
        images.value = [];
        mainImage.value = "";
      });
    
    // Set main image to empty initially until images are loaded
    mainImage.value = "";
  } else {
    images.value = [];
    mainImage.value = "";
  }

  const main = images.value.find((img) => img?.isMain);
  if (main?.imageUrl) {
    mainImage.value = main.imageUrl;
  } else if (images.value.length > 0) {
    mainImage.value = images.value[0]?.imageUrl || "";
  }

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
  }

  const discountAmount = Number.parseFloat(discount.discountValue) || 0;
  return Math.max(0, price - discountAmount);
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

async function handleAddToCart() {
  if (!userStore.isLoggedIn) {
    snackbarMessage.value = "Vui lòng đăng nhập để thêm vào giỏ hàng";
    snackbarColor.value = "warning";
    showSnackbar.value = true;
    setTimeout(() => router.push("/login"), 1500);
    return;
  }

  if (!selectedVariant.value) {
    snackbarMessage.value = "Vui lòng chọn sản phẩm";
    snackbarColor.value = "error";
    showSnackbar.value = true;
    return;
  }

  if (isSelectedVariantOutOfStock.value) {
    snackbarMessage.value = "Sản phẩm đã chọn đang hết hàng";
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
function showPrevImage() {
  if (!images.value.length) return;

  const currentIndex = images.value.findIndex(
    (img) => img.imageUrl === mainImage.value,
  );
  const prevIndex =
    currentIndex <= 0 ? images.value.length - 1 : currentIndex - 1;

  mainImage.value = images.value[prevIndex]?.imageUrl || "";
}

function showNextImage() {
  if (!images.value.length) return;

  const currentIndex = images.value.findIndex(
    (img) => img.imageUrl === mainImage.value,
  );
  const nextIndex =
    currentIndex >= images.value.length - 1 ? 0 : currentIndex + 1;

  mainImage.value = images.value[nextIndex]?.imageUrl || "";
}
</script>

<style scoped src="@/assets/css/product-detail.css"></style>
