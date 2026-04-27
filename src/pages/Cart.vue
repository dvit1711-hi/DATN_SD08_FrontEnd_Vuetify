<template>
  <v-container class="py-8" fluid>
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold mb-2">Giỏ hàng</h1>
      <p class="text-subtitle-1 text-grey">Chọn sản phẩm cần mua rồi tiếp tục sang trang thanh toán</p>
    </div>

    <v-alert
      v-if="!isLoggedIn"
      type="warning"
      variant="tonal"
      class="mb-4"
      title="Bạn chưa đăng nhập"
      text="Vui lòng đăng nhập để xem giỏ hàng"
    >
      <template #append>
        <v-btn color="warning" variant="flat" @click="goLogin">Đăng nhập</v-btn>
      </template>
    </v-alert>

    <template v-else>
      <v-row v-if="cartItems.length > 0" class="ga-4">
        <v-col cols="12" lg="8">
          <v-card class="mb-4" variant="outlined">
            <v-card-text class="py-2 px-4 d-flex align-center justify-space-between">
              <div class="d-flex align-center ga-2 flex-wrap">
                <v-checkbox
                  :model-value="isAllSelected"
                  label="Chọn tất cả"
                  hide-details
                  density="compact"
                  @update:model-value="toggleSelectAll"
                />
              </div>
              <span class="text-caption text-grey">Đã chọn {{ selectedItemIds.length }}/{{ cartItems.length }} sản phẩm</span>
            </v-card-text>
          </v-card>

          <v-card v-for="item in cartItems" :key="item.cartItemID" class="mb-4" variant="outlined">
            <v-card-text class="pa-4">
              <div class="d-flex align-center flex-wrap ga-4">
                <v-checkbox
                  :model-value="selectedItemIds.includes(item.cartItemID)"
                  hide-details
                  density="compact"
                  @update:model-value="toggleItemSelection(item.cartItemID, $event)"
                />

                <v-img
                  :src="item.mainImage || fallbackImage"
                  width="96"
                  height="96"
                  class="rounded"
                  cover
                />

                <div class="flex-grow-1 min-w-220">
                  <div class="text-subtitle-1 font-weight-bold">{{ item.productName || `Màu #${item.productColorID}` }}</div>
                  <div class="text-caption text-grey">Mã màu: #{{ item.productColorID }}</div>
                  <div class="text-caption text-grey">Size: {{ item.sizeName || '-' }}</div>
                  <div class="d-flex align-center ga-2 mt-2">
                    <span class="text-caption text-grey">Màu:</span>
                    <span class="color-dot" :style="{ backgroundColor: item.colorCode || '#ddd' }" />
                    <span class="text-caption">{{ item.colorName || 'Không xác định' }}</span>
                  </div>
                </div>

                <div class="d-flex flex-column align-end ga-2">
                  <div class="text-body-2 text-grey">Đơn giá</div>
                  <div class="text-subtitle-1 font-weight-bold">{{ formatPrice(item.price) }}đ</div>
                </div>

                <div class="d-flex align-center ga-2">
                  <v-btn
                    icon="mdi-minus"
                    size="x-small"
                    variant="outlined"
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
                    style="max-width: 88px"
                    @update:model-value="onQuantityInput(item, $event)"
                  />
                  <v-btn
                    icon="mdi-plus"
                    size="x-small"
                    variant="outlined"
                    :disabled="item.isUpdating || item.quantity >= (item.stockQuantity ?? 0)"
                    @click="changeQuantity(item, item.quantity + 1)"
                  />
                </div>

                <div class="d-flex flex-column align-end ga-2">
                  <div class="text-body-2 text-grey">Thành tiền</div>
                  <div class="text-subtitle-1 font-weight-bold text-black">
                    {{ formatPrice(item.price * item.quantity) }}đ
                  </div>
                  <v-btn
                    color="error"
                    variant="text"
                    size="small"
                    prepend-icon="mdi-delete-outline"
                    :loading="item.isRemoving"
                    @click="removeItem(item)"
                  >
                    Xóa
                  </v-btn>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" lg="4">
          <v-card class="summary-card" variant="outlined">
            <v-card-title class="font-weight-bold">Tóm tắt đơn hàng</v-card-title>
            <v-divider />
            <v-card-text>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-body-2 text-grey">Đã chọn</span>
                <span class="font-weight-medium">{{ selectedTotalQuantity }} sản phẩm</span>
              </div>
              <div class="d-flex justify-space-between mb-4">
                <span class="text-body-2 text-grey">Tạm tính</span>
                <span class="font-weight-medium">{{ formatPrice(selectedTotalPrice) }}đ</span>
              </div>
              <v-divider class="mb-4" />
              <div class="d-flex justify-space-between align-center">
                <span class="text-subtitle-1 font-weight-bold">Tổng cộng</span>
                <span class="text-h6 font-weight-bold text-black">{{ formatPrice(selectedTotalPrice) }}đ</span>
              </div>

              <v-btn
                block
                color="primary"
                class="mt-6"
                size="large"
                :disabled="selectedItemIds.length === 0"
                @click="goCheckout"
              >
                Tiếp tục thanh toán
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-empty-state
        v-else-if="!isLoading"
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
</style>
