<template>
  <div class="review-container">
    <!-- Header -->
    <v-container fluid class="py-4">
      <v-row>
        <v-col cols="12" md="8" offset-md="2">
          <h1 class="text-h4 font-weight-bold mb-2">Đánh giá sản phẩm</h1>
          <p class="text-body-1 text-grey">Chia sẻ trải nghiệm của bạn về sản phẩm</p>
        </v-col>
      </v-row>
    </v-container>

    <!-- Main content -->
    <v-container fluid>
      <v-row>
        <!-- Left side - Product selector -->
        <v-col cols="12" md="3">
          <v-card class="sticky-card" elevation="0" border>
            <v-card-item>
              <div class="text-subtitle2 font-weight-bold mb-3">Chọn sản phẩm</div>
              <v-select
                v-model="selectedProductId"
                :items="products"
                item-title="productName"
                item-value="productID"
                @update:modelValue="loadReviews"
                variant="outlined"
                dense
                class="mb-4"
              />

              <!-- Rating summary -->
              <div v-if="selectedProductId" class="mb-4">
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
                <div class="text-caption text-grey">{{ totalReviews }} đánh giá</div>

                <!-- Star distribution -->
                <div class="mt-4">
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
              </div>
            </v-card-item>
          </v-card>
        </v-col>

        <!-- Right side - Reviews -->
        <v-col cols="12" md="9">
          <!-- Add review form -->
          <v-card v-if="selectedProductId" class="mb-6" elevation="0" border>
            <v-card-item>
              <div class="text-subtitle2 font-weight-bold mb-4">Viết đánh giá của bạn</div>

              <v-form @submit.prevent="submitReview" class="review-form">
                <!-- Star rating input -->
                <div class="mb-4">
                  <div class="text-body-2 mb-2">Đánh giá sản phẩm</div>
                  <v-rating
                    v-model="newReview.rating"
                    :length="5"
                    size="large"
                    color="amber"
                    hover
                  />
                  <div class="text-caption text-grey mt-1">
                    {{ newReview.rating ? `${newReview.rating} sao` : "Chọn đánh giá" }}
                  </div>
                </div>

                <!-- Comment input -->
                <div class="mb-4">
                  <v-textarea
                    v-model="newReview.comment"
                    label="Bình luận"
                    placeholder="Chia sẻ trải nghiệm của bạn..."
                    variant="outlined"
                    rows="4"
                    counter="500"
                    maxlength="500"
                  />
                </div>

                <!-- Submit button -->
                <div class="d-flex gap-2">
                  <v-btn
                    type="submit"
                    color="primary"
                    :loading="isSubmitting"
                    :disabled="!newReview.rating"
                  >
                    {{ editingReviewId ? 'Cập nhật đánh giá' : 'Gửi đánh giá' }}
                  </v-btn>
                  <v-btn
                    v-if="editingReviewId"
                    variant="outlined"
                    @click="cancelEdit"
                  >
                    Hủy
                  </v-btn>
                </div>
              </v-form>
            </v-card-item>
          </v-card>

          <!-- Reviews list -->
          <div v-if="selectedProductId">
            <div v-if="filteredReviews.length > 0">
              <v-card
                v-for="review in filteredReviews"
                :key="review.id"
                class="mb-4"
                elevation="0"
                border
              >
                <v-card-item>
                  <div class="d-flex justify-space-between align-start">
                    <div class="flex-grow-1">
                      <!-- Username and date -->
                      <div class="d-flex align-center gap-2 mb-2">
                        <div class="font-weight-bold">{{ review.username }}</div>
                        <v-chip size="small" variant="outlined">
                          {{ formatDate(review.createdAt) }}
                        </v-chip>
                      </div>

                      <!-- Star rating -->
                      <v-rating
                        :model-value="review.rating"
                        readonly
                        size="small"
                        color="amber"
                        class="mb-2"
                      />

                      <!-- Comment -->
                      <p class="text-body-2 mb-0">
                        {{ review.comment }}
                      </p>
                    </div>

                    <!-- Action buttons -->
                    <div class="ml-3">
                      <v-menu>
                        <template v-slot:activator="{ props }">
                          <v-btn
                            icon="mdi-dots-vertical"
                            variant="text"
                            size="small"
                            v-bind="props"
                          />
                        </template>
                        <v-list>
                          <v-list-item
                            v-if="review.accountId === currentUserId"
                            @click="startEdit(review)"
                          >
                            <template v-slot:prepend>
                              <v-icon icon="mdi-pencil" />
                            </template>
                            <v-list-item-title>Chỉnh sửa</v-list-item-title>
                          </v-list-item>
                          <v-list-item
                            v-if="review.accountId === currentUserId"
                            @click="confirmDelete(review.id)"
                          >
                            <template v-slot:prepend>
                              <v-icon icon="mdi-trash-can" />
                            </template>
                            <v-list-item-title>Xóa</v-list-item-title>
                          </v-list-item>
                        </v-list>
                      </v-menu>
                    </div>
                  </div>
                </v-card-item>
              </v-card>
            </div>
            <div v-else class="text-center py-8">
              <v-icon icon="mdi-folder-open-outline" size="64" class="text-grey" />
              <p class="text-body-2 text-grey mt-4">Chưa có đánh giá nào</p>
            </div>
          </div>

          <!-- No product selected -->
          <div v-else class="text-center py-12">
            <v-icon icon="mdi-inbox-outline" size="64" class="text-grey" />
            <p class="text-body-2 text-grey mt-4">Vui lòng chọn sản phẩm để xem đánh giá</p>
          </div>
        </v-col>
      </v-row>
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

    <!-- Loading overlay -->
    <v-overlay :model-value="isLoading" persistent opacity="0.3">
      <v-progress-circular indeterminate color="primary" />
    </v-overlay>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import reviewApi from "@/api/ReviewApi"
import productApi from "@/api/productApi"

// Refs
const selectedProductId = ref(null)
const products = ref([])
const reviews = ref([])
const selectedStarFilter = ref(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const showDeleteConfirm = ref(false)
const deleteReviewId = ref(null)
const editingReviewId = ref(null)
const currentUserId = ref(null) // Get from localStorage on mount

const newReview = ref({
  rating: 0,
  comment: "",
})

// Get products on mount
onMounted(async () => {
  await loadProducts()
  
  // Get current user ID from localStorage
  const accountIdStr = localStorage.getItem("accountId")
  if (accountIdStr) {
    try {
      currentUserId.value = parseInt(accountIdStr)
    } catch (e) {
      console.log("Could not parse accountId from localStorage")
      currentUserId.value = null
    }
  }
})

// Load products
const loadProducts = async () => {
  try {
    isLoading.value = true
    const response = await productApi.getAll()
    products.value = response.data
  } catch (error) {
    console.error("Failed to load products:", error)
    products.value = []
  } finally {
    isLoading.value = false
  }
}

// Load reviews for selected product
const loadReviews = async () => {
  if (!selectedProductId.value) return

  try {
    isLoading.value = true
    const response = await reviewApi.getReviewsByProductId(selectedProductId.value)
    reviews.value = response.data

    // Load average rating and total count
    await loadRatingStats()
  } catch (error) {
    console.error("Failed to load reviews:", error)
    reviews.value = []
  } finally {
    isLoading.value = false
  }
}

const averageRating = ref(0)
const totalReviews = ref(0)

// Load rating statistics
const loadRatingStats = async () => {
  try {
    const avgResponse = await reviewApi.getAverageRatingForProduct(selectedProductId.value)
    const totalResponse = await reviewApi.getTotalReviewsForProduct(selectedProductId.value)
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

// Submit review
const submitReview = async () => {
  if (!currentUserId.value) {
    alert("Vui lòng đăng nhập để đánh giá sản phẩm!")
    return
  }

  if (!newReview.value.rating) {
    alert("Vui lòng chọn đánh giá!")
    return
  }

  try {
    isSubmitting.value = true

    if (editingReviewId.value) {
      // Update existing review
      await reviewApi.updateReview(editingReviewId.value, {
        rating: newReview.value.rating,
        comment: newReview.value.comment,
      })
      alert("Cập nhật đánh giá thành công!")
      editingReviewId.value = null
    } else {
      // Create new review
      await reviewApi.createReview({
        productId: selectedProductId.value,
        accountId: currentUserId.value,
        rating: newReview.value.rating,
        comment: newReview.value.comment,
      })
      alert("Gửi đánh giá thành công!")
    }

    resetForm()
    await loadReviews()
  } catch (error) {
    console.error("Failed to submit review:", error)
    alert("Lỗi! Vui lòng thử lại.")
  } finally {
    isSubmitting.value = false
  }
}

// Start editing review
const startEdit = (review) => {
  editingReviewId.value = review.id
  newReview.value.rating = review.rating
  newReview.value.comment = review.comment
  window.scrollTo({ top: 0, behavior: "smooth" })
}

// Cancel editing
const cancelEdit = () => {
  editingReviewId.value = null
  resetForm()
}

// Reset form
const resetForm = () => {
  newReview.value = {
    rating: 0,
    comment: "",
  }
}

// Confirm delete
const confirmDelete = (reviewId) => {
  deleteReviewId.value = reviewId
  showDeleteConfirm.value = true
}

// Delete review
const deleteReview = async () => {
  try {
    isDeleting.value = true
    await reviewApi.deleteReview(deleteReviewId.value)
    alert("Xóa đánh giá thành công!")
    showDeleteConfirm.value = false
    await loadReviews()
  } catch (error) {
    console.error("Failed to delete review:", error)
    alert("Lỗi! Không thể xóa đánh giá.")
  } finally {
    isDeleting.value = false
  }
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
</script>

<style scoped>
.review-container {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 20px 0;
}

.sticky-card {
  position: sticky;
  top: 20px;
}

.review-form {
  max-width: 100%;
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

  &:hover {
    background: #f9f9f9;
  }

  &.active {
    background: #ffeaa7;
    border-color: #ffd700;
    color: #333;
    font-weight: 500;
  }
}

:deep(.v-rating) {
  gap: 4px;
}
</style>
