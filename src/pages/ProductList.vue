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
          <v-img
            :src="p.mainImage"
            :alt="p.productName"
            height="240"
            cover
            class="product-image"
          />

          <!-- Card Content -->
          <v-card-text class="pa-4 flex-grow-1 d-flex flex-column">
            <h3 class="text-subtitle-1 font-weight-bold mb-1 line-clamp-2">
              {{ p.productName }}
            </h3>
            <p class="text-caption text-grey mb-3">
              {{ p.description?.substring(0, 50) }}...
            </p>

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
              <span class="text-h6 font-weight-bold text-primary">
                {{ formatPrice(p.price) }}đ
              </span>
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
              @click.stop.prevent="addToCart(p)"
            >
              <v-icon left>mdi-shopping-cart</v-icon>
              Thêm giỏ
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
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import productApi from "@/api/productApi";

const router = useRouter();
const userStore = useUserStore();
const products = ref([]);
const showSnackbar = ref(false);
const snackbarMessage = ref("");
const snackbarColor = ref("success");

onMounted(async () => {
  try {
    const res = await productApi.getAllCart();
    products.value = res.data || [];
  } catch (error) {
    console.error("Lỗi tải sản phẩm:", error);
  }
});

const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN").format(price);
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
  const fallbackColorId = Number.parseInt(detailRes?.data?.colors?.[0]?.productColorID, 10);
  return Number.isFinite(fallbackColorId) && fallbackColorId > 0 ? fallbackColorId : null;
}

async function addToCart(product) {
  // Check if user is logged in
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
    // This API flow creates cart first when missing, then adds the product
    await userStore.addToCartAPI(productColorId, 1);
    snackbarMessage.value = `Đã thêm "${product.productName}" vào giỏ hàng`;
    snackbarColor.value = "success";
    showSnackbar.value = true;
  } catch (error) {
    console.error("Lỗi thêm vào giỏ:", error);
    snackbarMessage.value = error?.response?.data?.message || "Không thể thêm vào giỏ hàng. Vui lòng thử lại";
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

.product-image {
  border-radius: 12px 12px 0 0;
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
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:deep(.w-100) {
  width: 100%;
}
</style>