<template>
  <v-container
    class="py-8 px-md-6 px-lg-10 product-detail-page"
    v-if="product"
    fluid
  >
    <v-row>
      <!-- CỘT TRÁI: ẢNH -->
      <v-col cols="12" lg="7">
        <div class="product-gallery">
          <!-- thumbnails -->
          <div class="product-gallery__thumbs" v-if="images.length > 0">
            <button
              v-for="img in images"
              :key="img.imageID || img.imageUrl"
              type="button"
              class="gallery-thumb-btn"
              :class="{ active: mainImage === img.imageUrl }"
              @click="mainImage = img.imageUrl"
            >
              <img
                :src="img.imageUrl"
                :alt="product.productName"
                class="gallery-thumb-img"
              />
            </button>
          </div>

          <!-- main image -->
          <div class="product-gallery__main">
            <v-icon
              v-if="images.length > 1"
              class="gallery-nav-icon gallery-nav-icon--left"
              size="34"
              @click="showPrevImage"
            >
              mdi-chevron-left
            </v-icon>

            <v-img :src="mainImage" class="gallery-main-image" contain />

            <v-icon
              v-if="images.length > 1"
              class="gallery-nav-icon gallery-nav-icon--right"
              size="34"
              @click="showNextImage"
            >
              mdi-chevron-right
            </v-icon>
          </div>
        </div>

        <ProductDetailTabs
          :product="product"
          :selected-variant="selectedVariant"
        />
      </v-col>
      <!-- CỘT PHẢI: THÔNG TIN MUA HÀNG -->
      <v-col cols="12" lg="5">
        <div class="product-info-panel">
          <h1 class="product-detail-title">
            {{ product.productName }}
          </h1>

          <div class="product-style-code">
            Mã sản phẩm: #{{ product.productID }}
          </div>

          <div class="product-detail-price mb-6">
            <template v-if="getVariantDiscount(selectedVariant)">
              <div class="original-price">
                {{ formatPrice(selectedVariant?.price || 0) }}đ
              </div>
              <div class="discounted-price">
                {{ formatPrice(getDiscountedVariantPrice(selectedVariant)) }}đ
              </div>
            </template>

            <template v-else>
              <div class="current-price">
                {{ formatPrice(selectedVariant?.price || 0) }}đ
              </div>
            </template>
          </div>

          <!-- màu -->
          <div class="detail-section">
            <div class="detail-label">Chọn màu</div>

            <div class="detail-color-list">
              <button
                v-for="color in uniqueColors"
                :key="color.colorID"
                type="button"
                class="color-dot-btn"
                :class="{ active: selectedColorId === color.colorID }"
                :title="color.colorName"
                @click="selectColor(color.colorID)"
              >
                <span
                  class="color-dot"
                  :style="{ backgroundColor: color.colorCode || '#ddd' }"
                ></span>
              </button>
            </div>
          </div>

          <!-- size -->
          <div class="detail-section" v-if="availableSizes.length > 0">
            <div class="size-section-head">
              <div class="detail-label">Chọn kích thước</div>
              <button
                type="button"
                class="size-guide-link"
                @click="openSizeDialog"
              >
                <v-icon size="17" class="size-guide-link__icon"
                  >mdi-ruler</v-icon
                >
                <span>Hướng dẫn chọn kích thước</span>
              </button>
            </div>

            <div class="detail-size-list">
              <button
                v-for="variant in availableSizes"
                :key="variant.productColorID"
                type="button"
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

          <!-- tồn kho -->
          <div class="detail-section" v-if="selectedVariant">
            <div class="stock-inline">
              <span class="stock-inline__label">Tình trạng:</span>
              <span
                class="stock-inline__value"
                :class="selectedVariantStock > 0 ? 'in-stock' : 'out-stock'"
              >
                {{
                  selectedVariantStock > 0
                    ? `Còn ${selectedVariantStock} sản phẩm`
                    : "Hết hàng"
                }}
              </span>
            </div>
          </div>

          <!-- số lượng -->
          <div class="detail-section">
            <div class="detail-label">Số lượng</div>

            <v-text-field
              v-model.number="quantity"
              type="number"
              min="1"
              :max="selectedVariantStock > 0 ? selectedVariantStock : 1"
              variant="outlined"
              density="comfortable"
              hide-details
              :disabled="isSelectedVariantOutOfStock"
              class="detail-qty-input"
            />
          </div>

          <!-- button -->
          <div class="detail-action-row">
            <button
              type="button"
              class="detail-action-btn detail-action-btn--black"
              @click="handleAddToCart"
              :disabled="isLoading || isSelectedVariantOutOfStock"
            >
              {{ isSelectedVariantOutOfStock ? "HẾT HÀNG" : "THÊM VÀO GIỎ" }}
            </button>

            <button
              type="button"
              class="detail-action-btn detail-action-btn--red"
              @click="handleBuyNow"
              :disabled="isLoading || isSelectedVariantOutOfStock"
            >
              {{ isSelectedVariantOutOfStock ? "HẾT HÀNG" : "MUA NGAY" }}
            </button>
          </div>
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
import cartApi from "@/api/cartApi";
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
const QUICK_BUY_CONTEXT_KEY = "quickBuyContext";
const SELECTED_CART_ITEM_IDS_KEY = "selectedCartItemIds";

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
  images.value = Array.isArray(variant?.images) ? variant.images : [];

  const main = images.value.find((img) => img?.isMain);
  mainImage.value = main?.imageUrl || images.value[0]?.imageUrl || "";

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

const removeLatestQuickBuyItemByColor = async (productColorId) => {
  const parsedProductColorId = Number.parseInt(productColorId, 10);
  if (!Number.isFinite(parsedProductColorId) || parsedProductColorId <= 0) {
    return false;
  }

  try {
    const currentCartId = await userStore.getOrCreateCart();
    const itemRes = await cartApi.getByCart(currentCartId);
    const matchedItems = (itemRes.data || []).filter((item) => {
      const colorId = Number.parseInt(item.productColorID ?? item.productID, 10);
      return colorId === parsedProductColorId;
    });

    if (matchedItems.length === 0) {
      return false;
    }

    const latestMatchedItem = [...matchedItems].sort((a, b) => {
      const bId = Number.parseInt(b.cartItemID ?? b.id, 10) || 0;
      const aId = Number.parseInt(a.cartItemID ?? a.id, 10) || 0;
      return bId - aId;
    })[0];

    const latestId = extractCartItemId(latestMatchedItem);
    if (!latestId) {
      return false;
    }

    await cartApi.remove(latestId, userStore.token);
    window.dispatchEvent(new Event("cart-changed"));
    return true;
  } catch (error) {
    console.error("Lỗi dọn sản phẩm mua ngay tạm:", error);
    return false;
  }
};

const getLatestCartItemByColor = (items, productColorId) => {
  const parsedProductColorId = Number.parseInt(productColorId, 10);
  if (!Number.isFinite(parsedProductColorId) || parsedProductColorId <= 0) {
    return null;
  }

  const matchedItems = (items || []).filter((item) => {
    const colorId = Number.parseInt(item.productColorID ?? item.productID, 10);
    return colorId === parsedProductColorId;
  });

  if (matchedItems.length === 0) {
    return null;
  }

  return [...matchedItems].sort((a, b) => {
    const bId = Number.parseInt(b.cartItemID ?? b.id, 10) || 0;
    const aId = Number.parseInt(a.cartItemID ?? a.id, 10) || 0;
    return bId - aId;
  })[0];
};

const extractCartItemId = (payload) => {
  const candidateIds = [
    payload?.id,
    payload?.cartItemID,
    payload?.cartItemId,
    payload?.data?.id,
    payload?.data?.cartItemID,
    payload?.data?.cartItemId,
  ];

  for (const id of candidateIds) {
    const parsed = Number.parseInt(id, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
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
    const selectedProductColorId = Number.parseInt(
      selectedVariant.value.productColorID,
      10,
    );

    if (!Number.isFinite(selectedProductColorId) || selectedProductColorId <= 0) {
      throw new Error("Biến thể sản phẩm không hợp lệ");
    }

    const currentCartId = await userStore.getOrCreateCart();
    const beforeRes = await cartApi.getByCart(currentCartId);
    const existingItem = getLatestCartItemByColor(beforeRes.data || [], selectedProductColorId);
    const originalQuantity = Number.parseInt(existingItem?.quantity, 10) || 0;

    const addedItem = await userStore.addToCartAPI(
      selectedProductColorId,
      quantity.value,
    );

    let addedCartItemId = extractCartItemId(addedItem);

    if (!addedCartItemId) {
      const itemRes = await cartApi.getByCart(currentCartId);
      const latestMatchedItem = getLatestCartItemByColor(itemRes.data || [], selectedProductColorId);

      if (latestMatchedItem) {
        addedCartItemId = extractCartItemId(latestMatchedItem);
      }
    }

    const finalCartSnapshotRes = await cartApi.getByCart(currentCartId);
    const latestMatchedItem = getLatestCartItemByColor(
      finalCartSnapshotRes.data || [],
      selectedProductColorId,
    );

    if (!addedCartItemId && latestMatchedItem) {
      addedCartItemId = extractCartItemId(latestMatchedItem);
    }

    if (addedCartItemId) {
      const mergedQuantity = Number.parseInt(latestMatchedItem?.quantity, 10) || quantity.value;
      sessionStorage.setItem(
        QUICK_BUY_CONTEXT_KEY,
        JSON.stringify({
          source: "buy-now",
          productColorID: selectedProductColorId,
          quantity: quantity.value,
          buyNowQuantity: quantity.value,
          originalQuantity,
          mergedQuantity,
          cartID: Number.parseInt(latestMatchedItem?.cartID, 10) || currentCartId,
          cartItemID: addedCartItemId,
          createdAt: Date.now(),
        }),
      );
      sessionStorage.setItem(
        SELECTED_CART_ITEM_IDS_KEY,
        JSON.stringify([addedCartItemId]),
      );
      window.dispatchEvent(new Event("cart-changed"));
      router.push({ name: "Checkout" });
      return;
    }

    await removeLatestQuickBuyItemByColor(selectedProductColorId);
    sessionStorage.removeItem(QUICK_BUY_CONTEXT_KEY);
    sessionStorage.removeItem(SELECTED_CART_ITEM_IDS_KEY);

    snackbarMessage.value = "Không thể khởi tạo mua ngay. Sản phẩm không được lưu vào giỏ";
    snackbarColor.value = "error";
    showSnackbar.value = true;
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
