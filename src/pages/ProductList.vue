<template>
  <v-container class="py-8" fluid>
    <div class="mb-8">
      <h1 class="text-h4 font-weight-bold mb-2">Danh sách sản phẩm</h1>
      <p class="text-subtitle-1 text-grey">
        Khám phá bộ sưu tập các sản phẩm chất lượng cao
      </p>
    </div>

    <div class="list-toolbar mb-4">
  <div class="product-count">
    {{ filteredProducts.length }} sản phẩm
  </div>

  <div class="toolbar-actions">
    <ProductFilterPanel
      v-model="activeFilters"
      :result-count="filteredProducts.length"
      @apply="onFilterChanged"
      class="toolbar-filter-btn"
    />

    <v-select
      v-model="sortBy"
      :items="sortOptions"
      item-title="title"
      item-value="value"
      label="Sắp xếp"
      variant="outlined"
      density="comfortable"
      hide-details
      class="toolbar-sort-select"
    />
  </div>
</div>

    <div
      v-if="selectedFilterChips.length > 0"
      class="active-filter-bar mb-4"
    >
      <button class="clear-all-chip" @click="resetAllFilters">
        Xóa lọc
      </button>

      <div class="active-filter-list">
        <span
          v-for="chip in selectedFilterChips"
          :key="chip.key"
          class="active-chip"
        >
          {{ chip.label }}
          <button class="active-chip-close" @click="removeFilterChip(chip)">
            ×
          </button>
        </span>
      </div>
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
          <div class="product-image-wrapper">
            <v-img
              :src="p.mainImage"
              :alt="p.productName"
              height="240"
              cover
              class="product-image"
            />

            <div v-if="getProductDiscount(p)" class="discount-badge">
              <span v-if="getProductDiscount(p).discountType === 'percent'">
                -{{ getProductDiscount(p).discountValue }}%
              </span>
              <span v-else>
                Giảm {{ formatCurrency(getProductDiscount(p).discountValue) }}
              </span>
            </div>
          </div>

          <v-card-text class="pa-4 flex-grow-1 d-flex flex-column">
            <h3 class="text-subtitle-1 font-weight-bold mb-1 line-clamp-2">
              {{ p.productName }}
            </h3>

            <div class="text-body-2 text-grey mb-2">
              {{ p.brandName || "—" }}
            </div>

            <v-chip
              v-if="isOutOfStock(p)"
              size="x-small"
              color="error"
              variant="flat"
              class="mb-2 out-of-stock-chip"
            >
              Hết hàng
            </v-chip>

            <div class="mb-3 flex-grow-1">
              <div class="text-caption text-grey mb-2">Màu sắc:</div>
              <div class="d-flex gap-2 flex-wrap">
                <button
                  v-for="c in getDisplayColors(p)"
                  :key="c.productColorID || c.colorName"
                  class="color-btn"
                  :style="{ background: c.colorCode }"
                  :title="c.colorName"
                />
              </div>
            </div>

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
              <v-icon start>mdi-shopping-cart</v-icon>
              {{ isOutOfStock(p) ? "Hết hàng" : "Thêm giỏ" }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-empty-state
      v-if="products.length === 0"
      title="Không có sản phẩm"
      text="Hiện chưa có sản phẩm nào để hiển thị"
      icon="mdi-inbox"
    />

    <div
      v-if="products.length > 0 && filteredProducts.length === 0"
      class="text-center pa-8"
    >
      <p class="text-h6 no-result-text">
        Không tìm thấy sản phẩm phù hợp với bộ lọc của bạn
      </p>
    </div>

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
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import ProductFilterPanel from "@/components/ProductFilterPanel.vue";
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

const sortOptions = [
  { title: "Mặc định", value: "default" },
  { title: "Tên: A-Z", value: "nameAsc" },
  { title: "Tên: Z-A", value: "nameDesc" },
  { title: "Giá: Tăng dần", value: "priceAsc" },
  { title: "Giá: Giảm dần", value: "priceDesc" },
];

const priceOptions = [
  { value: "under1m", label: "Dưới 1,000,000đ", min: 0, max: 1000000 },
  { value: "1m-2m", label: "1,000,000đ - 2,000,000đ", min: 1000000, max: 2000000 },
  { value: "2m-3m", label: "2,000,000đ - 3,000,000đ", min: 2000000, max: 3000000 },
  { value: "above3m", label: "Trên 3,000,000đ", min: 3000000, max: 10000000 },
];

const activeFilters = ref({
  selectedBrands: [],
  selectedColors: [],
  selectedMaterials: [],
  selectedSizes: [],
  selectedPriceKeys: [],
});

const filterSources = ref({
  brands: [],
  colors: [],
  materials: [],
  sizes: [],
});

const filteredProducts = computed(() => {
  const filtered = products.value.filter((product) => {
    const productPrice = Number(product.price) || 0;

    if (
      activeFilters.value.selectedBrands.length > 0 &&
      !activeFilters.value.selectedBrands.includes(Number(product.brandID))
    ) {
      return false;
    }

    if (
      activeFilters.value.selectedColors.length > 0 &&
      !activeFilters.value.selectedColors.includes(Number(product.colorID))
    ) {
      return false;
    }

    if (
      activeFilters.value.selectedMaterials.length > 0 &&
      !activeFilters.value.selectedMaterials.includes(Number(product.materialID))
    ) {
      return false;
    }

    if (
      activeFilters.value.selectedSizes.length > 0 &&
      !activeFilters.value.selectedSizes.includes(Number(product.sizeID))
    ) {
      return false;
    }

    if (activeFilters.value.selectedPriceKeys.length > 0) {
      const matchedPrice = activeFilters.value.selectedPriceKeys.some((key) => {
        const option = priceOptions.find((p) => p.value === key);
        if (!option) return false;
        return productPrice >= option.min && productPrice <= option.max;
      });

      if (!matchedPrice) {
        return false;
      }
    }

    return true;
  });

  const sorted = [...filtered];

  switch (sortBy.value) {
  case "nameAsc":
    sorted.sort((a, b) =>
      String(a.productName || "").localeCompare(String(b.productName || ""), "vi")
    );
    break;

  case "nameDesc":
    sorted.sort((a, b) =>
      String(b.productName || "").localeCompare(String(a.productName || ""), "vi")
    );
    break;

  case "priceAsc":
    sorted.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    break;

  case "priceDesc":
    sorted.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    break;

  default:
    break;
}

  return sorted;
});

const selectedFilterChips = computed(() => {
  const chips = [];

  const pushMapped = (selected, source, type) => {
    selected.forEach((value) => {
      const found = source.find((item) => Number(item.value) === Number(value));
      if (found) {
        chips.push({
          type,
          value,
          label: found.label,
          key: `${type}-${value}`,
        });
      }
    });
  };

  pushMapped(activeFilters.value.selectedBrands, filterSources.value.brands, "brand");
  pushMapped(activeFilters.value.selectedColors, filterSources.value.colors, "color");
  pushMapped(activeFilters.value.selectedMaterials, filterSources.value.materials, "material");
  pushMapped(activeFilters.value.selectedSizes, filterSources.value.sizes, "size");

  activeFilters.value.selectedPriceKeys.forEach((value) => {
    const found = priceOptions.find((item) => item.value === value);
    if (found) {
      chips.push({
        type: "price",
        value,
        label: found.label,
        key: `price-${value}`,
      });
    }
  });

  return chips;
});

const loadProducts = async () => {
  try {
    const keyword = route.query.search?.toString().trim() || "";

    const [res, stockRes, discountRes] = await Promise.all([
      productApi.getAllCard(keyword),
      productColorApi.getAll(),
      getActiveProductDiscounts().catch((error) => {
        if (error?.response?.status === 401) {
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

    filterSources.value.brands = uniqueBy(
      products.value
        .filter((p) => p.brandID && p.brandName)
        .map((p) => ({ value: Number(p.brandID), label: p.brandName })),
      "value"
    );

    filterSources.value.colors = uniqueBy(
      products.value
        .filter((p) => p.colorID && p.colorName)
        .map((p) => ({
          value: Number(p.colorID),
          label: p.colorName,
          colorCode: p.colorCode,
        })),
      "value"
    );

    filterSources.value.materials = uniqueBy(
      products.value
        .filter((p) => p.materialID && p.materialName)
        .map((p) => ({ value: Number(p.materialID), label: p.materialName })),
      "value"
    );

    filterSources.value.sizes = uniqueBy(
      products.value
        .filter((p) => p.sizeID && p.sizeName)
        .map((p) => ({ value: Number(p.sizeID), label: p.sizeName })),
      "value"
    );

    await loadProductRatings();
  } catch (error) {
    console.error("Lỗi tải sản phẩm:", error);
    products.value = [];
  }
};

const uniqueBy = (arr, key) => {
  const map = new Map();
  arr.forEach((item) => {
    if (!map.has(item[key])) {
      map.set(item[key], item);
    }
  });
  return Array.from(map.values());
};

const loadProductRatings = async () => {
  try {
    const reviewsRes = await ReviewApi.getAllReviews();
    const reviews = reviewsRes.data || [];

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

    productRatings.forEach((value, key) => {
      const avgRating = value.count > 0 ? value.total / value.count : 0;
      productRatingsMap.value.set(key, Math.round(avgRating));
    });
  } catch (error) {
    console.error("Lỗi tải đánh giá sản phẩm:", error);
  }
};

const onFilterChanged = (filters) => {
  activeFilters.value = { ...filters };
};

const resetAllFilters = () => {
  activeFilters.value = {
    selectedBrands: [],
    selectedColors: [],
    selectedMaterials: [],
    selectedSizes: [],
    selectedPriceKeys: [],
  };
};

const removeFilterChip = (chip) => {
  if (chip.type === "brand") {
    activeFilters.value.selectedBrands = activeFilters.value.selectedBrands.filter(
      (v) => Number(v) !== Number(chip.value)
    );
  }

  if (chip.type === "color") {
    activeFilters.value.selectedColors = activeFilters.value.selectedColors.filter(
      (v) => Number(v) !== Number(chip.value)
    );
  }

  if (chip.type === "material") {
    activeFilters.value.selectedMaterials = activeFilters.value.selectedMaterials.filter(
      (v) => Number(v) !== Number(chip.value)
    );
  }

  if (chip.type === "size") {
    activeFilters.value.selectedSizes = activeFilters.value.selectedSizes.filter(
      (v) => Number(v) !== Number(chip.value)
    );
  }

  if (chip.type === "price") {
    activeFilters.value.selectedPriceKeys = activeFilters.value.selectedPriceKeys.filter(
      (v) => v !== chip.value
    );
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
  }

  const discountAmount = Number.parseFloat(discount.discountValue) || 0;
  return Math.max(0, price - discountAmount);
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

<style scoped src="@/assets/css/product-list.css"></style>