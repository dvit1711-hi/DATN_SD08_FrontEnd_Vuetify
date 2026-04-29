<template>
  <v-container class="cart-container py-8" fluid style="max-width: 1400px">
    <!-- Header Section -->
    <div class="mb-8">
      <div class="d-flex align-center gap-3 mb-3">
        <div class="header-icon">
          <v-icon icon="mdi-shopping-cart" size="32" color="white"></v-icon>
        </div>
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Giỏ hàng của bạn</h1>
          <p class="text-body-2 text-grey">Kiểm tra lại sản phẩm, chọn những gì bạn muốn mua</p>
        </div>
      </div>
    </div>

    <v-alert
      v-if="!isLoggedIn"
      type="warning"
      variant="tonal"
      class="mb-6"
      title="Bạn chưa đăng nhập"
      text="Vui lòng đăng nhập để xem giỏ hàng"
      closable
    >
      <template #append>
        <v-btn color="warning" variant="flat" @click="goLogin">Đăng nhập</v-btn>
      </template>
    </v-alert>

    <template v-else>
      <v-row v-if="cartItems.length > 0" class="ga-6">
        <!-- Items Section -->
        <v-col cols="12" lg="8">
          <!-- Select All Card -->
          <v-card class="select-all-card mb-6" elevation="0" border>
            <v-card-text class="pa-4 d-flex align-center justify-space-between">
              <div class="d-flex align-center ga-3">
                <v-checkbox
                  :model-value="isAllSelected"
                  label="Chọn tất cả sản phẩm"
                  hide-details
                  density="compact"
                  @update:model-value="toggleSelectAll"
                />
              </div>
              <span class="text-caption text-grey font-weight-medium">
                {{ selectedItemIds.length }}/{{ cartItems.length }} sản phẩm được chọn
              </span>
            </v-card-text>
          </v-card>

          <!-- Cart Items -->
          <transition-group name="list" tag="div">
            <v-card
              v-for="item in cartItems"
              :key="item.cartItemID"
              class="cart-item-card mb-4"
              elevation="0"
              border
            >
              <div class="product-header" :style="{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }">
                <v-checkbox
                  :model-value="selectedItemIds.includes(item.cartItemID)"
                  color="white"
                  hide-details
                  density="compact"
                  @update:model-value="toggleItemSelection(item.cartItemID, $event)"
                />
              </div>

              <v-card-text class="pa-4">
                <div class="d-flex gap-4 flex-wrap">
                  <!-- Product Image -->
                  <div class="product-image">
                    <v-img
                      :src="item.mainImage || fallbackImage"
                      width="120"
                      height="120"
                      class="rounded-lg"
                      cover
                    ></v-img>
                  </div>

                  <!-- Product Info -->
                  <div class="flex-grow-1">
                    <div class="mb-2">
                      <div class="text-h6 font-weight-bold mb-1">{{ item.productName }}</div>
                      <div class="text-caption text-grey">Mã: #{{ item.productColorID }}</div>
                    </div>

                    <!-- Variant Info -->
                    <div class="variant-section mb-3">
                      <div class="d-flex align-center gap-2 mb-2">
                        <span class="text-caption text-grey" style="min-width: 60px;">🎨 Màu:</span>
                        <div v-if="item.colorCode" class="color-swatch" :style="{ backgroundColor: item.colorCode }"></div>
                        <span class="text-caption font-weight-medium">{{ item.colorName }}</span>
                      </div>
                      <div class="d-flex align-center gap-2">
                        <span class="text-caption text-grey" style="min-width: 60px;">📏 Size:</span>
                        <v-chip size="small" variant="outlined" color="primary">{{ item.sizeName || '-' }}</v-chip>
                      </div>
                    </div>

                    <!-- Price -->
                    <div class="d-flex align-center gap-4">
                      <div>
                        <div class="text-caption text-grey">Đơn giá</div>
                        <div class="text-subtitle-1 font-weight-bold">{{ formatPrice(item.price) }}đ</div>
                      </div>
                      <v-divider vertical />
                      <div>
                        <div class="text-caption text-grey">Thành tiền</div>
                        <div class="text-h6 font-weight-bold text-primary">{{ formatPrice(item.price * item.quantity) }}đ</div>
                      </div>
                    </div>
                  </div>

                  <!-- Quantity & Actions -->
                  <div class="d-flex flex-column gap-3 align-end">
                    <div class="quantity-control">
                      <div class="text-caption text-grey mb-2">Số lượng</div>
                      <div class="d-flex align-center gap-1">
                        <v-btn
                          icon="mdi-minus"
                          size="small"
                          variant="outlined"
                          density="compact"
                          :disabled="item.quantity <= 1 || item.isUpdating"
                          @click="changeQuantity(item, item.quantity - 1)"
                        />
                        <v-text-field
                          :model-value="item.quantity"
                          type="number"
                          min="1"
                          density="compact"
                          variant="outlined"
                          hide-details
                          style="max-width: 60px; text-align: center"
                          @update:model-value="onQuantityInput(item, $event)"
                        />
                        <v-btn
                          icon="mdi-plus"
                          size="small"
                          variant="outlined"
                          density="compact"
                          :disabled="item.isUpdating || item.quantity >= (item.stockQuantity ?? 0)"
                          @click="changeQuantity(item, item.quantity + 1)"
                        />
                      </div>
                    </div>

                    <v-btn
                      size="small"
                      variant="text"
                      color="error"
                      icon="mdi-trash-can-outline"
                      :loading="item.isRemoving"
                      @click="removeItem(item)"
                    >
                      Xóa
                    </v-btn>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </transition-group>
        </v-col>

        <!-- Summary Section -->
        <v-col cols="12" lg="4">
          <v-card class="summary-card" elevation="0" border style="position: sticky; top: 20px;">
            <div class="summary-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <v-icon icon="mdi-receipt" size="28" color="white" class="mb-2"></v-icon>
              <h3 class="text-h6 font-weight-bold text-white mb-0">Tóm tắt đơn hàng</h3>
            </div>

            <v-card-text class="pa-6">
              <!-- Summary Items -->
              <div class="mb-4">
                <div class="summary-row mb-3">
                  <span class="text-body-2 text-grey">Số lượng sản phẩm</span>
                  <span class="font-weight-bold">{{ selectedTotalQuantity }}</span>
                </div>
                <div class="summary-row mb-4">
                  <span class="text-body-2 text-grey">Tạm tính</span>
                  <span class="font-weight-bold">{{ formatPrice(selectedTotalPrice) }}đ</span>
                </div>
                <v-divider />
              </div>

              <!-- Total -->
              <div class="total-section mb-6">
                <div class="d-flex justify-space-between align-center">
                  <span class="text-body-1 font-weight-bold">Tổng cộng</span>
                  <span class="text-h5 font-weight-bold text-primary">{{ formatPrice(selectedTotalPrice) }}đ</span>
                </div>
              </div>

              <!-- Action Button -->
              <v-btn
                block
                color="primary"
                size="large"
                class="checkout-btn mb-3"
                style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;"
                :disabled="selectedItemIds.length === 0"
                @click="goCheckout"
              >
                <v-icon icon="mdi-credit-card" class="mr-2"></v-icon>
                Tiếp tục thanh toán
              </v-btn>

              <v-btn
                block
                variant="outlined"
                color="primary"
                size="small"
                @click="goProducts"
              >
                Tiếp tục mua sắm
              </v-btn>

              <!-- Info Text -->
              <div class="mt-6 pt-4 text-center border-t">
                <div class="text-caption text-grey">
                  <v-icon icon="mdi-shield-check" size="16" class="mr-1"></v-icon>
                  Thanh toán an toàn & bảo mật
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-empty-state
        v-if="!isLoading"
        title="Giỏ hàng đang trống"
        text="Hãy thêm sản phẩm bạn yêu thích vào giỏ hàng"
        icon="mdi-cart-outline"
      >
        <template #actions>
          <v-btn color="primary" @click="goProducts">Tiếp tục mua sắm</v-btn>
        </template>
      </v-empty-state>

      <div v-if="isLoading" class="d-flex justify-center py-16">
        <v-progress-circular indeterminate color="primary" size="48" />
      </div>
    </template>

    <v-snackbar v-model="showSnackbar" :color="snackbarColor" timeout="3000" top>
      {{ snackbarMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import cartApi from '@/api/cartApi'

const router = useRouter()
const userStore = useUserStore()

const isLoading = ref(false)
const cartItems = ref([])
const selectedItemIds = ref([])
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')
const fallbackImage = 'https://via.placeholder.com/96x96?text=No+Image'

const isLoggedIn = computed(() => userStore.isLoggedIn)
const selectedItems = computed(() => {
  const selectedSet = new Set(selectedItemIds.value)
  return cartItems.value.filter((item) => selectedSet.has(item.cartItemID))
})
const selectedTotalQuantity = computed(() => selectedItems.value.reduce((sum, item) => sum + item.quantity, 0))
const selectedTotalPrice = computed(() => selectedItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0))
const isAllSelected = computed(() => cartItems.value.length > 0 && selectedItemIds.value.length === cartItems.value.length)

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price || 0)

const loadCart = async () => {
  if (!isLoggedIn.value) {
    cartItems.value = []
    selectedItemIds.value = []
    return
  }

  isLoading.value = true
  try {
    let currentCartId = Number.parseInt(userStore.cartId, 10)
    if (!Number.isFinite(currentCartId) || currentCartId <= 0) {
      currentCartId = await userStore.getOrCreateCart()
    }

    const itemRes = await cartApi.getByCart(currentCartId)

    const normalized = (itemRes.data || [])
      .map((item) => {
        const colorId = Number.parseInt(item.productColorID ?? item.productID, 10)
        return {
          cartItemID: item.cartItemID,
          cartID: item.cartID,
          productColorID: colorId,
          sizeID: Number.parseInt(item.sizeID, 10) || null,
          sizeName: item.sizeName || '',
          quantity: Number.parseInt(item.quantity, 10) || 1,
          productName: item.productName || '',
          price: Number(item.price) || 0,
          colorName: item.colorName || '',
          colorCode: item.colorCode || '',
          mainImage: item.mainImage || '',
          stockQuantity: Number.parseInt(item.stockQuantity, 10) || 0,
          isUpdating: false,
          isRemoving: false,
        }
      })

    cartItems.value = normalized
    const validIds = new Set(normalized.map((x) => x.cartItemID))
    selectedItemIds.value = selectedItemIds.value.filter((id) => validIds.has(id))
  } catch (error) {
    console.error('Lỗi tải giỏ hàng:', error)
    snackbarMessage.value = 'Không thể tải giỏ hàng'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  } finally {
    isLoading.value = false
  }
}

const changeQuantity = async (item, nextQuantity) => {
  const quantity = Math.max(1, Number.parseInt(nextQuantity, 10) || 1)
  const maxStock = Number.parseInt(item.stockQuantity, 10) || 0

  if (maxStock <= 0) {
    snackbarMessage.value = 'Sản phẩm đã hết hàng'
    snackbarColor.value = 'warning'
    showSnackbar.value = true
    return
  }

  if (quantity > maxStock) {
    snackbarMessage.value = `Số lượng vượt tồn kho. Tối đa ${maxStock} sản phẩm`
    snackbarColor.value = 'warning'
    showSnackbar.value = true
    return
  }

  if (quantity === item.quantity) return

  item.isUpdating = true
  try {
    await cartApi.update(
      item.cartItemID,
      {
        cartID: item.cartID,
        productColorID: item.productColorID,
        quantity,
      },
      userStore.token,
    )
    item.quantity = quantity
    window.dispatchEvent(new Event('cart-changed'))
  } catch (error) {
    console.error('Lỗi cập nhật số lượng:', error)
    snackbarMessage.value = 'Không thể cập nhật số lượng'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  } finally {
    item.isUpdating = false
  }
}

const onQuantityInput = (item, value) => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return
  changeQuantity(item, parsed)
}

const removeItem = async (item) => {
  item.isRemoving = true
  try {
    await cartApi.remove(item.cartItemID, userStore.token)
    cartItems.value = cartItems.value.filter((x) => x.cartItemID !== item.cartItemID)
    selectedItemIds.value = selectedItemIds.value.filter((id) => id !== item.cartItemID)
    window.dispatchEvent(new Event('cart-changed'))
    snackbarMessage.value = 'Đã xóa sản phẩm khỏi giỏ hàng'
    snackbarColor.value = 'success'
    showSnackbar.value = true
  } catch (error) {
    console.error('Lỗi xóa sản phẩm:', error)
    snackbarMessage.value = 'Không thể xóa sản phẩm'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  } finally {
    item.isRemoving = false
  }
}

const toggleItemSelection = (cartItemId, checked) => {
  if (checked) {
    if (!selectedItemIds.value.includes(cartItemId)) {
      selectedItemIds.value.push(cartItemId)
    }
    return
  }
  selectedItemIds.value = selectedItemIds.value.filter((id) => id !== cartItemId)
}

const toggleSelectAll = (checked) => {
  if (checked) {
    selectedItemIds.value = cartItems.value.map((item) => item.cartItemID)
    return
  }
  selectedItemIds.value = []
}

const goCheckout = () => {
  if (selectedItemIds.value.length === 0) {
    snackbarMessage.value = 'Vui lòng chọn ít nhất 1 sản phẩm để thanh toán'
    snackbarColor.value = 'warning'
    showSnackbar.value = true
    return
  }

  const invalidItem = selectedItems.value.find((item) => {
    const stock = Number.parseInt(item.stockQuantity, 10) || 0
    const qty = Number.parseInt(item.quantity, 10) || 0
    return qty <= 0 || qty > stock
  })

  if (invalidItem) {
    snackbarMessage.value = `${invalidItem.productName || 'Sản phẩm'} không đủ tồn kho để thanh toán`
    snackbarColor.value = 'warning'
    showSnackbar.value = true
    return
  }

  sessionStorage.removeItem('quickBuyContext')
  sessionStorage.setItem('selectedCartItemIds', JSON.stringify(selectedItemIds.value))
  router.push({ name: 'Checkout' })
}

const goProducts = () => {
  router.push({ name: 'ProductList' })
}

const goLogin = () => {
  router.push({ name: 'Login' })
}

onMounted(() => {
  loadCart()
})
</script>

<style scoped>
.summary-card {
  position: sticky;
  top: 24px;
}

/* Cart Container */
.cart-container {
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  min-height: 100vh;
}

/* Header Styles */
.header-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  color: white;
}

/* Select All Card */
.select-all-card {
  border-radius: 12px !important;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* Cart Item Card */
.cart-item-card {
  border-radius: 12px !important;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  background: white;
}

.cart-item-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.product-header {
  padding: 8px 16px;
  display: flex;
  align-items: center;
}

.product-image {
  flex-shrink: 0;
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 2px solid #ddd;
  display: inline-block;
}

.variant-section {
  padding: 12px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 8px;
  border-left: 3px solid #667eea;
}

.quantity-control {
  text-align: right;
}

/* Summary Card */
.summary-card {
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  background: white;
}

.summary-header {
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.total-section {
  padding: 16px 0;
  border-top: 2px solid #f0f0f0;
  border-bottom: 2px solid #f0f0f0;
}

.checkout-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.checkout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3) !important;
}

.border-t {
  border-top: 1px solid #e0e0e0;
}

/* Transition Effects */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Color Dot */
.color-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.2);
  display: inline-block;
}

.min-w-220 {
  min-width: 220px;
}

/* Variant Information Section Styles */
.variant-info-section {
  padding: 12px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  border-radius: 8px;
  border-left: 4px solid #1976d2;
}

.variant-info-section .color-dot {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #999;
  vertical-align: middle;
}

.variant-info-section .v-chip {
  height: 24px;
  font-size: 12px;
}
</style>
