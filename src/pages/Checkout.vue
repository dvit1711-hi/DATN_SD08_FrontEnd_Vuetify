<template>
  <v-container class="py-8" fluid>
    <div class="mb-6 d-flex align-center justify-space-between flex-wrap ga-3">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Thanh toán</h1>
        <p class="text-subtitle-1 text-grey">Xác nhận sản phẩm đã chọn và phương thức thanh toán</p>
      </div>
      <v-btn variant="outlined" prepend-icon="mdi-arrow-left" @click="goBackCart">Quay lại giỏ hàng</v-btn>
    </div>

    <v-row v-if="checkoutItems.length > 0" class="ga-4">
      <v-col cols="12" lg="8">
        <v-card v-for="item in checkoutItems" :key="item.cartItemID" class="mb-4" variant="outlined">
          <v-card-text class="pa-4 d-flex align-center flex-wrap ga-4">
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
              <div class="text-caption text-grey mt-1">Số lượng: {{ item.quantity }}</div>
            </div>

            <div class="d-flex flex-column align-end ga-2">
              <div class="text-body-2 text-grey">Đơn giá</div>
              <div class="text-subtitle-1 font-weight-bold">{{ formatPrice(item.price) }}đ</div>
            </div>

            <div class="d-flex flex-column align-end ga-2">
              <div class="text-body-2 text-grey">Thành tiền</div>
              <div class="text-subtitle-1 font-weight-bold text-primary">
                {{ formatPrice(item.price * item.quantity) }}đ
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="summary-card" variant="outlined">
          <v-card-title class="font-weight-bold">Thông tin thanh toán</v-card-title>
          <v-divider />
          <v-card-text>
            <div class="d-flex justify-space-between mb-2">
              <span class="text-body-2 text-black">Sản phẩm</span>
              <span class="font-weight-medium">{{ totalQuantity }}</span>
            </div>
            <div class="d-flex justify-space-between mb-4">
              <span class="text-body-2 text-black">Tạm tính</span>
              <span class="font-weight-medium">{{ formatPrice(totalPrice) }}đ</span>
            </div>
            <div class="d-flex justify-space-between mb-4" v-if="discountAmount > 0">
              <span class="text-body-2 text-black">Giảm giá</span>
              <span class="font-weight-medium text-success">-{{ formatPrice(discountAmount) }}đ</span>
            </div>
            <v-divider class="mb-4" />
            <div class="d-flex justify-space-between align-center mb-4">
              <span class="text-subtitle-1 font-weight-bold">Tổng cộng</span>
              <span class="text-h6 font-weight-bold">{{ formatPrice(finalTotal) }}đ</span>
            </div>

            <v-alert
              type="info"
              variant="tonal"
              density="comfortable"
              class="mb-4"
              icon="mdi-map-marker"
              title="Địa chỉ nhận hàng"
              :text="formatAddress(userAddress)"
            />

            <v-select
              v-model="selectedPaymentMethod"
              :items="paymentMethods"
              item-title="label"
              item-value="value"
              label="Phương thức thanh toán"
              variant="outlined"
              density="comfortable"
              hide-details
            />

            <p class="text-caption text-grey mt-2">
              {{ selectedPaymentMethodDescription }}
            </p>

            <v-text-field
              v-model="couponCode"
              label="Mã giảm giá"
              variant="outlined"
              density="comfortable"
              class="mt-4"
              clearable
              @blur="previewCoupon"
            />

            <v-btn
              variant="flat"
              color="primary"
              size="small"
              :disabled="!couponCode || isCheckingOut"
              @click="previewCoupon"
            >
              Áp dụng mã
            </v-btn>

            <v-btn
              block
              color="primary"
              class="mt-6"
              size="large"
              :loading="isCheckingOut"
              :disabled="checkoutItems.length === 0 || isCheckingOut"
              @click="placeOrder"
            >
              Đặt hàng
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-empty-state
      v-else-if="!isLoading"
      title="Chưa có sản phẩm để thanh toán"
      text="Vui lòng chọn sản phẩm trong giỏ hàng trước"
      icon="mdi-cart-off"
    >
      <template #actions>
        <v-btn color="primary" @click="goBackCart">Về giỏ hàng</v-btn>
      </template>
    </v-empty-state>

    <div v-if="isLoading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <v-snackbar v-model="showSnackbar" :color="snackbarColor" timeout="3000" top>
      {{ snackbarMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import accountApi from '@/api/accountApi'
import cartApi from '@/api/cartApi'
import { getAllDiscountCoupons } from '@/api/discountApi'
import paymentApi from '@/api/paymentApi'

const router = useRouter()
const userStore = useUserStore()

const isLoading = ref(false)
const isCheckingOut = ref(false)
const checkoutItems = ref([])
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')
const userAddress = ref(null)
const couponCode = ref('')
const discountAmount = ref(0)
const fallbackImage = 'https://via.placeholder.com/96x96?text=No+Image'

const paymentMethods = [
  { label: 'Thanh toán khi nhận hàng (COD)', value: 'COD', description: 'Admin sẽ xác nhận thanh toán sau khi giao hàng.' },
  { label: 'Chuyển khoản ngân hàng', value: 'BANK_TRANSFER', description: 'Bạn chuyển khoản và admin xác nhận khi nhận tiền.' },
  { label: 'Ví điện tử', value: 'E_WALLET', description: 'Bạn thanh toán qua ví điện tử, admin xác nhận thủ công.' },
]
const selectedPaymentMethod = ref('COD')

const selectedPaymentMethodDescription = computed(() => {
  return paymentMethods.find((m) => m.value === selectedPaymentMethod.value)?.description || ''
})
const totalQuantity = computed(() => checkoutItems.value.reduce((sum, item) => sum + item.quantity, 0))
const totalPrice = computed(() => checkoutItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0))
const finalTotal = computed(() => Math.max(0, totalPrice.value - discountAmount.value))

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price || 0)

const todayText = () => new Date().toISOString().slice(0, 10)

const previewCoupon = async () => {
  const code = String(couponCode.value || '').trim()
  if (!code) {
    discountAmount.value = 0
    return
  }

  try {
    const res = await getAllDiscountCoupons()
    const coupons = res.data || []
    const coupon = coupons.find((x) => String(x.couponCode || '').toLowerCase() === code.toLowerCase())

    if (!coupon) {
      throw new Error('Mã giảm giá không tồn tại')
    }

    if (coupon.active === false) {
      throw new Error('Mã giảm giá đã bị tắt')
    }

    const now = todayText()
    if (coupon.startDate && coupon.startDate > now) {
      throw new Error('Mã giảm giá chưa đến thời gian áp dụng')
    }
    if (coupon.endDate && coupon.endDate < now) {
      throw new Error('Mã giảm giá đã hết hạn')
    }

    const quantity = Number.parseInt(coupon.quantity, 10) || 0
    if (quantity <= 0) {
      throw new Error('Mã giảm giá đã hết lượt sử dụng')
    }

    const minOrderValue = Number(coupon.minOrderValue) || 0
    if (totalPrice.value < minOrderValue) {
      throw new Error('Đơn hàng chưa đạt giá trị tối thiểu để dùng mã giảm giá')
    }

    const value = Number(coupon.discountValue) || 0
    if (value <= 0) {
      throw new Error('Giá trị giảm giá không hợp lệ')
    }

    let discount = 0
    const type = String(coupon.discountType || '').toLowerCase()
    if (type === 'percent') {
      discount = (totalPrice.value * value) / 100
      const maxDiscountValue = Number(coupon.maxDiscountValue) || 0
      if (maxDiscountValue > 0) {
        discount = Math.min(discount, maxDiscountValue)
      }
    } else if (type === 'fixed') {
      discount = value
    } else {
      throw new Error('Loại mã giảm giá không hợp lệ')
    }

    discountAmount.value = Math.min(Math.max(discount, 0), totalPrice.value)
    snackbarMessage.value = 'Áp dụng mã giảm giá thành công'
    snackbarColor.value = 'success'
    showSnackbar.value = true
  } catch (error) {
    discountAmount.value = 0
    snackbarMessage.value = error?.message || 'Mã giảm giá không hợp lệ'
    snackbarColor.value = 'warning'
    showSnackbar.value = true
  }
}

const formatAddress = (address) => {
  if (!address) return 'Bạn chưa cập nhật địa chỉ nhận hàng'

  const parts = [
    address.unitNumber,
    address.streetNumber,
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.region,
    address.postalCode,
  ]
    .map((x) => (x == null ? '' : String(x).trim()))
    .filter((x) => x.length > 0)

  return parts.length > 0 ? parts.join(', ') : 'Bạn chưa cập nhật địa chỉ nhận hàng'
}

const loadUserAddress = async () => {
  const accountId = Number.parseInt(userStore.accountId, 10)
  if (!Number.isFinite(accountId) || accountId <= 0) {
    userAddress.value = null
    return
  }

  try {
    const res = await accountApi.getById(accountId)
    userAddress.value = res.data?.address || null
  } catch (error) {
    console.error('Lỗi tải địa chỉ người dùng:', error)
    userAddress.value = null
  }
}

const loadCheckoutItems = async () => {
  const raw = sessionStorage.getItem('selectedCartItemIds')
  if (!raw) {
    checkoutItems.value = []
    return
  }

  const selectedIds = JSON.parse(raw)
  if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
    checkoutItems.value = []
    return
  }

  isLoading.value = true
  try {
    let currentCartId = Number.parseInt(userStore.cartId, 10)
    if (!Number.isFinite(currentCartId) || currentCartId <= 0) {
      currentCartId = await userStore.getOrCreateCart()
    }

    const itemRes = await cartApi.getByCart(currentCartId)

    const selectedSet = new Set(selectedIds)
    checkoutItems.value = (itemRes.data || [])
      .filter((item) => selectedSet.has(item.cartItemID))
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
        }
      })
  } catch (error) {
    console.error('Lỗi tải dữ liệu checkout:', error)
    snackbarMessage.value = 'Không thể tải dữ liệu thanh toán'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  } finally {
    isLoading.value = false
  }
}

const placeOrder = async () => {
  if (checkoutItems.value.length === 0 || isCheckingOut.value) return

  const accountId = Number.parseInt(userStore.accountId, 10)
  if (!Number.isFinite(accountId) || accountId <= 0) {
    snackbarMessage.value = 'Không xác định được tài khoản thanh toán'
    snackbarColor.value = 'error'
    showSnackbar.value = true
    return
  }

  const invalidItem = checkoutItems.value.find((item) => {
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

  const cartItemIds = checkoutItems.value.map((x) => x.cartItemID)

  isCheckingOut.value = true
  try {
    const res = await paymentApi.checkoutSelected(
      accountId,
      selectedPaymentMethod.value,
      cartItemIds,
      userStore.token,
      couponCode.value,
    )
    sessionStorage.removeItem('selectedCartItemIds')
    window.dispatchEvent(new Event('cart-changed'))
    snackbarMessage.value = `Đặt hàng thành công. Mã đơn #${res.data?.id || res.data?.orderID || ''}`.trim()
    snackbarColor.value = 'success'
    showSnackbar.value = true
    setTimeout(() => {
      router.push({ name: 'PurchaseHistory' })
    }, 600)
  } catch (error) {
    console.error('Lỗi đặt hàng:', error)
    snackbarMessage.value = error?.response?.data?.message || 'Thanh toán thất bại. Vui lòng thử lại'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  } finally {
    isCheckingOut.value = false
  }
}

const goBackCart = () => {
  router.push({ name: 'Cart' })
}

onMounted(async () => {
  await Promise.all([loadCheckoutItems(), loadUserAddress()])
})
</script>

<style scoped>
.summary-card {
  position: sticky;
  top: 24px;
}

.min-w-220 {
  min-width: 220px;
}
</style>
