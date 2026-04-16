<template>
  <div class="review-container">
    <!-- Header -->
    <v-container style="max-width: 1400px" fluid>
      <v-row class="mb-8">
        <v-col cols="12">
          <div class="header-section">
            <v-icon icon="mdi-star" size="large" color="primary" class="mr-3"></v-icon>
            <div>
              <h1 class="text-h4 font-weight-bold mb-1">Đánh giá sản phẩm của bạn</h1>
              <p class="text-body-1 text-grey">
                Chia sẻ trải nghiệm của bạn với các sản phẩm từ đơn hàng đã thanh toán và giao hàng thành công
              </p>
            </div>
          </div>
        </v-col>
      </v-row>

      <!-- Search bar -->
      <v-row class="mb-6" v-if="paidOrders.length > 0">
        <v-col cols="12">
          <div class="search-bar-wrapper">
            <v-text-field
              v-model="searchQuery"
              placeholder="Tìm kiếm"
              variant="outlined"
              density="comfortable"
              clearable
              rounded="lg"
              class="search-field"
            >
              <template #append-inner>
                <v-icon icon="mdi-keyboard" size="small" class="keyboard-icon"></v-icon>
              </template>
              <template #append>
                <v-btn
                  icon="mdi-magnify"
                  variant="text"
                  color="primary"
                  size="large"
                  class="search-btn"
                />
              </template>
            </v-text-field>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- Main content -->
    <v-container style="max-width: 1400px">
      <!-- Order list -->
      <template v-if="paidOrders.length === 0">
        <v-card class="text-center pa-12" elevation="0" border>
          <v-icon icon="mdi-package-variant-closed" size="80" class="text-grey-lighten-1"></v-icon>
          <p class="text-h6 mt-4 mb-2">Bạn chưa có đơn hàng nào</p>
          <p class="text-body-1 text-grey mb-6">Hãy mua sắm ngay để có thể đánh giá sản phẩm</p>
          <v-btn color="primary" href="/">Tiếp tục mua sắm</v-btn>
        </v-card>
      </template>

      <template v-else>
        <!-- Orders and Products Display -->
        <v-row class="mb-8" v-if="!selectedOrderId">
          <v-col cols="12">
            <div class="mb-4">
              <h2 class="text-h6 font-weight-bold">Chọn đơn hàng để đánh giá</h2>
              <p class="text-body-2 text-grey">Các đơn hàng đã được thanh toán</p>
            </div>
          </v-col>

          <template v-if="filteredPaidOrders.length > 0">
            <v-col
              v-for="order in filteredPaidOrders"
              :key="order.orderId"
              cols="12"
              md="6"
              lg="4"
              class="mb-4"
            >
              <v-card
                class="order-card cursor-pointer h-100 transition-transform"
                elevation="0"
                border
                @click="selectedOrderId = order.orderId; onOrderSelected(order.orderId)"
                :class="{ 'order-card-selected': selectedOrderId === order.orderId }"
              >
                <v-card-item>
                  <div class="d-flex justify-space-between align-start mb-4">
                    <div>
                      <div class="text-subtitle2 font-weight-bold">Đơn hàng #{{ order.orderId }}</div>
                      <div class="text-caption text-grey">{{ formatDate(order.orderDate) }}</div>
                    </div>
                    <v-chip size="small" color="success" variant="tonal">Đã thanh toán</v-chip>
                  </div>

                  <div class="mb-4">
                    <div class="text-body-2 font-weight-bold mb-2">
                      {{ order.items ? order.items.length : 0 }} sản phẩm
                    </div>
                    <div class="text-h6 font-weight-bold">{{ formatPrice(order.totalAmount) }}đ</div>
                  </div>

                  <v-divider class="my-4"></v-divider>

                  <div class="d-flex gap-2 flex-wrap">
                    <v-avatar
                      v-for="item in order.items"
                      :key="item.orderDetailId"
                      size="48"
                      rounded
                      class="order-product-thumb"
                    >
                      <v-img :src="item.imageUrl || fallbackImage" cover></v-img>
                    </v-avatar>
                  </div>
                </v-card-item>
              </v-card>
            </v-col>
          </template>

          <v-col v-else cols="12">
            <v-card class="text-center pa-12" elevation="0" border>
              <v-icon icon="mdi-magnify-close" size="80" class="text-grey-lighten-1"></v-icon>
              <p class="text-body-1 text-grey mt-4">Không tìm thấy đơn hàng hoặc sản phẩm nào phù hợp</p>
            </v-card>
          </v-col>
        </v-row>

        <!-- Products in selected order -->
        <v-row v-if="selectedOrderId && selectedOrderProducts.length > 0" class="mb-8">
          <v-col cols="12">
            <div class="mb-4 d-flex justify-space-between align-center">
              <div>
                <v-btn
                  variant="text"
                  icon="mdi-chevron-left"
                  @click="selectedOrderId = null; selectedProductId = null"
                ></v-btn>
                <span class="text-h6 font-weight-bold">Chọn sản phẩm để đánh giá</span>
              </div>
            </div>
          </v-col>

          <v-col
            v-for="product in selectedOrderProducts"
            :key="product.orderDetailId"
            cols="12"
            md="6"
            lg="4"
            class="mb-4"
          >
            <v-card
              class="product-card cursor-pointer h-100 transition-transform"
              elevation="0"
              border
              :class="{ 'product-card-selected': selectedProductId === product.orderDetailId }"
              @click="selectedProductId = product.orderDetailId; loadReviews()"
            >
              <div class="product-image-container">
                <v-img
                  :src="product.imageUrl || fallbackImage"
                  height="200"
                  cover
                  class="product-card-image"
                ></v-img>
              </div>

              <v-card-item>
                <div class="mb-3">
                  <div class="text-body-2 font-weight-bold line-clamp-2">{{ product.productName }}</div>
                  <div class="text-caption text-grey">Màu: {{ product.colorName || "Không xác định" }}</div>
                  <div class="text-caption text-grey" v-if="product.quantity">
                    Số lượng: {{ product.quantity }}
                  </div>
                </div>

                <div class="d-flex justify-space-between align-center">
                  <div class="text-h6 font-weight-bold">{{ formatPrice(product.price) }}đ</div>
                  <v-icon icon="mdi-chevron-right" color="primary"></v-icon>
                </div>
              </v-card-item>
            </v-card>
          </v-col>
        </v-row>

        <!-- Review section for selected product -->
        <v-row v-if="selectedProductId" class="mb-8">
          <v-col cols="12" md="8">
            <!-- Product info card -->
            <v-card class="mb-6" elevation="0" border>
              <v-row class="ma-0">
                <v-col cols="12" md="4" class="pa-0">
                  <v-img :src="getSelectedProductImage()" height="280" cover></v-img>
                </v-col>

                <v-col cols="12" md="8" class="pa-6">
                  <div class="mb-4">
                    <h2 class="text-h5 font-weight-bold mb-2">{{ getSelectedProductName() }}</h2>
                    <div class="text-body-2 text-grey mb-4">{{ getSelectedProductColor() }}</div>
                  </div>

                  <div class="mb-4">
                    <div class="text-body-2 text-grey mb-1">Giá</div>
                    <div class="text-h5 font-weight-bold">{{ getSelectedProductPrice() }}đ</div>
                  </div>

                  <v-divider class="my-4"></v-divider>

                  <div v-if="averageRating > 0" class="mb-4">
                    <div class="text-body-2 text-grey mb-2">Đánh giá của khách hàng</div>
                    <div class="d-flex align-center gap-3">
                      <div class="text-h4 font-weight-bold">{{ averageRating.toFixed(1) }}</div>
                      <div>
                        <v-rating
                          :model-value="averageRating"
                          readonly
                          size="small"
                          color="amber"
                          class="mb-2"
                        />
                        <div class="text-caption text-grey">{{ totalReviews }} đánh giá</div>
                      </div>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-card>

            <!-- Add review form -->
            <v-card class="mb-6" elevation="0" border>
              <v-card-item>
                <div class="text-h6 font-weight-bold mb-6">Viết đánh giá của bạn</div>

                <v-form @submit.prevent="submitReview" class="review-form">
                  <div class="mb-6">
                    <div class="text-body-2 font-weight-bold mb-3">Đánh giá sản phẩm</div>
                    <v-rating
                      v-model="newReview.rating"
                      :length="5"
                      size="large"
                      color="amber"
                      hover
                    />
                    <div class="text-caption text-grey mt-2">
                      {{ newReview.rating ? `${newReview.rating} sao` : "Chọn đánh giá" }}
                    </div>
                  </div>

                  <div class="mb-6">
                    <v-textarea
                      v-model="newReview.comment"
                      label="Bình luận"
                      placeholder="Chia sẻ trải nghiệm của bạn..."
                      variant="outlined"
                      rows="4"
                      counter="500"
                      maxlength="500"
                      persistent-placeholder
                    />
                  </div>

                  <div class="d-flex gap-2">
                    <v-btn
                      type="submit"
                      color="primary"
                      size="large"
                      :loading="isSubmitting"
                      :disabled="!newReview.rating"
                      class="px-8"
                    >
                      {{ editingReviewId ? "Cập nhật đánh giá" : "Gửi đánh giá" }}
                    </v-btn>

                    <v-btn
                      v-if="editingReviewId"
                      color="grey"
                      variant="outlined"
                      size="large"
                      @click="cancelEdit"
                      class="px-8"
                    >
                      Hủy
                    </v-btn>
                  </div>
                </v-form>
              </v-card-item>
            </v-card>
          </v-col>

          <!-- Review stats sidebar -->
          <v-col cols="12" md="4">
            <v-card class="sticky-stats" elevation="0" border v-if="averageRating > 0">
              <v-card-item>
                <div class="text-body-2 text-grey mb-4">Tổng quan đánh giá</div>

                <div class="mb-4">
                  <button
                    v-for="star in [5, 4, 3, 2, 1]"
                    :key="star"
                    class="star-filter-btn"
                    :class="{ active: selectedStarFilter === star }"
                    @click="selectedStarFilter = selectedStarFilter === star ? null : star"
                  >
                    <span class="d-flex align-center gap-2">
                      {{ star }} <v-icon icon="mdi-star" size="small" />
                    </span>
                  </button>
                </div>
              </v-card-item>
            </v-card>
          </v-col>
        </v-row>

        <!-- Reviews list -->
        <v-row v-if="selectedProductId">
          <v-col cols="12" md="8">
            <div class="mb-4">
              <h2 class="text-h6 font-weight-bold mb-2">Đánh giá từ khách hàng</h2>
              <div class="text-body-2 text-grey">{{ filteredReviews.length }} đánh giá</div>
            </div>

            <template v-if="filteredReviews.length > 0">
              <v-card
                v-for="review in filteredReviews"
                :key="review.id"
                class="mb-4 review-card"
                elevation="0"
                border
              >
                <v-card-item>
                  <div class="d-flex gap-3">
                    <v-avatar size="48" color="primary" class="text-white">
                      {{ review.username.charAt(0).toUpperCase() }}
                    </v-avatar>

                    <div class="flex-grow-1">
                      <div class="d-flex justify-space-between align-start mb-2">
                        <div>
                          <div class="font-weight-bold text-body-1">{{ review.username }}</div>
                          <div class="text-caption text-grey">{{ formatDate(review.createdAt) }}</div>
                        </div>

                        <v-menu>
                          <template v-slot:activator="{ props }">
                            <v-btn
                              icon="mdi-dots-vertical"
                              variant="text"
                              size="small"
                              v-bind="props"
                              v-if="review.accountId === currentUserId"
                            />
                          </template>

                          <v-list>
                            <v-list-item @click="startEdit(review)">
                              <template v-slot:prepend>
                                <v-icon icon="mdi-pencil" />
                              </template>
                              <v-list-item-title>Chỉnh sửa</v-list-item-title>
                            </v-list-item>

                            <v-list-item @click="confirmDelete(review.id)">
                              <template v-slot:prepend>
                                <v-icon icon="mdi-trash-can" />
                              </template>
                              <v-list-item-title>Xóa</v-list-item-title>
                            </v-list-item>
                          </v-list>
                        </v-menu>
                      </div>

                      <v-rating
                        :model-value="review.rating"
                        readonly
                        size="small"
                        color="amber"
                        class="mb-2"
                      />

                      <p class="text-body-2 mb-0" style="line-height: 1.5; color: #424242;">
                        {{ review.comment }}
                      </p>
                    </div>
                  </div>
                </v-card-item>
              </v-card>
            </template>

            <div v-else class="text-center py-12">
              <v-icon icon="mdi-folder-open-outline" size="64" class="text-grey-lighten-1"></v-icon>
              <p class="text-body-2 text-grey mt-4">Chưa có đánh giá nào cho sản phẩm này</p>
            </div>
          </v-col>
        </v-row>
      </template>
    </v-container>

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="showDeleteConfirm" max-width="400">
      <v-card>
        <v-card-text class="pt-6">
          <p class="text-body-1">Bạn chắc chắn muốn xóa đánh giá này?</p>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="showDeleteConfirm = false">Hủy</v-btn>
          <v-btn color="error" @click="deleteReview" :loading="isDeleting">
            Xóa
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="top right"
      rounded="lg"
      elevation="8"
    >
      <div class="d-flex align-center">
        <v-icon :icon="snackbar.icon" class="mr-3" size="20" />
        <span>{{ snackbar.text }}</span>
      </div>

      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Đóng</v-btn>
      </template>
    </v-snackbar>

    <!-- Loading overlay -->
    <v-overlay :model-value="isLoading" persistent opacity="0.3">
      <v-progress-circular indeterminate color="primary" />
    </v-overlay>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import reviewApi from "@/api/ReviewApi"

const selectedOrderId = ref(null)
const selectedProductId = ref(null)
const paidOrders = ref([])
const selectedOrderProducts = ref([])
const reviews = ref([])
const selectedStarFilter = ref(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const showDeleteConfirm = ref(false)
const deleteReviewId = ref(null)
const editingReviewId = ref(null)
const currentUserId = ref(null)
const searchQuery = ref("")
const fallbackImage = "https://via.placeholder.com/200x200?text=No+Image"

const newReview = ref({
  rating: 0,
  comment: "",
})

const averageRating = ref(0)
const totalReviews = ref(0)

const snackbar = ref({
  show: false,
  text: "",
  color: "success",
  icon: "mdi-check-circle",
})

const showSnackbar = (text, color = "success") => {
  const iconMap = {
    success: "mdi-check-circle",
    error: "mdi-alert-circle",
    warning: "mdi-alert",
    info: "mdi-information",
  }

  snackbar.value = {
    show: true,
    text,
    color,
    icon: iconMap[color] || "mdi-information",
  }
}

onMounted(async () => {
  const accountIdStr = localStorage.getItem("accountId")
  if (accountIdStr) {
    try {
      currentUserId.value = parseInt(accountIdStr)
      await loadPaidOrders()
    } catch (e) {
      console.log("Could not parse accountId from localStorage")
      currentUserId.value = null
    }
  } else {
    console.log("No accountId found in localStorage")
  }
})

const filteredPaidOrders = computed(() => {
  if (!searchQuery.value.trim()) {
    return paidOrders.value
  }

  const query = searchQuery.value.toLowerCase()
  return paidOrders.value.filter((order) => {
    if (order.orderId.toString().includes(query)) {
      return true
    }

    if (
      order.items &&
      order.items.some((item) => item.productName?.toLowerCase().includes(query))
    ) {
      return true
    }

    return false
  })
})

const filteredReviews = computed(() => {
  if (!selectedStarFilter.value) {
    return reviews.value
  }
  return reviews.value.filter((r) => r.rating === selectedStarFilter.value)
})

const loadPaidOrders = async () => {
  if (!currentUserId.value) return

  try {
    isLoading.value = true
    const response = await reviewApi.getPaidOrdersWithDetailsForAccount(currentUserId.value)
    paidOrders.value = response.data.map((order) => ({
      ...order,
    }))
  } catch (error) {
    console.error("Failed to load paid orders:", error)
    paidOrders.value = []
    showSnackbar("Không thể tải danh sách đơn hàng đã thanh toán.", "error")
  } finally {
    isLoading.value = false
  }
}

const onOrderSelected = (orderId) => {
  selectedProductId.value = null
  reviews.value = []
  selectedStarFilter.value = null

  const order = paidOrders.value.find((o) => o.orderId === orderId)
  if (order && order.items) {
    selectedOrderProducts.value = order.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      colorName: item.colorName,
      imageUrl: item.imageUrl,
      price: item.price,
      quantity: item.quantity,
      orderDetailId: item.orderDetailId,
    }))
  }
}

const getSelectedProductInfo = () => {
  const product = selectedOrderProducts.value.find(
    (p) => p.orderDetailId === selectedProductId.value
  )
  return product || {}
}

const getSelectedProductImage = () => {
  return getSelectedProductInfo().imageUrl || fallbackImage
}

const getSelectedProductName = () => {
  return getSelectedProductInfo().productName || "Sản phẩm"
}

const getSelectedProductColor = () => {
  return getSelectedProductInfo().colorName || "Không xác định"
}

const getSelectedProductPrice = () => {
  const price = getSelectedProductInfo().price
  return price ? new Intl.NumberFormat("vi-VN").format(price) : "0"
}

const getSelectedProductIdForApi = () => {
  return getSelectedProductInfo().productId || null
}

const loadReviews = async () => {
  if (!selectedProductId.value) return

  const productIdForApi = getSelectedProductIdForApi()
  if (!productIdForApi) return

  try {
    isLoading.value = true
    const response = await reviewApi.getReviewsByProductId(productIdForApi)
    reviews.value = response.data
    await loadRatingStats(productIdForApi)
  } catch (error) {
    console.error("Failed to load reviews:", error)
    reviews.value = []
    showSnackbar("Không thể tải danh sách đánh giá.", "error")
  } finally {
    isLoading.value = false
  }
}

const loadRatingStats = async (productId) => {
  try {
    const avgResponse = await reviewApi.getAverageRatingForProduct(productId)
    const totalResponse = await reviewApi.getTotalReviewsForProduct(productId)
    averageRating.value = avgResponse.data || 0
    totalReviews.value = totalResponse.data || 0
  } catch (error) {
    console.error("Failed to load rating stats:", error)
    averageRating.value = 0
    totalReviews.value = 0
  }
}

const submitReview = async () => {
  if (!currentUserId.value) {
    showSnackbar("Vui lòng đăng nhập để đánh giá sản phẩm!", "warning")
    return
  }

  if (!newReview.value.rating) {
    showSnackbar("Vui lòng chọn số sao đánh giá!", "warning")
    return
  }

  const productIdForApi = getSelectedProductIdForApi()
  if (!productIdForApi) {
    showSnackbar("Không thể lấy thông tin sản phẩm!", "error")
    return
  }

  try {
    isSubmitting.value = true

    if (editingReviewId.value) {
      await reviewApi.updateReview(editingReviewId.value, {
        rating: newReview.value.rating,
        comment: newReview.value.comment,
      })

      showSnackbar("Cập nhật đánh giá thành công!", "success")
      editingReviewId.value = null
    } else {
      await reviewApi.createReview({
        productId: productIdForApi,
        accountId: currentUserId.value,
        rating: newReview.value.rating,
        comment: newReview.value.comment,
      })

      showSnackbar("Gửi đánh giá thành công!", "success")
    }

    resetForm()
    await loadReviews()
  } catch (error) {
    console.error("Failed to submit review:", error)

    const message =
      error?.response?.data?.message ||
      error?.response?.data ||
      "Có lỗi xảy ra, vui lòng thử lại."

    showSnackbar(String(message), "error")
  } finally {
    isSubmitting.value = false
  }
}

const startEdit = (review) => {
  editingReviewId.value = review.id
  newReview.value.rating = review.rating
  newReview.value.comment = review.comment
  window.scrollTo({ top: 0, behavior: "smooth" })
}

const cancelEdit = () => {
  editingReviewId.value = null
  resetForm()
}

const resetForm = () => {
  newReview.value = {
    rating: 0,
    comment: "",
  }
}

const confirmDelete = (reviewId) => {
  deleteReviewId.value = reviewId
  showDeleteConfirm.value = true
}

const deleteReview = async () => {
  try {
    isDeleting.value = true
    await reviewApi.deleteReview(deleteReviewId.value)
    showDeleteConfirm.value = false
    showSnackbar("Xóa đánh giá thành công!", "success")
    await loadReviews()
  } catch (error) {
    console.error("Failed to delete review:", error)
    showSnackbar("Không thể xóa đánh giá.", "error")
  } finally {
    isDeleting.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const formatPrice = (value) => {
  return new Intl.NumberFormat("vi-VN").format(value || 0)
}
</script>

<style scoped>
.review-container {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  padding: 40px 0;
}

.header-section {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header-section h1 {
  margin: 0 !important;
}

.header-section p {
  margin: 4px 0 0 0 !important;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-field {
  flex: 1;
}

.search-field :deep(.v-field) {
  background: white !important;
  border-radius: 28px !important;
  border: 1px solid #ddd !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  height: 48px !important;
  padding: 0 20px !important;
}

.search-field :deep(.v-field:hover) {
  border-color: #ccc !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
}

.search-field :deep(.v-field.v-field--focused) {
  border-color: #999 !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

.search-field :deep(.v-field__input) {
  font-size: 14px !important;
  color: #333 !important;
  padding: 0 !important;
}

.keyboard-icon {
  color: #999 !important;
  margin-right: 8px !important;
}

.search-btn {
  width: 48px !important;
  height: 48px !important;
  border-radius: 50% !important;
  background: white !important;
  border: 1px solid #ddd !important;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease !important;
}

.search-btn:hover {
  border-color: #1976d2 !important;
  background: #f0f8ff !important;
}

.search-btn :deep(.v-icon) {
  color: #1976d2 !important;
}

.order-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
  overflow: hidden;
  background: white;
}

.order-card:hover {
  box-shadow: 0 8px 24px rgba(25, 118, 210, 0.15);
  transform: translateY(-4px);
}

.order-card-selected {
  border: 2px solid #1976d2 !important;
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.02), rgba(25, 118, 210, 0.04));
}

.order-product-thumb {
  border: 2px solid #e0e0e0;
  transition: all 0.3s ease;
  cursor: pointer;
}

.order-product-thumb:hover {
  border-color: #1976d2;
  box-shadow: 0 4px 8px rgba(25, 118, 210, 0.2);
}

.product-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
  overflow: hidden;
  background: white;
  height: 100%;
}

.product-card:hover {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  transform: translateY(-8px);
  border-color: #1976d2;
}

.product-card-selected {
  border: 2px solid #1976d2 !important;
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.02), rgba(25, 118, 210, 0.04));
}

.product-image-container {
  position: relative;
  overflow: hidden;
  background: #f5f5f5;
}

.product-card-image {
  transition: transform 0.3s ease;
}

.product-card:hover .product-card-image {
  transform: scale(1.05);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sticky-stats {
  position: sticky;
  top: 20px;
  border-radius: 12px;
  background: white;
}

.review-form {
  max-width: 100%;
}

.star-filter-btn {
  display: block;
  width: 100%;
  padding: 12px 14px;
  margin-bottom: 10px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.star-filter-btn:hover {
  background: #f5f5f5;
  border-color: #1976d2;
}

.star-filter-btn.active {
  background: #1976d2;
  color: white;
  border-color: #1976d2;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
}

.review-card {
  transition: all 0.3s ease;
  border-radius: 10px;
  background: white;
}

.review-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.cursor-pointer {
  cursor: pointer;
}

.transition-transform {
  transition: transform 0.3s ease;
}

:deep(.v-rating) {
  gap: 4px;
}

:deep(.v-textarea) {
  border-radius: 10px;
}

:deep(.v-text-field) {
  border-radius: 10px;
}

:deep(.v-snackbar__wrapper) {
  border-radius: 14px !important;
}

:deep(.v-snackbar__content) {
  font-size: 14px;
  font-weight: 500;
}
</style>