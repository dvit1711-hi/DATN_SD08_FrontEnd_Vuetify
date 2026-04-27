<template>
  <div class="review-container">
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

      <v-row class="mb-6" v-if="paidOrders.length > 0">
        <v-col cols="12">
          <div class="search-bar-wrapper">
            <v-text-field
              v-model="searchQuery"
              placeholder="Tìm kiếm theo tên sản phẩm, màu sắc, size, giá, hoặc mã đơn hàng..."
              variant="outlined"
              density="comfortable"
              clearable
              rounded="lg"
              class="search-field"
              :maxlength="MAX_SEARCH_LENGTH"
              :error="!!searchError"
              :error-messages="searchError ? [searchError] : []"
              @focus="searchError = ''"
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
                  :disabled="!!searchError"
                />
              </template>
            </v-text-field>

            <div v-if="searchQuery && filteredPaidOrders.length === 0" class="search-hint mt-3">
              <v-alert type="info" variant="tonal" density="compact">
                <div class="text-body-2">
                  <v-icon size="small" class="mr-2">mdi-information</v-icon>
                  Không tìm thấy đơn hàng hoặc sản phẩm nào phù hợp với từ khóa "<strong>{{ searchQuery }}</strong>"
                </div>
              </v-alert>
            </div>

            <div v-if="!searchQuery" class="search-hint mt-3">
              <v-alert type="info" variant="tonal" density="compact" class="mb-0">
                <div class="text-caption">
                  <v-icon size="x-small" class="mr-2">mdi-lightbulb</v-icon>
                  <strong>Mẹo tìm kiếm:</strong> Bạn có thể tìm kiếm theo tên sản phẩm, màu sắc, size, giá tiền, số lượng, ngày đặt hàng, hoặc mã đơn hàng
                </div>
              </v-alert>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <v-container style="max-width: 1400px">
      <template v-if="paidOrders.length === 0">
        <v-card class="text-center pa-12" elevation="0" border>
          <v-icon icon="mdi-package-variant-closed" size="80" class="text-grey-lighten-1"></v-icon>
          <p class="text-h6 mt-4 mb-2">Bạn chưa có đơn hàng nào</p>
          <p class="text-body-1 text-grey mb-6">Hãy mua sắm ngay để có thể đánh giá sản phẩm</p>
          <v-btn color="primary" href="/">Tiếp tục mua sắm</v-btn>
        </v-card>
      </template>

      <template v-else>
        <v-row class="mb-8" v-if="!selectedOrderId">
          <v-col cols="12">
            <div class="mb-4 d-flex align-center justify-space-between">
              <div>
                <h2 class="text-h6 font-weight-bold">
                  {{ searchQuery ? 'Kết quả tìm kiếm' : 'Chọn đơn hàng để đánh giá' }}
                </h2>
                <p class="text-body-2 text-grey">
                  {{ filteredPaidOrders.length }} 
                  {{ searchQuery ? 'kết quả phù hợp' : 'đơn hàng đã được thanh toán' }}
                </p>
              </div>
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

        <v-row v-if="selectedOrderId && selectedOrderProducts.length > 0" class="mb-8">
          <v-col cols="12">
            <div class="mb-4 d-flex justify-space-between align-center">
              <div>
                <v-btn
                  variant="text"
                  icon="mdi-chevron-left"
                  @click="selectedOrderId = null; selectedProductId = null; selectedOrderProducts = []"
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
              :class="{
                'product-card-selected': selectedProductId === product.orderDetailId,
                'product-card-reviewed': isProductReviewed(product.productId)
              }"
              @click="handleSelectProduct(product)"
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
                  <div class="mb-2 d-flex justify-space-between align-start gap-2">
                    <div class="text-body-2 font-weight-bold line-clamp-2">
                      {{ product.productName }}
                    </div>

                    <v-chip
                      v-if="isProductReviewed(product.productId)"
                      size="x-small"
                      color="success"
                      variant="tonal"
                    >
                      Đã đánh giá
                    </v-chip>
                  </div>

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

        <v-row v-if="selectedProductId && !isProductReviewed(getSelectedProductIdForApi())" class="mb-8">
          <v-col cols="12" md="8">
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

    <v-overlay :model-value="isLoading" persistent opacity="0.3">
      <v-progress-circular indeterminate color="primary" />
    </v-overlay>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue"
import reviewApi from "@/api/ReviewApi"

const selectedOrderId = ref(null)
const selectedProductId = ref(null)
const paidOrders = ref([])
const selectedOrderProducts = ref([])
const reviews = ref([])
const reviewedProductIds = ref(new Set())
const selectedStarFilter = ref(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const showDeleteConfirm = ref(false)
const deleteReviewId = ref(null)
const editingReviewId = ref(null)
const currentUserId = ref(null)
const searchQuery = ref("")
const searchError = ref("")
const searchDebounceTimer = ref(null)
const fallbackImage = "https://via.placeholder.com/200x200?text=No+Image"
const MAX_SEARCH_LENGTH = 100
const MIN_SEARCH_LENGTH = 0

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

// Validate search input
const validateSearchInput = (value) => {
  searchError.value = ""
  
  if (!value) {
    return true
  }

  // Check length
  if (value.length > MAX_SEARCH_LENGTH) {
    searchError.value = `Tìm kiếm không được vượt quá ${MAX_SEARCH_LENGTH} ký tự`
    return false
  }

  // Allow only alphanumeric, spaces, Vietnamese characters, and common symbols
  const validPattern = /^[a-zA-Z0-9\u0100-\u01B0\u1E00-\u1EFF\s\-.,#_%()]*$/
  if (!validPattern.test(value)) {
    searchError.value = "Từ khóa tìm kiếm chứa ký tự không hợp lệ"
    return false
  }

  return true
}

// Watch for search query changes with debouncing
watch(searchQuery, (newValue) => {
  if (newValue && !validateSearchInput(newValue)) {
    return
  }

  // Clear existing timer
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value)
  }

  // Set new timer for debounced validation
  searchDebounceTimer.value = setTimeout(() => {
    validateSearchInput(newValue)
  }, 300)
})

// Clean up on component unmount
onMounted(() => {
  return () => {
    if (searchDebounceTimer.value) {
      clearTimeout(searchDebounceTimer.value)
    }
  }
})

onMounted(async () => {
  const accountIdStr = localStorage.getItem("accountId")
  if (accountIdStr) {
    try {
      currentUserId.value = parseInt(accountIdStr)
      await Promise.all([
        loadPaidOrders(),
        loadReviewedProducts(),
      ])
    } catch (e) {
      console.log("Could not parse accountId from localStorage")
      currentUserId.value = null
    }
  } else {
    console.log("No accountId found in localStorage")
  }
})

const filteredPaidOrders = computed(() => {
  const trimmedQuery = searchQuery.value.trim()
  if (!trimmedQuery) {
    return paidOrders.value
  }

  const query = trimmedQuery.toLowerCase()

  return paidOrders.value.filter((order) => {
    // Search by Order ID
    if (order.orderId && order.orderId.toString().includes(query)) {
      return true
    }

    // Search by Order Date
    if (order.orderDate) {
      const orderDate = new Date(order.orderDate).toLocaleDateString('vi-VN').toLowerCase()
      if (orderDate.includes(query)) {
        return true
      }
    }

    // Search by Total Amount (price format)
    if (order.totalAmount) {
      const formattedPrice = new Intl.NumberFormat('vi-VN').format(order.totalAmount).toLowerCase()
      if (formattedPrice.includes(query)) {
        return true
      }
      // Also search for plain number
      if (order.totalAmount.toString().includes(query)) {
        return true
      }
    }

    // Search in Items/Products details
    if (order.items && Array.isArray(order.items)) {
      return order.items.some((item) => {
        // Validate item has required properties
        if (!item) return false

        // Search by Product Name
        if (item.productName && item.productName.toLowerCase().includes(query)) {
          return true
        }

        // Search by Color Name
        if (item.colorName && item.colorName.toLowerCase().includes(query)) {
          return true
        }

        // Search by Size
        if (item.sizeName && item.sizeName.toLowerCase().includes(query)) {
          return true
        }

        // Search by Material
        if (item.materialName && item.materialName.toLowerCase().includes(query)) {
          return true
        }

        // Search by Price
        if (item.price) {
          const formattedItemPrice = new Intl.NumberFormat('vi-VN').format(item.price).toLowerCase()
          if (formattedItemPrice.includes(query)) {
            return true
          }
          if (item.price.toString().includes(query)) {
            return true
          }
        }

        // Search by Quantity
        if (item.quantity && item.quantity.toString().includes(query)) {
          return true
        }

        // Search by Product ID
        if (item.productId && item.productId.toString().includes(query)) {
          return true
        }

        // Search by Color ID
        if (item.productColorId && item.productColorId.toString().includes(query)) {
          return true
        }

        return false
      })
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

const isProductReviewed = (productId) => {
  return productId && reviewedProductIds.value.has(productId)
}

const loadPaidOrders = async () => {
  if (!currentUserId.value) return

  try {
    isLoading.value = true
    const response = await reviewApi.getPaidOrdersWithDetailsForAccount(currentUserId.value)
    
    // Validate and normalize order data
    paidOrders.value = (response.data || []).map((order) => {
      // Validate order has required properties
      if (!order) return null
      
      return {
        ...order,
        // Ensure items array exists and is valid
        items: Array.isArray(order.items) 
          ? order.items.map(item => ({
              ...item,
              // Normalize missing properties
              productName: item.productName || 'Sản phẩm không xác định',
              colorName: item.colorName || 'Không xác định',
              sizeName: item.sizeName || '',
              materialName: item.materialName || '',
              price: item.price || 0,
              quantity: item.quantity || 1,
              imageUrl: item.imageUrl || fallbackImage,
              productId: item.productId || null,
              productColorId: item.productColorId || null,
              orderDetailId: item.orderDetailId || null,
            }))
          : [],
        // Ensure order has essential fields
        orderId: order.orderId || null,
        orderDate: order.orderDate || new Date().toISOString(),
        totalAmount: order.totalAmount || 0,
      }
    }).filter(Boolean) // Remove null entries
  } catch (error) {
    console.error("Failed to load paid orders:", error)
    paidOrders.value = []
    showSnackbar("Không thể tải danh sách đơn hàng đã thanh toán.", "error")
  } finally {
    isLoading.value = false
  }
}

const loadReviewedProducts = async () => {
  if (!currentUserId.value) return

  try {
    const response = await reviewApi.getReviewsByAccountId(currentUserId.value)
    reviewedProductIds.value = new Set(
      (response.data || [])
        .map((review) => review.productId)
        .filter(Boolean)
    )
  } catch (error) {
    console.error("Failed to load reviewed products:", error)
    reviewedProductIds.value = new Set()
  }
}

const onOrderSelected = (orderId) => {
  selectedProductId.value = null
  reviews.value = []
  selectedStarFilter.value = null

  // Validate order exists and has items
  const order = paidOrders.value.find((o) => o && o.orderId === orderId)
  if (!order) {
    selectedOrderProducts.value = []
    showSnackbar("Không tìm thấy đơn hàng.", "warning")
    return
  }

  if (order.items && Array.isArray(order.items) && order.items.length > 0) {
    selectedOrderProducts.value = order.items.map((item) => {
      // Validate each item
      if (!item) return null
      return {
        productId: item.productId || null,
        productName: item.productName || 'Sản phẩm không xác định',
        colorName: item.colorName || 'Không xác định',
        sizeName: item.sizeName || '',
        materialName: item.materialName || '',
        imageUrl: item.imageUrl || fallbackImage,
        price: item.price || 0,
        quantity: item.quantity || 1,
        orderDetailId: item.orderDetailId || null,
      }
    }).filter(Boolean) // Remove null items
  } else {
    selectedOrderProducts.value = []
    showSnackbar("Đơn hàng không có sản phẩm.", "info")
  }
}

const handleSelectProduct = async (product) => {
  selectedProductId.value = product.orderDetailId
  await loadReviews()

  if (isProductReviewed(product.productId)) {
    showSnackbar("Sản phẩm này bạn đã đánh giá rồi.", "info")
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
      await loadReviewedProducts()
      await loadPaidOrders()
      await loadReviews()
    } else {
      await reviewApi.createReview({
        productId: productIdForApi,
        accountId: currentUserId.value,
        rating: newReview.value.rating,
        comment: newReview.value.comment,
      })

      showSnackbar("Gửi đánh giá thành công!", "success")
      resetForm()
      await loadReviewedProducts()
      await loadPaidOrders()

      selectedProductId.value = null
      await onOrderSelected(selectedOrderId.value)
    }
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
    await loadReviewedProducts()
    await loadPaidOrders()
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

.search-field :deep(.v-field--error:not(.v-field--disabled)) {
  border-color: #d32f2f !important;
}

.search-hint {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

.product-card-reviewed {
  opacity: 0.6;
  filter: grayscale(0.2);
  background: #f8f8f8 !important;
}

.product-card-reviewed:hover {
  transform: none !important;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08) !important;
  border-color: #d0d0d0 !important;
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

.product-card-reviewed:hover .product-card-image {
  transform: none !important;
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