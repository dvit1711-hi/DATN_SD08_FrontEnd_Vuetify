<template>
  <v-container class="py-8" v-if="product">
    <v-row>
      <!-- Thumbnails dọc bên trái -->
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

      <!-- Ảnh lớn -->
      <v-col cols="5">
        <v-img
          :src="mainImage"
          height="500"
          class="rounded"
          contain
        />
      </v-col>

      <!-- Thông tin sản phẩm -->
      <v-col cols="5">
        <div>
          <h1 class="text-h4 font-weight-bold mb-2">{{ product.productName }}</h1>
          <p class="text-body-2 text-grey mb-2">Mã sản phẩm: #{{ product.productID }}</p>
          <div class="price mb-4 text-h5 font-weight-bold text-primary">
            {{ formatPrice(product.price) }}đ
          </div>

          <v-alert
            v-if="isSelectedColorOutOfStock"
            type="warning"
            variant="tonal"
            density="comfortable"
            icon="mdi-alert-circle"
            class="mb-4"
            text="Màu đã chọn hiện đang hết hàng"
          />

          <!-- Chọn màu -->
          <div class="mb-4">
            <h3 class="text-subtitle-1 font-weight-bold mb-2">Chọn màu sắc</h3>
            <div class="d-flex gap-2">
              <button
                v-for="c in product.colors"
                :key="c.productColorID"
                class="color-btn"
                :style="{ backgroundColor: c.colorCode }"
                :class="{ 'color-btn-active': selectedColor?.productColorID === c.productColorID }"
                @click="changeColor(c)"
              />
            </div>
          </div>

          <!-- Chọn số lượng -->
          <div class="mb-4">
            <h3 class="text-subtitle-1 font-weight-bold mb-2">Số lượng</h3>
            <v-text-field
              v-model.number="quantity"
              type="number"
              min="1"
              :max="selectedColorStock > 0 ? selectedColorStock : 1"
              outlined
              dense
              :disabled="isSelectedColorOutOfStock"
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
                :disabled="isLoading || isSelectedColorOutOfStock"
              >
                <v-icon left>mdi-shopping-cart</v-icon>
                {{ isSelectedColorOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ hàng' }}
              </v-btn>
            </v-col>
            <v-col cols="6">
              <v-btn
                color="secondary"
                block
                outlined
                @click="handleBuyNow"
                :loading="isLoading"
                :disabled="isLoading || isSelectedColorOutOfStock"
              >
                {{ isSelectedColorOutOfStock ? 'Hết hàng' : 'Mua ngay' }}
              </v-btn>
            </v-col>
          </v-row>

          <!-- Mô tả sản phẩm -->
          <v-card class="mt-4 pa-4" outlined>
            <h3 class="text-subtitle-1 font-weight-bold mb-2">Mô tả sản phẩm</h3>
            <p>{{ product.description || 'Không có mô tả' }}</p>
          </v-card>
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

    <!-- Star distribution and Reviews section -->
    <v-row class="mt-8">
      <!-- Left side - Rating summary -->
      <v-col cols="12" md="3">
        <v-card class="sticky-card" elevation="0" border>
          <v-card-item>
            <div class="text-subtitle2 font-weight-bold mb-2">Tổng quan đánh giá</div>
            <div class="d-flex align-center gap-2 mb-2">
              <div class="text-h5 font-weight-bold">{{ averageRating.toFixed(1) }}</div>
              <v-rating
                :model-value="averageRating"
                readonly
                size="small"
                color="amber"
              />
            </div>
            <div class="text-caption text-grey mb-4">{{ totalReviews }} đánh giá</div>

            <!-- Star distribution -->
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
                @click="selectedStarFilter = selectedStarFilter === star ? null : star"
              >
                {{ star }} <v-icon icon="mdi-star" size="small" />
              </button>
            </div>
          </v-card-item>
        </v-card>
      </v-col>

      <!-- Right side - Reviews list -->
      <v-col cols="12" md="9">
        <div v-if="reviews.length > 0" class="reviews-container">
          <!-- Reviews wrapper with grey background -->
          <div class="reviews-wrapper pa-6">
            <h2 class="text-h6 font-weight-bold mb-4">Đánh giá từ khách hàng</h2>
            
            <!-- Reviews Cards -->
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
                    <!-- Avatar with user image -->
                    <div class="review-avatar-wrapper">
                      <v-avatar size="48" class="review-avatar">
                        <v-img
                          :src="review.userAvatar || getDefaultAvatar(review.username)"
                          :alt="review.username"
                          cover
                        />
                      </v-avatar>
                    </div>

                    <!-- Review content -->
                    <div class="flex-grow-1">
                      <!-- Header: Username and date -->
                      <div class="d-flex align-center justify-space-between mb-2">
                        <div>
                          <div class="font-weight-bold text-body-1">{{ review.username }}</div>
                          <div class="text-caption text-grey">{{ formatDate(review.createdAt) }}</div>
                        </div>
                      </div>

                      <!-- Star rating -->
                      <v-rating
                        :model-value="review.rating"
                        readonly
                        size="x-small"
                        color="amber"
                        class="mb-2"
                      />

                      <!-- Comment -->
                      <p class="text-body-2 mb-0 review-comment">
                        {{ review.comment }}
                      </p>
                    </div>
                  </div>
                </v-card-item>
              </v-card>
            </div>

            <!-- Pagination -->
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
import { ref, onMounted, computed, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useUserStore } from "@/stores/user"
import axios from "axios"
import reviewApi from "@/api/ReviewApi"

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const product = ref(null)
const images = ref([])
const mainImage = ref("")
const selectedColor = ref(null)
const quantity = ref(1)
const isLoading = ref(false)
const showSnackbar = ref(false)
const snackbarMessage = ref("")
const snackbarColor = ref("success")

const selectedColorStock = computed(() => Number.parseInt(selectedColor.value?.stockQuantity, 10) || 0)
const isSelectedColorOutOfStock = computed(() => selectedColorStock.value <= 0)

// Review related refs
const reviews = ref([])
const averageRating = ref(0)
const totalReviews = ref(0)
const selectedStarFilter = ref(null)
const currentPage = ref(1)
const itemsPerPage = 5

onMounted(async () => {
  try {
    const productID = route.params.id
    const res = await axios.get(`http://localhost:8080/api/product/detail/${productID}`)
    product.value = res.data

    if (product.value.colors.length) {
      const firstAvailableColor = product.value.colors.find((c) => (Number.parseInt(c.stockQuantity, 10) || 0) > 0)
      selectedColor.value = firstAvailableColor || product.value.colors[0]
      images.value = selectedColor.value.images || []
      mainImage.value = images.value[0] || ""
    }

    // Load reviews and rating stats
    await loadReviews(productID)
  } catch (error) {
    console.error(error)
  }
})

// Reset page when filter changes
watch(selectedStarFilter, () => {
  currentPage.value = 1
})

function changeColor(color) {
  selectedColor.value = color
  images.value = color.images || []
  mainImage.value = images.value[0]
  if (quantity.value < 1) {
    quantity.value = 1
  }
  if (selectedColorStock.value > 0 && quantity.value > selectedColorStock.value) {
    quantity.value = selectedColorStock.value
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price)
}

// Load reviews for the product
const loadReviews = async (productID) => {
  try {
    const response = await reviewApi.getReviewsByProductId(productID)
    reviews.value = response.data
    await loadRatingStats(productID)
  } catch (error) {
    console.error("Failed to load reviews:", error)
    reviews.value = []
  }
}

// Load rating statistics
const loadRatingStats = async (productID) => {
  try {
    const avgResponse = await reviewApi.getAverageRatingForProduct(productID)
    const totalResponse = await reviewApi.getTotalReviewsForProduct(productID)
    averageRating.value = avgResponse.data
    totalReviews.value = totalResponse.data
  } catch (error) {
    console.error("Failed to load rating stats:", error)
  }
}

// Filter reviews by star
const filteredReviews = computed(() => {
  if (!selectedStarFilter.value) {
    return reviews.value
  }
  return reviews.value.filter(r => r.rating === selectedStarFilter.value)
})

// Calculate total pages
const totalPages = computed(() => {
  return Math.ceil(filteredReviews.value.length / itemsPerPage)
})

// Paginated reviews
const paginatedReviews = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredReviews.value.slice(start, end)
})

// Get initials from username
const getInitials = (username) => {
  if (!username) return "?"
  return username
    .split(" ")
    .map(word => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// Get default avatar from API
const getDefaultAvatar = (username) => {
  // Using UI Avatars service as fallback
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=667eea&color=fff&bold=true`
}

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
async function handleAddToCart() {
  // Check if user is logged in
  if (!userStore.isLoggedIn) {
    snackbarMessage.value = "Vui lòng đăng nhập để thêm vào giỏ hàng"
    snackbarColor.value = "warning"
    showSnackbar.value = true
    setTimeout(() => {
      router.push("/login")
    }, 1500)
    return
  }

  if (!selectedColor.value) {
    snackbarMessage.value = "Vui lòng chọn màu sắc"
    snackbarColor.value = "error"
    showSnackbar.value = true
    return
  }

  if (isSelectedColorOutOfStock.value) {
    snackbarMessage.value = "Màu đã chọn đang hết hàng"
    snackbarColor.value = "warning"
    showSnackbar.value = true
    return
  }

  if (quantity.value < 1 || quantity.value > selectedColorStock.value) {
    snackbarMessage.value = "Số lượng phải lớn hơn 0"
    snackbarColor.value = "error"
    showSnackbar.value = true
    return
  }

  isLoading.value = true
  try {
    // Call backend API to add to cart
    await userStore.addToCartAPI(
      selectedColor.value.productColorID,
      quantity.value
    )

    window.dispatchEvent(new Event('cart-changed'))

    snackbarMessage.value = `Đã thêm ${quantity.value} sản phẩm "${product.value.productName}" vào giỏ hàng`
    snackbarColor.value = "success"
    showSnackbar.value = true

    // Reset quantity
    quantity.value = 1
  } catch (error) {
    console.error("Lỗi thêm vào giỏ:", error)
    
    if (error.message.includes("đăng nhập")) {
      snackbarMessage.value = "Vui lòng đăng nhập trước"
      snackbarColor.value = "warning"
      setTimeout(() => {
        router.push("/login")
      }, 1500)
    } else {
      snackbarMessage.value = "Thêm vào giỏ hàng thất bại. Vui lòng thử lại"
      snackbarColor.value = "error"
    }
    showSnackbar.value = true
  } finally {
    isLoading.value = false
  }
}

async function handleBuyNow() {
  if (!userStore.isLoggedIn) {
    snackbarMessage.value = "Vui lòng đăng nhập để mua hàng"
    snackbarColor.value = "warning"
    showSnackbar.value = true
    setTimeout(() => {
      router.push("/login")
    }, 1200)
    return
  }

  if (!selectedColor.value) {
    snackbarMessage.value = "Vui lòng chọn màu sắc"
    snackbarColor.value = "error"
    showSnackbar.value = true
    return
  }

  if (isSelectedColorOutOfStock.value) {
    snackbarMessage.value = "Màu đã chọn đang hết hàng"
    snackbarColor.value = "warning"
    showSnackbar.value = true
    return
  }

  if (quantity.value < 1 || quantity.value > selectedColorStock.value) {
    snackbarMessage.value = "Số lượng phải lớn hơn 0"
    snackbarColor.value = "error"
    showSnackbar.value = true
    return
  }

  isLoading.value = true
  try {
    const addedItem = await userStore.addToCartAPI(
      selectedColor.value.productColorID,
      quantity.value
    )

    const addedCartItemId = Number.parseInt(addedItem?.id ?? addedItem?.cartItemID, 10)
    if (Number.isFinite(addedCartItemId) && addedCartItemId > 0) {
      sessionStorage.setItem("selectedCartItemIds", JSON.stringify([addedCartItemId]))
      window.dispatchEvent(new Event('cart-changed'))
      router.push({ name: 'Checkout' })
      return
    }

    snackbarMessage.value = "Đã thêm vào giỏ. Vui lòng chọn sản phẩm trong giỏ để thanh toán"
    snackbarColor.value = "warning"
    showSnackbar.value = true
    window.dispatchEvent(new Event('cart-changed'))
    setTimeout(() => {
      router.push({ name: 'Cart' })
    }, 800)
  } catch (error) {
    console.error("Lỗi mua ngay:", error)
    snackbarMessage.value = "Không thể xử lý mua ngay. Vui lòng thử lại"
    snackbarColor.value = "error"
    showSnackbar.value = true
  } finally {
    isLoading.value = false
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
  border-color: #CDBA96;
  box-shadow: 0 0 6px rgba(205, 186, 150, 0.4);
}
.thumb-active {
  border-color: #CDBA96;
  box-shadow: 0 0 8px rgba(205, 186, 150, 0.5);
}

.color-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #ccc;
  cursor: pointer;
  transition: all 0.2s;
}
.color-btn:hover {
  transform: scale(1.1);
  border-color: #CDBA96;
}
.color-btn-active {
  border-color: #CDBA96;
  box-shadow: 0 0 6px rgba(205, 186, 150, 0.5);
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

/* Review list styles */
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
</style>