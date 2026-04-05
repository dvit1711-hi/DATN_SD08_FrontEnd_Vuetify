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

            <!-- Show user's claimed coupons with auto-select highest discount -->
            <v-card v-if="userClaimedCoupons.length > 0" class="mb-4" variant="outlined">
              <v-card-title class="text-subtitle-2 font-weight-bold">
                <v-icon>mdi-gift</v-icon> Mã Giảm Giá Của Bạn
              </v-card-title>
              <v-divider />
              <v-card-text class="pa-4">
                <div v-for="coupon in userClaimedCoupons" :key="coupon.id" class="coupon-select-item mb-3 pa-3 rounded-lg" :class="{ selected: selectedCoupon?.id === coupon.id }" @click="selectCouponForCheckout(coupon)">
                  <div class="d-flex align-center justify-space-between">
                    <div class="d-flex align-center ga-3 flex-grow-1">
                      <v-icon :color="selectedCoupon?.id === coupon.id ? 'primary' : 'grey'">
                        {{ selectedCoupon?.id === coupon.id ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                      </v-icon>
                      <div class="flex-grow-1">
                        <div class="font-weight-bold text-body-2">{{ coupon.discountCoupon.couponCode }}</div>
                        <div class="text-caption text-grey">
                          Giảm {{ coupon.discountCoupon.discountType === 'percent' ? coupon.discountCoupon.discountValue + '%' : formatPrice(coupon.discountCoupon.discountValue) + 'đ' }}
                          <span v-if="coupon.discountCoupon.minOrderValue > 0">
                            (Đơn tối thiểu: {{ formatPrice(coupon.discountCoupon.minOrderValue) }}đ)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="text-h6 font-weight-bold text-success">
                      {{ coupon.discountCoupon.discountType === 'percent' ? coupon.discountCoupon.discountValue + '%' : formatPrice(coupon.discountCoupon.discountValue) + 'đ' }}
                    </div>
                  </div>
                </div>

                <v-divider class="my-3" />

                <v-btn
                  v-if="selectedCoupon"
                  block
                  color="primary"
                  size="small"
                  :loading="isApplyingCoupon"
                  @click="applySelectedCoupon"
                >
                  Áp dụng mã: {{ selectedCoupon.discountCoupon.couponCode }}
                </v-btn>
                <v-btn
                  v-else
                  block
                  variant="outlined"
                  size="small"
                  disabled
                >
                  Chọn một mã để áp dụng
                </v-btn>
              </v-card-text>
            </v-card>

            <!-- Manual coupon input -->
            <div class="d-flex gap-2">
              <v-text-field
                v-model="manualCouponCode"
                label="Hoặc nhập mã giảm giá khác"
                variant="outlined"
                density="comfortable"
                clearable
              />
              <v-btn
                color="primary"
                :disabled="!manualCouponCode || isApplyingCoupon"
                :loading="isApplyingCoupon"
                @click="applyManualCoupon"
              >
                Áp dụng
              </v-btn>
            </div>

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

    <v-dialog v-model="showMBBankDialog" max-width="860" persistent>
      <v-card>
        <v-card-title class="d-flex align-center ga-2">
          <v-icon color="primary">mdi-bank</v-icon>
          Thanh toán online
        </v-card-title>
        <v-divider />

        <v-card-text v-if="mbBankPaymentInfo">
          <p class="text-body-2 mb-3 text-grey">
            Vui lòng chuyển khoản đúng số tiền và nội dung bên dưới để admin xác nhận nhanh hơn.
          </p>

          <v-row class="payment-popup-layout" dense>
            <v-col cols="12" md="5">
              <div class="qr-preview">
                <v-img
                  :src="mbBankPaymentInfo.qrUrl"
                  alt="MB Bank QR"
                  class="qr-image"
                  contain
                />
              </div>
            </v-col>

            <v-col cols="12" md="7">
              <v-list density="compact" class="mb-4">
                <v-list-item>
                  <v-list-item-title class="text-caption text-grey">Ngân hàng</v-list-item-title>
                  <v-list-item-subtitle class="text-body-1 font-weight-medium">{{ mbBankPaymentInfo.bankName }} ({{ mbBankPaymentInfo.bankCode }})</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="text-caption text-grey">Số tài khoản</v-list-item-title>
                  <v-list-item-subtitle class="text-body-1 font-weight-medium">{{ mbBankPaymentInfo.accountNumber }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="text-caption text-grey">Chủ tài khoản</v-list-item-title>
                  <v-list-item-subtitle class="text-body-1 font-weight-medium">{{ mbBankPaymentInfo.accountName }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="text-caption text-grey">Số tiền</v-list-item-title>
                  <v-list-item-subtitle class="text-body-1 font-weight-bold text-primary">{{ formatPrice(mbBankPaymentInfo.amount) }}đ</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="text-caption text-grey">Nội dung chuyển khoản</v-list-item-title>
                  <v-list-item-subtitle class="text-body-1 font-weight-bold">{{ mbBankPaymentInfo.transferContent }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>

              <div class="d-flex ga-2 flex-wrap">
                <v-btn variant="outlined" prepend-icon="mdi-content-copy" @click="copyToClipboard(mbBankPaymentInfo.accountNumber, 'Số tài khoản')">
                  Sao chép số tài khoản
                </v-btn>
                <v-btn variant="outlined" prepend-icon="mdi-content-copy" @click="copyToClipboard(mbBankPaymentInfo.transferContent, 'Nội dung chuyển khoản')">
                  Sao chép nội dung
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-text v-else class="d-flex align-center justify-center py-8">
          <v-progress-circular indeterminate color="primary" size="36" />
        </v-card-text>

        <v-divider />
        <v-card-actions class="justify-end">
          <v-btn variant="text" :loading="isClosingOnlineDialog" @click="closeOnlinePaymentDialog">Đóng</v-btn>
          <v-btn color="primary" :loading="isConfirmingTransfer" @click="confirmOnlineTransfer">Xác Nhận Thanh Toán</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
import userDiscountCouponApi from '@/api/userDiscountCouponApi'
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
const manualCouponCode = ref('')
const discountAmount = ref(0)
const userClaimedCoupons = ref([])
const selectedCoupon = ref(null)
const isApplyingCoupon = ref(false)
const fallbackImage = 'https://via.placeholder.com/96x96?text=No+Image'
const showMBBankDialog = ref(false)
const mbBankPaymentInfo = ref(null)
const pendingOnlineOrderId = ref(null)
const isConfirmingTransfer = ref(false)
const isClosingOnlineDialog = ref(false)
const ONLINE_CONFIRMED_ORDERS_KEY = 'onlineTransferConfirmedOrderIds'
const HIDDEN_CANCELLED_ONLINE_ORDERS_KEY = 'hiddenCancelledOnlineOrderIds'

const paymentMethods = [
  { label: 'Thanh toán khi nhận hàng (COD)', value: 'COD', description: 'Admin sẽ xác nhận thanh toán sau khi giao hàng.' },
  { label: 'Thanh toán ngân hàng (QR)', value: 'BANK_TRANSFER', description: 'Hệ thống tạo mã QR chuyển khoản theo đơn hàng để bạn thanh toán nhanh.' },
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

const loadUserClaimedCoupons = async () => {
  const accountId = Number.parseInt(userStore.accountId, 10)
  if (!Number.isFinite(accountId) || accountId <= 0) {
    userClaimedCoupons.value = []
    return
  }

  try {
    const res = await userDiscountCouponApi.getClaimedDiscountCoupons(accountId)
    const claimed = (res.data || []).filter(uc => uc.status === 'claimed')
    userClaimedCoupons.value = claimed
    
    // Auto-select coupon with highest discount percentage
    if (claimed.length > 0) {
      let maxCoupon = claimed[0]
      let maxPercent = 0
      
      for (const coupon of claimed) {
        const value = Number(coupon.discountCoupon?.discountValue) || 0
        const isPercent = (coupon.discountCoupon?.discountType || '').toLowerCase() === 'percent'
        const percent = isPercent ? value : 0
        
        if (percent > maxPercent) {
          maxPercent = percent
          maxCoupon = coupon
        }
      }
      
      selectedCoupon.value = maxCoupon
      // Auto-apply the highest discount coupon
      couponCode.value = maxCoupon.discountCoupon.couponCode
      await previewCoupon()
    }
  } catch (error) {
    console.error('Lỗi tải mã giảm giá đã nhận:', error)
    userClaimedCoupons.value = []
  }
}

const selectCouponForCheckout = (coupon) => {
  selectedCoupon.value = selectedCoupon.value?.id === coupon.id ? null : coupon
}

const applySelectedCoupon = async () => {
  if (!selectedCoupon.value) return
  isApplyingCoupon.value = true
  try {
    couponCode.value = selectedCoupon.value.discountCoupon.couponCode
    await previewCoupon()
  } finally {
    isApplyingCoupon.value = false
  }
}

const applyManualCoupon = async () => {
  if (!manualCouponCode.value) return
  isApplyingCoupon.value = true
  try {
    couponCode.value = manualCouponCode.value
    await previewCoupon()
  } finally {
    isApplyingCoupon.value = false
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
  const paymentMethodForCheckout = selectedPaymentMethod.value
  const shouldShowBankQr = selectedPaymentMethod.value === 'BANK_TRANSFER'

  isCheckingOut.value = true
  try {
    const res = await paymentApi.checkoutSelected(
      accountId,
      paymentMethodForCheckout,
      cartItemIds,
      userStore.token,
      couponCode.value,
    )
    const orderId =
      res.data?.id ||
      res.data?.orderID ||
      res.data?.orderId ||
      res.data?.data?.id ||
      res.data?.data?.orderId

    sessionStorage.removeItem('selectedCartItemIds')
    window.dispatchEvent(new Event('cart-changed'))

    if (shouldShowBankQr) {
      if (!orderId) {
        snackbarMessage.value = 'Đặt đơn thành công nhưng chưa đọc được mã đơn để tạo QR. Vui lòng thử lại.'
        snackbarColor.value = 'warning'
        showSnackbar.value = true
        return
      }

      try {
        const mbRes = await paymentApi.getMBBankInfo(orderId, userStore.token)
        mbBankPaymentInfo.value = mbRes.data || null
        pendingOnlineOrderId.value = orderId
        showMBBankDialog.value = true
        return
      } catch (qrError) {
        console.error('Lỗi tải QR MB Bank:', qrError)
        snackbarMessage.value = `Đơn #${orderId} đã tạo nhưng chưa tải được QR. Vui lòng bấm đặt hàng lại hoặc liên hệ admin.`
        snackbarColor.value = 'warning'
        showSnackbar.value = true
        return
      }
    }

    snackbarMessage.value = `Đặt hàng thành công. Mã đơn #${orderId || ''}`.trim()
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

const goToPurchaseHistory = () => {
  showMBBankDialog.value = false
  router.push({ name: 'PurchaseHistory' })
}

const closeOnlinePaymentDialog = async () => {
  if (!pendingOnlineOrderId.value || isClosingOnlineDialog.value) {
    showMBBankDialog.value = false
    return
  }

  const accountId = Number.parseInt(userStore.accountId, 10)
  if (!Number.isFinite(accountId) || accountId <= 0) {
    showMBBankDialog.value = false
    return
  }

  isClosingOnlineDialog.value = true
  try {
    await paymentApi.cancelOrderByUser(accountId, pendingOnlineOrderId.value, userStore.token)
    markCancelledOnlineOrderHidden(pendingOnlineOrderId.value)
    removeOnlineConfirmedOrderId(pendingOnlineOrderId.value)
    pendingOnlineOrderId.value = null
    mbBankPaymentInfo.value = null
    showMBBankDialog.value = false
    router.push({ name: 'Cart' })
  } catch (error) {
    console.error('Lỗi hủy đơn online khi đóng popup:', error)
    snackbarMessage.value = error?.response?.data?.message || 'Không thể đóng thanh toán online lúc này. Vui lòng thử lại.'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  } finally {
    isClosingOnlineDialog.value = false
  }
}

const confirmOnlineTransfer = async () => {
  if (!pendingOnlineOrderId.value || isConfirmingTransfer.value) {
    goToPurchaseHistory()
    return
  }

  const confirmedOrderId = pendingOnlineOrderId.value
  isConfirmingTransfer.value = true
  try {
    markOnlineOrderConfirmed(confirmedOrderId)
    snackbarMessage.value = `Đơn #${confirmedOrderId} đang chờ admin xác nhận thanh toán`
    snackbarColor.value = 'success'
    showSnackbar.value = true
    pendingOnlineOrderId.value = null
    mbBankPaymentInfo.value = null
    goToPurchaseHistory()
  } catch (error) {
    console.error('Lỗi xác nhận chuyển khoản:', error)
    snackbarMessage.value = error?.response?.data?.message || 'Chưa thể xác nhận chuyển khoản, vui lòng thử lại'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  } finally {
    isConfirmingTransfer.value = false
  }
}

const copyToClipboard = async (value, label) => {
  try {
    await navigator.clipboard.writeText(String(value || ''))
    snackbarMessage.value = `${label} đã được sao chép`
    snackbarColor.value = 'success'
    showSnackbar.value = true
  } catch (error) {
    snackbarMessage.value = `Không thể sao chép ${label.toLowerCase()}`
    snackbarColor.value = 'warning'
    showSnackbar.value = true
  }
}

const getOnlineConfirmedOrderIds = () => {
  try {
    const raw = localStorage.getItem(ONLINE_CONFIRMED_ORDERS_KEY)
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed.map((x) => Number.parseInt(x, 10)).filter(Number.isFinite) : []
  } catch {
    return []
  }
}

const saveOnlineConfirmedOrderIds = (ids) => {
  localStorage.setItem(ONLINE_CONFIRMED_ORDERS_KEY, JSON.stringify(ids))
}

const getHiddenCancelledOnlineOrderIds = () => {
  try {
    const raw = localStorage.getItem(HIDDEN_CANCELLED_ONLINE_ORDERS_KEY)
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed.map((x) => Number.parseInt(x, 10)).filter(Number.isFinite) : []
  } catch {
    return []
  }
}

const saveHiddenCancelledOnlineOrderIds = (ids) => {
  localStorage.setItem(HIDDEN_CANCELLED_ONLINE_ORDERS_KEY, JSON.stringify(ids))
}

const markOnlineOrderConfirmed = (orderId) => {
  const numericOrderId = Number.parseInt(orderId, 10)
  if (!Number.isFinite(numericOrderId)) return
  const ids = getOnlineConfirmedOrderIds()
  if (!ids.includes(numericOrderId)) {
    ids.push(numericOrderId)
    saveOnlineConfirmedOrderIds(ids)
  }
}

const removeOnlineConfirmedOrderId = (orderId) => {
  const numericOrderId = Number.parseInt(orderId, 10)
  if (!Number.isFinite(numericOrderId)) return
  const ids = getOnlineConfirmedOrderIds().filter((id) => id !== numericOrderId)
  saveOnlineConfirmedOrderIds(ids)
}

const markCancelledOnlineOrderHidden = (orderId) => {
  const numericOrderId = Number.parseInt(orderId, 10)
  if (!Number.isFinite(numericOrderId)) return
  const ids = getHiddenCancelledOnlineOrderIds()
  if (!ids.includes(numericOrderId)) {
    ids.push(numericOrderId)
    saveHiddenCancelledOnlineOrderIds(ids)
  }
}

onMounted(async () => {
  await Promise.all([loadCheckoutItems(), loadUserAddress(), loadUserClaimedCoupons()])
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

.coupon-select-item {
  border: 2px solid #e0e0e0;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fafafa;
}

.coupon-select-item:hover {
  border-color: #1976d2;
  background-color: #f0f7ff;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.12);
}

.coupon-select-item.selected {
  border-color: #1976d2;
  background-color: #e3f2fd;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.24);
}

.rounded-lg {
  border-radius: 8px;
}

.payment-popup-layout {
  align-items: flex-start;
}

.qr-preview {
  width: min(100%, 320px);
  aspect-ratio: 1 / 1;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background: #ffffff;
}

.qr-image {
  width: 100%;
  height: 100%;
}
</style>
