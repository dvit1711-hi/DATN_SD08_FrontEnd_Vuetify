<template>
  <div class="productList-container">
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

    <div v-if="selectedFilterChips.length > 0" class="active-filter-bar mb-4">
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
        :key="p.productID"
        cols="12"
        sm="6"
        md="6"
        lg="4"
        xl="3"
        class="d-flex"
      >
        <ProductStorefrontCard
          class="w-100"
          :product="p"
          :discount="getProductDiscount(p)"
          :discounted-price="getDiscountedPrice(p)"
          @quick-add="openQuickAddDialog"
        />
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

    <ProductQuickAddDialog
      :model-value="quickAddDialog"
      :loading="quickAddLoading"
      :submitting="quickAddSubmitting"
      :product="quickAddProduct"
      :detail="quickAddDetail"
      :preview-image="quickAddPreviewImage"
      :selected-images="quickAddSelectedImages"
      :selected-discount="quickAddSelectedDiscount"
      :selected-variant="quickAddSelectedVariant"
      :discounted-price="quickAddDiscountedPrice"
      :color-options="quickAddColorOptions"
      :selected-color-id="quickAddSelectedColorId"
      :size-options="quickAddSizeOptions"
      :selected-size-id="quickAddSelectedSizeId"
      :max-quantity="quickAddMaxQuantity"
      :has-valid-selection="quickAddHasValidSelection"
      :quantity="quickAddQuantity"
      @close="closeQuickAddDialog"
      @update-preview-image="quickAddPreviewImage = $event"
      @select-color="selectQuickAddColor"
      @select-size="selectQuickAddSize"
      @decrease-qty="decreaseQuickAddQty"
      @increase-qty="increaseQuickAddQty"
      @qty-input="onQuickAddQtyInput"
      @confirm="confirmQuickAddToCart"
    />
  </v-container>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useUserStore } from "@/stores/user"
import ProductFilterPanel from "@/components/ProductFilterPanel.vue"
import ProductStorefrontCard from "@/components/product/ProductStorefrontCard.vue"
import ProductQuickAddDialog from "@/components/product/ProductQuickAddDialog.vue"
import productApi from "@/api/productApi"
import { getActiveProductDiscounts } from "@/api/productDiscountApi"

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const products = ref([])
const discountMap = ref(new Map())

const showSnackbar = ref(false)
const snackbarMessage = ref("")
const snackbarColor = ref("success")

const sortBy = ref("default")

const sortOptions = [
  { title: "Mặc định", value: "default" },
  { title: "Tên: A-Z", value: "nameAsc" },
  { title: "Tên: Z-A", value: "nameDesc" },
  { title: "Giá: Tăng dần", value: "priceAsc" },
  { title: "Giá: Giảm dần", value: "priceDesc" },
]

const priceOptions = [
  { value: "under1m", label: "Dưới 1,000,000đ", min: 0, max: 1000000 },
  { value: "1m-2m", label: "1,000,000đ - 2,000,000đ", min: 1000000, max: 2000000 },
  { value: "2m-3m", label: "2,000,000đ - 3,000,000đ", min: 2000000, max: 3000000 },
  { value: "above3m", label: "Trên 3,000,000đ", min: 3000000, max: 10000000 },
]

const activeFilters = ref({
  selectedBrands: [],
  selectedColors: [],
  selectedMaterials: [],
  selectedSizes: [],
  selectedPriceKeys: [],
})

const filterSources = ref({
  brands: [],
  colors: [],
  materials: [],
  sizes: [],
})

const quickAddDialog = ref(false)
const quickAddLoading = ref(false)
const quickAddSubmitting = ref(false)
const quickAddProduct = ref(null)
const quickAddDetail = ref(null)
const quickAddSelectedColorId = ref(null)
const quickAddSelectedSizeId = ref(null)
const quickAddQuantity = ref(1)
const quickAddPreviewImage = ref("")

const supportsSizeFilter = computed(() =>
  products.value.some((p) => Array.isArray(p.sizes) && p.sizes.length > 0)
)

const filteredProducts = computed(() => {
  const filtered = products.value.filter((product) => {
    const productPrice = Number(product.displayPrice) || 0

    if (
      activeFilters.value.selectedBrands.length > 0 &&
      !activeFilters.value.selectedBrands.includes(Number(product.brandID))
    ) {
      return false
    }

    if (activeFilters.value.selectedColors.length > 0) {
      const colorIds = (product.colors || []).map((c) => Number(c.colorID))
      const hasMatchedColor = activeFilters.value.selectedColors.some((id) =>
        colorIds.includes(Number(id))
      )

      if (!hasMatchedColor) {
        return false
      }
    }

    if (
      activeFilters.value.selectedMaterials.length > 0 &&
      !activeFilters.value.selectedMaterials.includes(Number(product.materialID))
    ) {
      return false
    }

    if (supportsSizeFilter.value && activeFilters.value.selectedSizes.length > 0) {
      const sizeIds = (product.sizes || []).map((s) => Number(s.sizeID))
      const hasMatchedSize = activeFilters.value.selectedSizes.some((id) =>
        sizeIds.includes(Number(id))
      )

      if (!hasMatchedSize) {
        return false
      }
    }

    if (activeFilters.value.selectedPriceKeys.length > 0) {
      const matchedPrice = activeFilters.value.selectedPriceKeys.some((key) => {
        const option = priceOptions.find((p) => p.value === key)
        if (!option) return false
        return productPrice >= option.min && productPrice <= option.max
      })

      if (!matchedPrice) {
        return false
      }
    }

    return true
  })

  const sorted = [...filtered]

  switch (sortBy.value) {
    case "nameAsc":
      sorted.sort((a, b) =>
        String(a.productName || "").localeCompare(String(b.productName || ""), "vi")
      )
      break
    case "nameDesc":
      sorted.sort((a, b) =>
        String(b.productName || "").localeCompare(String(a.productName || ""), "vi")
      )
      break
    case "priceAsc":
      sorted.sort((a, b) => Number(a.displayPrice || 0) - Number(b.displayPrice || 0))
      break
    case "priceDesc":
      sorted.sort((a, b) => Number(b.displayPrice || 0) - Number(a.displayPrice || 0))
      break
    default:
      break
  }

  return sorted
})

const selectedFilterChips = computed(() => {
  const chips = []

  const pushMapped = (selected, source, type) => {
    selected.forEach((value) => {
      const found = source.find((item) => Number(item.value) === Number(value))
      if (found) {
        chips.push({
          type,
          value,
          label: found.label,
          key: `${type}-${value}`,
        })
      }
    })
  }

  pushMapped(activeFilters.value.selectedBrands, filterSources.value.brands, "brand")
  pushMapped(activeFilters.value.selectedColors, filterSources.value.colors, "color")
  pushMapped(activeFilters.value.selectedMaterials, filterSources.value.materials, "material")
  pushMapped(activeFilters.value.selectedSizes, filterSources.value.sizes, "size")

  activeFilters.value.selectedPriceKeys.forEach((value) => {
    const found = priceOptions.find((item) => item.value === value)
    if (found) {
      chips.push({
        type: "price",
        value,
        label: found.label,
        key: `price-${value}`,
      })
    }
  })

  return chips
})

const quickAddActiveVariants = computed(() => {
  return (quickAddDetail.value?.colors || []).filter(
    (item) => String(item?.status || "").toUpperCase() === "ACTIVE"
  )
})

const quickAddColorOptions = computed(() => {
  return uniqueBy(
    quickAddActiveVariants.value.map((item) => ({
      colorID: Number(item.colorID),
      colorName: item.colorName,
      colorCode: item.colorCode,
    })),
    "colorID"
  )
})

const quickAddSizeOptions = computed(() => {
  const colorId = Number(quickAddSelectedColorId.value)
  if (!Number.isFinite(colorId)) return []

  return uniqueBy(
    quickAddActiveVariants.value
      .filter((item) => Number(item.colorID) === colorId)
      .map((item) => ({
        sizeID: Number(item.sizeID),
        sizeName: item.sizeName,
        stockQuantity: Number(item.stockQuantity) || 0,
        disabled: (Number(item.stockQuantity) || 0) <= 0,
      })),
    "sizeID"
  )
})

const quickAddSelectedVariant = computed(() => {
  const colorId = Number(quickAddSelectedColorId.value)
  const sizeId = Number(quickAddSelectedSizeId.value)

  if (!Number.isFinite(colorId) || !Number.isFinite(sizeId)) {
    return null
  }

  return (
    quickAddActiveVariants.value.find(
      (item) =>
        Number(item.colorID) === colorId &&
        Number(item.sizeID) === sizeId
    ) || null
  )
})

const quickAddSelectedImages = computed(() => {
  const images = quickAddSelectedVariant.value?.images || []
  if (images.length > 0) return images

  if (quickAddProduct.value?.displayImage) {
    return [
      {
        imageUrl: quickAddProduct.value.displayImage,
        isMain: true,
      },
    ]
  }

  return []
})

const quickAddMaxQuantity = computed(() => {
  return Math.max(0, Number(quickAddSelectedVariant.value?.stockQuantity) || 0)
})

const quickAddHasValidSelection = computed(() => {
  return Boolean(quickAddSelectedVariant.value) && quickAddMaxQuantity.value > 0
})

const quickAddSelectedDiscount = computed(() => {
  const variantId = Number(quickAddSelectedVariant.value?.productColorID)
  if (!Number.isFinite(variantId)) return null
  return discountMap.value.get(variantId) || null
})

const quickAddDiscountedPrice = computed(() => {
  const price = Number(quickAddSelectedVariant.value?.price) || 0
  const discount = quickAddSelectedDiscount.value

  if (!discount) return price

  if (discount.discountType === "percent") {
    const discountPercent = Number(discount.discountValue) || 0
    const discountAmount = price * (discountPercent / 100)
    const maxDiscount = Number(discount.maxDiscountValue) || Infinity
    return Math.max(0, price - Math.min(discountAmount, maxDiscount))
  }

  return Math.max(0, price - (Number(discount.discountValue) || 0))
})

watch(quickAddSelectedVariant, (variant) => {
  const mainImage = getMainImage(variant?.images || [])
  quickAddPreviewImage.value = mainImage || quickAddProduct.value?.displayImage || ""
  clampQuickAddQuantity()
})

const loadProducts = async () => {
  try {
    const keyword = route.query.search?.toString().trim() || ""

    const [res, discountRes] = await Promise.all([
      productApi.getAllCard(keyword),
      getActiveProductDiscounts().catch((error) => {
        if (error?.response?.status === 401) {
          return { data: [] }
        }
        throw error
      }),
    ])

    discountMap.value = new Map()
    ;(discountRes.data || []).forEach((discount) => {
      const productColorId = Number.parseInt(discount.productColorId, 10)
      if (Number.isFinite(productColorId)) {
        discountMap.value.set(productColorId, discount)
      }
    })

    products.value = (res.data || []).map((p) => ({
      ...p,
      productID: Number(p.productID),
      brandID: Number(p.brandID),
      materialID: Number(p.materialID),
      defaultVariantId: Number(p.defaultVariantId),
      displayPrice: Number(p.displayPrice) || 0,
      totalStock: Number(p.totalStock) || 0,
      inStock: Boolean(p.inStock),
      hoverImage: p.hoverImage || p.displayImage || "",
      colors: Array.isArray(p.colors)
        ? p.colors.map((c) => ({
            ...c,
            colorID: Number(c.colorID),
          }))
        : [],
      sizes: Array.isArray(p.sizes)
        ? p.sizes.map((s) => ({
            ...s,
            sizeID: Number(s.sizeID),
          }))
        : [],
    }))

    filterSources.value.brands = uniqueBy(
      products.value
        .filter((p) => p.brandID && p.brandName)
        .map((p) => ({ value: Number(p.brandID), label: p.brandName })),
      "value"
    )

    filterSources.value.colors = uniqueBy(
      products.value.flatMap((p) =>
        (p.colors || []).map((c) => ({
          value: Number(c.colorID),
          label: c.colorName,
          colorCode: c.colorCode,
        }))
      ),
      "value"
    )

    filterSources.value.materials = uniqueBy(
      products.value
        .filter((p) => p.materialID && p.materialName)
        .map((p) => ({ value: Number(p.materialID), label: p.materialName })),
      "value"
    )

    filterSources.value.sizes = uniqueBy(
      products.value.flatMap((p) =>
        (p.sizes || []).map((s) => ({
          value: Number(s.sizeID),
          label: s.sizeName,
        }))
      ),
      "value"
    )
  } catch (error) {
    console.error("Lỗi tải sản phẩm:", error)
    products.value = []
  }
}

const uniqueBy = (arr, key) => {
  const map = new Map()
  arr.forEach((item) => {
    if (!map.has(item[key])) {
      map.set(item[key], item)
    }
  })
  return Array.from(map.values())
}

const onFilterChanged = (filters) => {
  activeFilters.value = { ...filters }
}

const resetAllFilters = () => {
  activeFilters.value = {
    selectedBrands: [],
    selectedColors: [],
    selectedMaterials: [],
    selectedSizes: [],
    selectedPriceKeys: [],
  }
}

const removeFilterChip = (chip) => {
  if (chip.type === "brand") {
    activeFilters.value.selectedBrands = activeFilters.value.selectedBrands.filter(
      (v) => Number(v) !== Number(chip.value)
    )
  }

  if (chip.type === "color") {
    activeFilters.value.selectedColors = activeFilters.value.selectedColors.filter(
      (v) => Number(v) !== Number(chip.value)
    )
  }

  if (chip.type === "material") {
    activeFilters.value.selectedMaterials = activeFilters.value.selectedMaterials.filter(
      (v) => Number(v) !== Number(chip.value)
    )
  }

  if (chip.type === "size") {
    activeFilters.value.selectedSizes = activeFilters.value.selectedSizes.filter(
      (v) => Number(v) !== Number(chip.value)
    )
  }

  if (chip.type === "price") {
    activeFilters.value.selectedPriceKeys = activeFilters.value.selectedPriceKeys.filter(
      (v) => v !== chip.value
    )
  }
}

onMounted(async () => {
  await loadProducts()
})

watch(
  () => route.query.search,
  async () => {
    await loadProducts()
  }
)

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value)
}

const getProductDiscount = (product) => {
  if (!product) return null
  const productColorId = Number.parseInt(product.defaultVariantId, 10)
  if (!Number.isFinite(productColorId)) return null
  return discountMap.value.get(productColorId) || null
}

const getDiscountedPrice = (product) => {
  const discount = getProductDiscount(product)
  if (!discount) return Number(product.displayPrice) || 0

  const price = Number.parseFloat(product.displayPrice) || 0

  if (discount.discountType === "percent") {
    const discountPercent = Number.parseFloat(discount.discountValue) || 0
    const discountAmount = price * (discountPercent / 100)
    const maxDiscount = Number.parseFloat(discount.maxDiscountValue) || Infinity
    const actualDiscount = Math.min(discountAmount, maxDiscount)
    return Math.max(0, price - actualDiscount)
  }

  const discountAmount = Number.parseFloat(discount.discountValue) || 0
  return Math.max(0, price - discountAmount)
}

const isOutOfStock = (product) => {
  return !Boolean(product?.inStock)
}

function showMessage(message, color = "success") {
  snackbarMessage.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}

function normalizeDetail(detail) {
  return {
    ...detail,
    colors: Array.isArray(detail?.colors)
      ? detail.colors.map((item) => ({
          ...item,
          productColorID: Number(item.productColorID),
          colorID: Number(item.colorID),
          sizeID: Number(item.sizeID),
          price: Number(item.price) || 0,
          stockQuantity: Number(item.stockQuantity) || 0,
          images: Array.isArray(item.images)
            ? item.images.map((img) => ({
                ...img,
                isMain: Boolean(img.isMain),
              }))
            : [],
        }))
      : [],
  }
}

function getMainImage(images = []) {
  return (
    images.find((img) => Boolean(img?.isMain))?.imageUrl ||
    images[0]?.imageUrl ||
    ""
  )
}

function pickDefaultVariant(variants, preferredVariantId = null) {
  const activeVariants = (variants || []).filter(
    (item) => String(item?.status || "").toUpperCase() === "ACTIVE"
  )

  if (Number.isFinite(Number(preferredVariantId))) {
    const preferred = activeVariants.find(
      (item) => Number(item.productColorID) === Number(preferredVariantId)
    )
    if (preferred) return preferred
  }

  return [...activeVariants].sort((a, b) => {
    const aStock = (Number(a.stockQuantity) || 0) > 0 ? 0 : 1
    const bStock = (Number(b.stockQuantity) || 0) > 0 ? 0 : 1
    if (aStock !== bStock) return aStock - bStock

    const aMain = getMainImage(a.images || []) ? 0 : 1
    const bMain = getMainImage(b.images || []) ? 0 : 1
    if (aMain !== bMain) return aMain - bMain

    return Number(a.productColorID || 0) - Number(b.productColorID || 0)
  })[0] || null
}

function clampQuickAddQuantity() {
  const max = quickAddMaxQuantity.value
  if (max <= 0) {
    quickAddQuantity.value = 1
    return
  }

  if (quickAddQuantity.value < 1) {
    quickAddQuantity.value = 1
  }

  if (quickAddQuantity.value > max) {
    quickAddQuantity.value = max
  }
}

function selectQuickAddColor(colorId) {
  quickAddSelectedColorId.value = Number(colorId)

  const candidate = [...quickAddActiveVariants.value]
    .filter((item) => Number(item.colorID) === Number(colorId))
    .sort((a, b) => {
      const aStock = (Number(a.stockQuantity) || 0) > 0 ? 0 : 1
      const bStock = (Number(b.stockQuantity) || 0) > 0 ? 0 : 1
      if (aStock !== bStock) return aStock - bStock
      return Number(a.productColorID || 0) - Number(b.productColorID || 0)
    })[0]

  quickAddSelectedSizeId.value = candidate ? Number(candidate.sizeID) : null
}

function selectQuickAddSize(sizeId) {
  quickAddSelectedSizeId.value = Number(sizeId)
}

function decreaseQuickAddQty() {
  if (quickAddQuantity.value > 1) {
    quickAddQuantity.value -= 1
  }
}

function increaseQuickAddQty() {
  if (quickAddQuantity.value < quickAddMaxQuantity.value) {
    quickAddQuantity.value += 1
  }
}

function onQuickAddQtyInput(value) {
  quickAddQuantity.value = Number(value) || 1
  clampQuickAddQuantity()
}

function resetQuickAddState() {
  quickAddLoading.value = false
  quickAddSubmitting.value = false
  quickAddProduct.value = null
  quickAddDetail.value = null
  quickAddSelectedColorId.value = null
  quickAddSelectedSizeId.value = null
  quickAddQuantity.value = 1
  quickAddPreviewImage.value = ""
}

function closeQuickAddDialog() {
  quickAddDialog.value = false
  resetQuickAddState()
}

async function openQuickAddDialog(product) {
  if (isOutOfStock(product)) {
    showMessage("Sản phẩm đã hết hàng", "warning")
    return
  }

  if (!userStore.isLoggedIn) {
    showMessage("Vui lòng đăng nhập để thêm vào giỏ hàng", "warning")
    setTimeout(() => {
      router.push("/login")
    }, 1500)
    return
  }

  quickAddDialog.value = true
  quickAddLoading.value = true
  quickAddProduct.value = product
  quickAddDetail.value = null
  quickAddSelectedColorId.value = null
  quickAddSelectedSizeId.value = null
  quickAddQuantity.value = 1
  quickAddPreviewImage.value = product?.displayImage || ""

  try {
    const res = await productApi.getDetail(product.productID)
    const detail = normalizeDetail(res.data)

    quickAddDetail.value = detail

    const defaultVariant = pickDefaultVariant(
      detail.colors || [],
      product.defaultVariantId
    )

    if (!defaultVariant) {
      showMessage("Sản phẩm hiện chưa có biến thể khả dụng", "warning")
      closeQuickAddDialog()
      return
    }

    quickAddSelectedColorId.value = Number(defaultVariant.colorID)
    quickAddSelectedSizeId.value = Number(defaultVariant.sizeID)
    quickAddPreviewImage.value =
      getMainImage(defaultVariant.images || []) || product.displayImage || ""

    clampQuickAddQuantity()
  } catch (error) {
    console.error("Lỗi tải chi tiết sản phẩm:", error)
    showMessage("Không tải được thông tin biến thể sản phẩm", "error")
    closeQuickAddDialog()
  } finally {
    quickAddLoading.value = false
  }
}

async function confirmQuickAddToCart() {
  if (!quickAddSelectedVariant.value) {
    showMessage("Vui lòng chọn màu và kích thước", "warning")
    return
  }

  if (quickAddMaxQuantity.value <= 0) {
    showMessage("Biến thể này đã hết hàng", "warning")
    return
  }

  quickAddSubmitting.value = true

  try {
    await userStore.addToCartAPI(
      Number(quickAddSelectedVariant.value.productColorID),
      Number(quickAddQuantity.value) || 1
    )

    window.dispatchEvent(new Event("cart-changed"))
    showMessage(`Đã thêm "${quickAddDetail.value.productName}" vào giỏ hàng`, "success")
    closeQuickAddDialog()
  } catch (error) {
    console.error("Lỗi thêm vào giỏ:", error)
    showMessage(
      error?.response?.data?.message || "Không thể thêm vào giỏ hàng. Vui lòng thử lại",
      "error"
    )
  } finally {
    quickAddSubmitting.value = false
  }
}
</script>

<style scoped src="@/assets/css/product-list.css"></style>