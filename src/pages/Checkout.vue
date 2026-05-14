<template>
  <div class="checkout-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Thanh toán đơn hàng</h1>
      </div>
      <div class="header-right">
        <button class="btn-back" @click="goBackCart">
          <v-icon icon="mdi-arrow-left" size="14" />
          Quay lại giỏ hàng
        </button>
        <div class="checkout-steps">
          <span class="step done">Giỏ hàng</span>
          <span class="step-sep" />
          <span class="step active">Thanh toán</span>
          <span class="step-sep" />
          <span class="step">Hoàn tất</span>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-state">
      <v-progress-circular indeterminate color="black" size="36" width="2" />
    </div>

    <!-- Empty -->
    <div v-else-if="checkoutItems.length === 0" class="empty-state">
      <p class="empty-title">Không có sản phẩm nào để thanh toán</p>
      <button class="btn-outline" @click="goBackCart">Quay lại giỏ hàng</button>
    </div>

    <!-- Checkout Layout -->
    <div v-else class="checkout-layout">
      <!-- Left Column -->
      <div class="checkout-left">

        <!-- Section 1: Address -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-num">1</div>
            <h2 class="section-title">Địa chỉ nhận hàng</h2>
          </div>
          <div class="section-body">
            <!-- Mode Toggle -->
            <div class="mode-toggle">
              <button
                class="toggle-btn"
                :class="{ active: addressMode === 'saved' }"
                @click="addressMode = 'saved'"
              >
                Địa chỉ đã lưu
              </button>
              <button
                class="toggle-btn"
                :class="{ active: addressMode === 'new' }"
                @click="addressMode = 'new'"
              >
                Thêm địa chỉ mới
              </button>
            </div>

            <!-- Saved Address -->
            <template v-if="addressMode === 'saved'">
              <div class="field">
                <label class="field-label">Chọn địa chỉ</label>
                <select
                  v-model="selectedAddressId"
                  class="field-select"
                  :disabled="isLoadingSavedAddresses || savedAddressOptions.length === 0"
                  @change="onSavedAddressChange"
                >
                  <option v-if="savedAddressOptions.length === 0" value="">Chưa có địa chỉ nào</option>
                  <option
                    v-for="addr in savedAddressOptions"
                    :key="addr.id"
                    :value="addr.id"
                  >
                    {{ addr.label }}
                  </option>
                </select>
              </div>
              <div v-if="selectedSavedAddress" class="address-preview">
                <v-icon icon="mdi-map-marker-outline" size="14" style="margin-right:6px;opacity:0.5" />
                {{ selectedSavedAddressLabel }}
              </div>
            </template>

            <!-- New Address -->
            <template v-else>
              <div class="field-grid two">
                <div class="field">
                  <label class="field-label">Số nhà</label>
                  <input v-model="newAddressForm.unitNumber" class="field-input" placeholder="VD: 123A" />
                </div>
                <div class="field">
                  <label class="field-label">Số đường</label>
                  <input v-model="newAddressForm.streetNumber" class="field-input" placeholder="VD: 456" />
                </div>
              </div>
              <div class="field">
                <label class="field-label">Tên đường</label>
                <input v-model="newAddressForm.addressLine1" class="field-input" placeholder="VD: Phố Huế" />
              </div>
              <div class="field-grid three">
                <div class="field">
                  <label class="field-label">Tỉnh / Thành phố *</label>
                  <select
                    v-model="shippingInput.provinceId"
                    class="field-select"
                    :disabled="isLoadingProvinces"
                    @change="onProvinceChange"
                  >
                    <option value="">Chọn tỉnh...</option>
                    <option
                      v-for="p in ghnProvinces"
                      :key="p.provinceId"
                      :value="p.provinceId"
                    >
                      {{ p.provinceName }}
                    </option>
                  </select>
                </div>
                <div class="field">
                  <label class="field-label">Quận / Huyện *</label>
                  <select
                    v-model="shippingInput.toDistrictId"
                    class="field-select"
                    :disabled="!shippingInput.provinceId || isLoadingDistricts"
                    @change="onDistrictChange"
                  >
                    <option value="">Chọn quận...</option>
                    <option
                      v-for="d in ghnDistricts"
                      :key="d.districtId"
                      :value="d.districtId"
                    >
                      {{ d.districtName }}
                    </option>
                  </select>
                </div>
                <div class="field">
                  <label class="field-label">Phường / Xã *</label>
                  <select
                    v-model="shippingInput.toWardCode"
                    class="field-select"
                    :disabled="!shippingInput.toDistrictId || isLoadingWards"
                  >
                    <option value="">Chọn phường...</option>
                    <option
                      v-for="w in ghnWards"
                      :key="w.wardCode"
                      :value="w.wardCode"
                    >
                      {{ w.wardName }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="field">
                <label class="field-label">Mã bưu chính</label>
                <input v-model="newAddressForm.postalCode" class="field-input" placeholder="Không bắt buộc" />
              </div>
              <button
                class="btn-save-address"
                :disabled="isSavingNewAddress"
                @click="saveNewAddress"
              >
                <v-progress-circular v-if="isSavingNewAddress" indeterminate size="14" width="2" color="white" />
                <v-icon v-else icon="mdi-check" size="14" />
                Lưu & sử dụng địa chỉ này
              </button>
            </template>
          </div>
        </div>

        <!-- Section 2: Payment Method -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-num">2</div>
            <h2 class="section-title">Phương thức thanh toán</h2>
          </div>
          <div class="section-body">
            <div
              v-for="method in paymentMethods"
              :key="method.value"
              class="pay-option"
              :class="{ selected: selectedPaymentMethod === method.value }"
              @click="selectedPaymentMethod = method.value"
            >
              <div class="radio-circle" :class="{ on: selectedPaymentMethod === method.value }">
                <div v-if="selectedPaymentMethod === method.value" class="radio-dot" />
              </div>
              <v-icon :icon="method.icon" size="20" style="opacity:0.5;flex-shrink:0" />
              <div class="pay-info">
                <p class="pay-name">{{ method.label }}</p>
                <p class="pay-desc">{{ method.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 3: Discount -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-num">3</div>
            <h2 class="section-title">Mã giảm giá</h2>
          </div>
          <div class="section-body">
            <!-- Applied Coupon -->
            <div v-if="discountAmount > 0" class="coupon-applied">
              <div class="coupon-applied-inner">
                <v-icon icon="mdi-tag-outline" size="16" />
                <span class="coupon-code-text">{{ couponCode }}</span>
                <span class="coupon-save">Tiết kiệm {{ formatPrice(discountAmount) }}đ</span>
              </div>
              <button
                class="coupon-remove"
                @click="() => { selectedCoupon = null; couponCode = ''; discountAmount = 0 }"
              >
                <v-icon icon="mdi-close" size="14" />
              </button>
            </div>

            <!-- My Coupons -->
            <template v-if="qualifiedUserClaimedCoupons.length > 0">
              <p class="coupon-section-label">
                <v-icon icon="mdi-gift-outline" size="13" style="margin-right:4px" />
                Mã của bạn
              </p>
              <div class="coupon-grid">
                <div
                  v-for="coupon in qualifiedUserClaimedCoupons"
                  :key="coupon.id"
                  class="coupon-card"
                  :class="{ selected: selectedCoupon?.id === coupon.id }"
                  @click="selectCouponForCheckout(coupon)"
                >
                  <div class="coupon-badge">
                    <span v-if="coupon.discountCoupon.discountType === 'percent'">
                      {{ coupon.discountCoupon.discountValue }}%
                    </span>
                    <span v-else>{{ formatPrice(coupon.discountCoupon.discountValue) }}đ</span>
                  </div>
                  <div class="coupon-info">
                    <p class="coupon-code-label">{{ coupon.discountCoupon.couponCode }}</p>
                    <p class="coupon-desc">
                      Giảm {{ coupon.discountCoupon.discountType === 'percent'
                        ? coupon.discountCoupon.discountValue + '%'
                        : formatPrice(coupon.discountCoupon.discountValue) + 'đ' }}
                    </p>
                    <p v-if="coupon.discountCoupon.minOrderValue > 0" class="coupon-min">
                      Tối thiểu {{ formatPrice(coupon.discountCoupon.minOrderValue) }}đ
                    </p>
                  </div>
                  <v-icon
                    :icon="selectedCoupon?.id === coupon.id ? 'mdi-check-circle' : 'mdi-circle-outline'"
                    size="18"
                    class="coupon-check"
                  />
                </div>
              </div>
              <button
                v-if="selectedCoupon"
                class="btn-apply-coupon"
                :disabled="isApplyingCoupon"
                @click="applySelectedCoupon"
              >
                Áp dụng mã đã chọn
              </button>
            </template>

            <!-- Manual Input -->
            <p class="coupon-section-label" style="margin-top:16px">
              <v-icon icon="mdi-keyboard-outline" size="13" style="margin-right:4px" />
              Nhập mã khác
            </p>
            <div class="coupon-input-row">
              <input
                v-model="manualCouponCode"
                class="coupon-input"
                placeholder="Nhập mã giảm giá..."
                @keyup.enter="applyManualCoupon"
              />
              <button
                class="btn-coupon-apply"
                :disabled="!manualCouponCode || isApplyingCoupon"
                @click="applyManualCoupon"
              >
                Áp dụng
              </button>
            </div>

            <!-- Available Coupons List -->
            <template v-if="couponsDisplay.length > 0">
              <p class="coupon-section-label" style="margin-top:16px">
                <v-icon icon="mdi-tag-multiple-outline" size="13" style="margin-right:4px" />
                Mã khả dụng
              </p>
              <select
                v-model="selectedAvailableCoupon"
                class="field-select"
                :disabled="isLoadingAvailableCoupons"
                @change="(e) => { if (e.target.value) applyAvailableCoupon(JSON.parse(e.target.value)) }"
              >
                <option value="">Chọn mã từ danh sách...</option>
                <option
                  v-for="c in couponsDisplay"
                  :key="c.couponCode"
                  :value="JSON.stringify(c)"
                >
                  {{ c.displayText }}
                </option>
              </select>
            </template>
          </div>
        </div>
      </div>

      <!-- Right Column: Summary -->
      <div class="checkout-right">
        <div class="summary-card">
          <p class="summary-eyebrow">Order Summary</p>
          <h2 class="summary-heading">Thông tin đơn hàng</h2>

          <!-- Items -->
          <div class="order-items">
            <div
              v-for="item in checkoutItems"
              :key="item.cartItemID"
              class="order-item"
            >
              <div class="order-item-img">
                <v-img
                  :src="item.mainImage || fallbackImage"
                  width="52"
                  height="52"
                  cover
                  style="border-radius:6px"
                />
              </div>
              <div class="order-item-info">
                <p class="order-item-name">{{ item.productName }}</p>
                <p class="order-item-meta">{{ item.colorName }} · {{ item.sizeName || '-' }}</p>
              </div>
              <div class="order-item-price">
                <p class="order-item-amount">{{ formatPrice(item.price * item.quantity) }}đ</p>
                <p class="order-item-qty">×{{ item.quantity }}</p>
              </div>
            </div>
          </div>

          <div class="summary-divider" />

          <!-- Totals -->
          <div class="summary-rows">
            <div class="sum-row">
              <span>Tạm tính</span>
              <span>{{ formatPrice(totalPrice) }}đ</span>
            </div>
            <div v-if="discountAmount > 0" class="sum-row discount">
              <span>Giảm giá</span>
              <span>−{{ formatPrice(discountAmount) }}đ</span>
            </div>
            <div class="sum-row">
              <span>Phí vận chuyển</span>
              <span>{{ shippingFee > 0 ? formatPrice(shippingFee) + 'đ' : 'Đang tính...' }}</span>
            </div>
          </div>

          <div class="summary-divider" />

          <div class="summary-total">
            <span>Tổng cộng</span>
            <span class="total-amount">{{ formatPrice(finalTotal) }}đ</span>
          </div>

          <button
            class="btn-checkout"
            :disabled="checkoutItems.length === 0 || isCheckingOut"
            @click="placeOrder"
          >
            <v-progress-circular v-if="isCheckingOut" indeterminate size="14" width="2" color="white" style="margin-right:8px" />
            Đặt hàng ngay
          </button>

          <div class="security-note">
            <v-icon icon="mdi-shield-check-outline" size="13" />
            Thanh toán an toàn & bảo mật
          </div>
        </div>
      </div>
    </div>

    <!-- MB Bank QR Dialog -->
    <v-dialog v-model="showMBBankDialog" max-width="780" persistent>
      <v-card rounded="lg" elevation="0">
        <div class="dialog-header">
          <div>
            <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(0,0,0,0.4);margin-bottom:4px">Bank Transfer</p>
            <h3 style="font-size:18px;font-weight:500">Thanh toán ngân hàng</h3>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="closeOnlinePaymentDialog" />
        </div>

        <v-divider />

        <div v-if="mbBankPaymentInfo" class="dialog-body">
          <p style="font-size:13px;color:rgba(0,0,0,0.5);margin-bottom:20px">
            Chuyển khoản đúng số tiền và nội dung bên dưới để được xác nhận nhanh hơn.
          </p>
          <div class="qr-layout">
            <div class="qr-box">
              <v-img :src="mbBankPaymentInfo.qrUrl" alt="QR Code" contain width="240" height="240" />
            </div>
            <div class="qr-info">
              <div class="info-row">
                <span class="info-label">Ngân hàng</span>
                <span class="info-value">{{ mbBankPaymentInfo.bankName }} ({{ mbBankPaymentInfo.bankCode }})</span>
              </div>
              <div class="info-row">
                <span class="info-label">Số tài khoản</span>
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="info-value">{{ mbBankPaymentInfo.accountNumber }}</span>
                  <button class="copy-btn" @click="copyToClipboard(mbBankPaymentInfo.accountNumber, 'Số tài khoản')">
                    <v-icon icon="mdi-content-copy" size="13" />
                  </button>
                </div>
              </div>
              <div class="info-row">
                <span class="info-label">Chủ tài khoản</span>
                <span class="info-value">{{ mbBankPaymentInfo.accountName }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Số tiền</span>
                <span class="info-value" style="font-weight:500;font-size:16px">{{ formatPrice(mbBankPaymentInfo.amount) }}đ</span>
              </div>
              <div class="info-row">
                <span class="info-label">Nội dung</span>
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="info-value" style="font-weight:500">{{ mbBankPaymentInfo.transferContent }}</span>
                  <button class="copy-btn" @click="copyToClipboard(mbBankPaymentInfo.transferContent, 'Nội dung')">
                    <v-icon icon="mdi-content-copy" size="13" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="dialog-loading">
          <v-progress-circular indeterminate color="black" size="32" width="2" />
        </div>

        <v-divider />
        <div class="dialog-actions">
          <button class="btn-outline" :disabled="isClosingOnlineDialog" @click="closeOnlinePaymentDialog">
            Hủy đơn & đóng
          </button>
          <button class="btn-primary" :disabled="isConfirmingTransfer" @click="confirmOnlineTransfer">
            Đã chuyển khoản xong
          </button>
        </div>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="showSnackbar" :color="snackbarColor" timeout="3000" location="top" rounded="lg">
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import addressApi from '@/api/addressApi'
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
const savedAddresses = ref([])
const selectedAddressId = ref(null)
const addressMode = ref('saved')
const newAddressForm = ref({ unitNumber: '', streetNumber: '', addressLine1: '', postalCode: '' })
const isLoadingSavedAddresses = ref(false)
const isSavingNewAddress = ref(false)
const couponCode = ref('')
const manualCouponCode = ref('')
const discountAmount = ref(0)
const userClaimedCoupons = ref([])
const selectedCoupon = ref(null)
const isApplyingCoupon = ref(false)
const availableCoupons = ref([])
const isLoadingAvailableCoupons = ref(false)
const selectedAvailableCoupon = ref('')
const fallbackImage = 'https://via.placeholder.com/96x96?text=No+Image'
const showMBBankDialog = ref(false)
const mbBankPaymentInfo = ref(null)
const pendingOnlineOrderId = ref(null)
const isConfirmingTransfer = ref(false)
const isClosingOnlineDialog = ref(false)
const shippingFee = ref(0)
const isCalculatingShipping = ref(false)
const isLoadingProvinces = ref(false)
const isLoadingDistricts = ref(false)
const isLoadingWards = ref(false)
const ghnProvinces = ref([])
const ghnDistricts = ref([])
const ghnWards = ref([])
const isQuickBuyMode = ref(false)
const quickBuyCartItemId = ref(null)
const isQuickBuyOrderPlaced = ref(false)
const isCleaningUpQuickBuy = ref(false)
const quickBuyOriginalQuantity = ref(0)
const quickBuyProductColorId = ref(null)
const quickBuyCartId = ref(null)
const shippingInput = ref({
  provinceId: null,
  toDistrictId: '',
  toWardCode: '',
  weight: 1000,
  length: 20,
  width: 20,
  height: 20,
})

const ONLINE_CONFIRMED_ORDERS_KEY = 'onlineTransferConfirmedOrderIds'
const HIDDEN_CANCELLED_ONLINE_ORDERS_KEY = 'hiddenCancelledOnlineOrderIds'
const SELECTED_CART_ITEM_IDS_KEY = 'selectedCartItemIds'
const QUICK_BUY_CONTEXT_KEY = 'quickBuyContext'

const paymentMethods = [
  {
    label: 'Thanh toán khi nhận hàng (COD)',
    value: 'COD',
    icon: 'mdi-truck-delivery-outline',
    description: 'Trả tiền mặt khi nhận hàng tại nhà',
  },
  {
    label: 'Chuyển khoản ngân hàng (QR)',
    value: 'BANK_TRANSFER',
    icon: 'mdi-qrcode',
    description: 'Quét mã QR MB Bank — xác nhận nhanh qua admin',
  },
]
const selectedPaymentMethod = ref('COD')

// ── Computed ──
const savedAddressOptions = computed(() =>
  savedAddresses.value.map((a) => ({ ...a, label: formatAddress(a) })),
)
const selectedSavedAddress = computed(() =>
  savedAddresses.value.find((a) => Number(a.id) === Number(selectedAddressId.value)) || null,
)
const selectedSavedAddressLabel = computed(() => formatAddress(selectedSavedAddress.value))
const totalQuantity = computed(() => checkoutItems.value.reduce((s, i) => s + i.quantity, 0))
const totalPrice = computed(() => checkoutItems.value.reduce((s, i) => s + i.price * i.quantity, 0))
const finalTotal = computed(() =>
  Math.max(0, totalPrice.value - discountAmount.value) + Math.max(0, Number(shippingFee.value) || 0),
)
const qualifiedUserClaimedCoupons = computed(() =>
  userClaimedCoupons.value.filter((c) => {
    const min = Number(c.discountCoupon?.minOrderValue) || 0
    return totalPrice.value >= min && !isExpired(c.discountCoupon?.endDate)
  }),
)
const couponsDisplay = computed(() =>
  availableCoupons.value
    .filter((c) => {
      const min = Number(c.minOrderValue) || 0
      return totalPrice.value >= min && !isExpired(c.endDate)
    })
    .map((c) => ({
      ...c,
      displayText:
        c.couponCode +
        (c.discountType === 'percent'
          ? ` — Giảm ${c.discountValue}%`
          : ` — Giảm ${formatPrice(c.discountValue)}đ`),
    })),
)

// ── Helpers ──
const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p || 0)
const todayText = () => new Date().toISOString().slice(0, 10)
const isExpired = (d) => (d ? d < todayText() : false)
const notify = (msg, color = 'success') => {
  snackbarMessage.value = msg
  snackbarColor.value = color
  showSnackbar.value = true
}

const isCouponValid = (c) => {
  if (!c || c.active === false) return false
  const now = todayText()
  if (c.startDate && c.startDate > now) return false
  if (c.endDate && c.endDate < now) return false
  if ((Number.parseInt(c.quantity, 10) || 0) <= 0) return false
  if ((Number(c.discountValue) || 0) <= 0) return false
  return true
}

const meetsMinOrderValue = (c) => totalPrice.value >= (Number(c.minOrderValue) || 0)

const calculateDiscount = (c) => {
  const value = Number(c.discountValue) || 0
  const type = String(c.discountType || '').toLowerCase()
  let discount = type === 'percent' ? (totalPrice.value * value) / 100 : value
  if (type === 'percent' && Number(c.maxDiscountValue) > 0) {
    discount = Math.min(discount, Number(c.maxDiscountValue))
  }
  return Math.min(Math.max(discount, 0), totalPrice.value)
}

const formatAddress = (a) => {
  if (!a) return 'Bạn chưa cập nhật địa chỉ nhận hàng'
  const parts = [a.unitNumber, a.streetNumber, a.addressLine1, a.addressLine2, a.region, a.city]
    .map((x) => String(x || '').trim())
    .filter(Boolean)
  return parts.length ? parts.join(', ') : 'Bạn chưa cập nhật địa chỉ nhận hàng'
}

const normalizeText = (v) => String(v || '').trim().toLowerCase()
const findProvinceByName = (n) =>
  ghnProvinces.value.find((x) => normalizeText(x.provinceName) === normalizeText(n)) || null
const findDistrictByName = (n) =>
  ghnDistricts.value.find((x) => normalizeText(x.districtName) === normalizeText(n)) || null

// ── GHN ──
const applySavedAddressToGhn = async (address) => {
  if (!address) return
  const province = findProvinceByName(address.city)
  if (!province) return
  shippingInput.value.provinceId = province.provinceId
  await onProvinceChange()
  const district = findDistrictByName(address.region)
  if (!district) return
  shippingInput.value.toDistrictId = district.districtId
  await onDistrictChange()
  const ward = ghnWards.value.find((x) => normalizeText(x.wardName) === normalizeText(address.addressLine2))
  if (ward) shippingInput.value.toWardCode = ward.wardCode
}

const loadGhnProvinces = async () => {
  isLoadingProvinces.value = true
  try {
    const res = await paymentApi.getGhnProvinces(userStore.token)
    ghnProvinces.value = Array.isArray(res.data) ? res.data : []
  } catch {
    notify('Không thể tải danh sách tỉnh/thành', 'warning')
  } finally {
    isLoadingProvinces.value = false
  }
}

const onProvinceChange = async () => {
  shippingInput.value.toDistrictId = ''
  shippingInput.value.toWardCode = ''
  ghnDistricts.value = []
  ghnWards.value = []
  const id = Number.parseInt(shippingInput.value.provinceId, 10)
  if (!Number.isFinite(id) || id <= 0) return
  isLoadingDistricts.value = true
  try {
    const res = await paymentApi.getGhnDistricts(id, userStore.token)
    ghnDistricts.value = Array.isArray(res.data) ? res.data : []
  } catch {
    notify('Không thể tải danh sách quận/huyện', 'warning')
  } finally {
    isLoadingDistricts.value = false
  }
}

const onDistrictChange = async () => {
  shippingInput.value.toWardCode = ''
  ghnWards.value = []
  const id = Number.parseInt(shippingInput.value.toDistrictId, 10)
  if (!Number.isFinite(id) || id <= 0) return
  isLoadingWards.value = true
  try {
    const res = await paymentApi.getGhnWards(id, userStore.token)
    ghnWards.value = Array.isArray(res.data) ? res.data : []
  } catch {
    notify('Không thể tải danh sách phường/xã', 'warning')
  } finally {
    isLoadingWards.value = false
  }
}

const calculateGhnShippingFee = async (silent = false) => {
  const toDistrictId = Number.parseInt(shippingInput.value.toDistrictId, 10)
  const toWardCode = String(shippingInput.value.toWardCode || '').trim()
  if (!Number.isFinite(toDistrictId) || toDistrictId <= 0 || !toWardCode) return
  isCalculatingShipping.value = true
  try {
    const res = await paymentApi.getGhnShippingFee(
      {
        toDistrictId,
        toWardCode,
        weight: Number.parseInt(shippingInput.value.weight, 10) || 1000,
        length: Number.parseInt(shippingInput.value.length, 10) || 20,
        width: Number.parseInt(shippingInput.value.width, 10) || 20,
        height: Number.parseInt(shippingInput.value.height, 10) || 20,
        insuranceValue: Number(totalPrice.value) || 0,
      },
      userStore.token,
    )
    shippingFee.value = Number(res.data?.shippingFee) || 0
    if (!silent) notify('Đã cập nhật phí vận chuyển')
  } catch (error) {
    shippingFee.value = 0
    if (!silent) notify(error?.response?.data?.message || 'Không thể tính phí vận chuyển', 'error')
  } finally {
    isCalculatingShipping.value = false
  }
}

watch(
  () => [shippingInput.value.toDistrictId, shippingInput.value.toWardCode],
  async ([d, w]) => {
    if (!d || !w || isCalculatingShipping.value) return
    await calculateGhnShippingFee(true)
  },
)

// ── Addresses ──
const loadSavedAddresses = async () => {
  const accountId = Number.parseInt(userStore.accountId, 10)
  if (!Number.isFinite(accountId) || accountId <= 0) return
  isLoadingSavedAddresses.value = true
  try {
    const res = await addressApi.getByAccountId(accountId, userStore.token)
    savedAddresses.value = Array.isArray(res.data) ? res.data : []
    if (savedAddresses.value.length > 0) {
      selectedAddressId.value = savedAddresses.value[0].id
      userAddress.value = savedAddresses.value[0]
    }
  } catch {
    savedAddresses.value = []
  } finally {
    isLoadingSavedAddresses.value = false
  }
}

const onSavedAddressChange = async () => {
  const selected = selectedSavedAddress.value
  userAddress.value = selected
  shippingFee.value = 0
  if (!selected) return
  await applySavedAddressToGhn(selected)
}

const saveNewAddress = async () => {
  const accountId = Number.parseInt(userStore.accountId, 10)
  if (!Number.isFinite(accountId) || accountId <= 0)
    return notify('Không xác định được tài khoản', 'error')
  const provinceName =
    ghnProvinces.value.find((x) => Number(x.provinceId) === Number(shippingInput.value.provinceId))?.provinceName || ''
  const districtName =
    ghnDistricts.value.find((x) => Number(x.districtId) === Number(shippingInput.value.toDistrictId))?.districtName || ''
  const wardName =
    ghnWards.value.find((x) => String(x.wardCode) === String(shippingInput.value.toWardCode))?.wardName || ''
  if (
    !newAddressForm.value.unitNumber ||
    !newAddressForm.value.streetNumber ||
    !newAddressForm.value.addressLine1 ||
    !provinceName ||
    !districtName ||
    !wardName
  )
    return notify('Vui lòng nhập đủ thông tin địa chỉ', 'warning')
  isSavingNewAddress.value = true
  try {
    await addressApi.create(
      {
        unitNumber: newAddressForm.value.unitNumber,
        streetNumber: newAddressForm.value.streetNumber,
        addressLine1: newAddressForm.value.addressLine1,
        addressLine2: wardName,
        city: provinceName,
        region: districtName,
        postalCode: String(newAddressForm.value.postalCode || '').trim() || null,
        accountID: accountId,
      },
      userStore.token,
    )
    await loadSavedAddresses()
    addressMode.value = 'saved'
    await onSavedAddressChange()
    notify('Đã lưu địa chỉ mới')
  } catch (error) {
    notify(error?.response?.data?.message || 'Không thể lưu địa chỉ mới', 'error')
  } finally {
    isSavingNewAddress.value = false
  }
}

// ── Coupons ──
const previewCoupon = async () => {
  const code = String(couponCode.value || '').trim()
  if (!code) { discountAmount.value = 0; return }
  try {
    const res = await getAllDiscountCoupons()
    const coupon = (res.data || []).find(
      (x) => String(x.couponCode || '').toLowerCase() === code.toLowerCase(),
    )
    if (!coupon) throw new Error('Mã giảm giá không tồn tại')
    if (!isCouponValid(coupon)) throw new Error('Mã giảm giá không hợp lệ hoặc đã hết hạn')
    if (!meetsMinOrderValue(coupon)) throw new Error(`Đơn tối thiểu ${formatPrice(coupon.minOrderValue)}đ`)
    discountAmount.value = calculateDiscount(coupon)
    notify('Áp dụng mã giảm giá thành công')
  } catch (error) {
    discountAmount.value = 0
    couponCode.value = ''
    notify(error?.message || 'Mã giảm giá không hợp lệ', 'warning')
  }
}

const loadAvailableCoupons = async () => {
  isLoadingAvailableCoupons.value = true
  try {
    const res = await getAllDiscountCoupons()
    availableCoupons.value = (res.data || []).filter((c) => isCouponValid(c))
  } catch {
    availableCoupons.value = []
  } finally {
    isLoadingAvailableCoupons.value = false
  }
}

const loadUserClaimedCoupons = async () => {
  const accountId = Number.parseInt(userStore.accountId, 10)
  if (!Number.isFinite(accountId) || accountId <= 0) return
  try {
    const res = await userDiscountCouponApi.getClaimedDiscountCoupons(accountId)
    const claimed = (res.data || []).filter((c) => c.status === 'claimed')
    userClaimedCoupons.value = claimed
    const sorted = [...claimed].sort((a, b) => {
      const aVal = Number(a.discountCoupon?.discountValue) || 0
      const bVal = Number(b.discountCoupon?.discountValue) || 0
      const aP = (a.discountCoupon?.discountType || '').toLowerCase() === 'percent'
      const bP = (b.discountCoupon?.discountType || '').toLowerCase() === 'percent'
      if (aP && !bP) return -1
      if (!aP && bP) return 1
      return bVal - aVal
    })
    const best = sorted.find((c) => isCouponValid(c.discountCoupon) && meetsMinOrderValue(c.discountCoupon))
    if (best) {
      selectedCoupon.value = best
      couponCode.value = best.discountCoupon.couponCode
      await previewCoupon()
    }
  } catch {
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
  const code = String(manualCouponCode.value || '').trim()
  if (!code) return notify('Vui lòng nhập mã giảm giá', 'warning')
  isApplyingCoupon.value = true
  try {
    couponCode.value = code
    manualCouponCode.value = ''
    await previewCoupon()
  } finally {
    isApplyingCoupon.value = false
  }
}
const applyAvailableCoupon = async (coupon) => {
  if (!coupon) return
  isApplyingCoupon.value = true
  try {
    couponCode.value = coupon.couponCode
    await previewCoupon()
  } finally {
    isApplyingCoupon.value = false
  }
}

// ── Checkout Items ──
const normalizeCheckoutItem = (item) => ({
  cartItemID: item.cartItemID,
  cartID: item.cartID,
  productColorID: Number.parseInt(item.productColorID ?? item.productID, 10),
  sizeID: Number.parseInt(item.sizeID, 10) || null,
  sizeName: item.sizeName || '',
  quantity: Number.parseInt(item.quantity, 10) || 1,
  productName: item.productName || '',
  price: Number(item.price) || 0,
  colorName: item.colorName || '',
  colorCode: item.colorCode || '',
  mainImage: item.mainImage || '',
  stockQuantity: Number.parseInt(item.stockQuantity, 10) || 0,
})

const loadCheckoutItems = async () => {
  const rawSelectedIds = sessionStorage.getItem(SELECTED_CART_ITEM_IDS_KEY)
  const rawQuickBuy = sessionStorage.getItem(QUICK_BUY_CONTEXT_KEY)
  let selectedIds = []
  try {
    const parsed = JSON.parse(rawSelectedIds)
    if (Array.isArray(parsed)) selectedIds = parsed
  } catch { /* empty */ }
  let quickBuyContext = null
  try {
    const p = JSON.parse(rawQuickBuy)
    if (p?.source === 'buy-now') quickBuyContext = p
  } catch { /* empty */ }
  if ((!selectedIds.length) && !quickBuyContext) { checkoutItems.value = []; return }
  isLoading.value = true
  try {
    let currentCartId = Number.parseInt(userStore.cartId, 10)
    if (!Number.isFinite(currentCartId) || currentCartId <= 0) currentCartId = await userStore.getOrCreateCart()
    const itemRes = await cartApi.getByCart(currentCartId)
    const cartItems = itemRes.data || []
    if (quickBuyContext) {
      const targetId = Number.parseInt(quickBuyContext.cartItemID, 10)
      const targetColorId = Number.parseInt(quickBuyContext.productColorID, 10)
      const buyNowQty = Number.parseInt(quickBuyContext.buyNowQuantity ?? quickBuyContext.quantity, 10) || 1
      const originalQty = Number.parseInt(quickBuyContext.originalQuantity, 10) || 0
      let matched = cartItems.filter((i) => Number.parseInt(i.cartItemID, 10) === targetId)
      if (!matched.length) matched = cartItems.filter((i) => Number.parseInt(i.productColorID ?? i.productID, 10) === targetColorId)
      if (matched.length) {
        const item = [...matched].sort((a, b) => (Number.parseInt(b.cartItemID, 10) || 0) - (Number.parseInt(a.cartItemID, 10) || 0))[0]
        const normalized = normalizeCheckoutItem(item)
        if (originalQty > 0 && normalized.quantity !== buyNowQty) {
          await cartApi.update(normalized.cartItemID, { cartID: normalized.cartID, productColorID: normalized.productColorID, quantity: buyNowQty }, userStore.token)
          normalized.quantity = buyNowQty
        }
        checkoutItems.value = [normalized]
        isQuickBuyMode.value = true
        quickBuyCartItemId.value = normalized.cartItemID
        quickBuyOriginalQuantity.value = originalQty
        quickBuyProductColorId.value = normalized.productColorID
        quickBuyCartId.value = normalized.cartID
        return
      }
    }
    const set = new Set(selectedIds)
    checkoutItems.value = cartItems.filter((i) => set.has(i.cartItemID)).map(normalizeCheckoutItem)
  } catch {
    notify('Không thể tải dữ liệu thanh toán', 'error')
  } finally {
    isLoading.value = false
  }
}

// ── Quick Buy Cleanup ──
const cleanupUnpaidQuickBuyItem = async () => {
  if (isCleaningUpQuickBuy.value || !isQuickBuyMode.value || isQuickBuyOrderPlaced.value) return
  const cartItemId = Number.parseInt(quickBuyCartItemId.value, 10)
  const originalQty = Number.parseInt(quickBuyOriginalQuantity.value, 10) || 0
  const productColorId = Number.parseInt(quickBuyProductColorId.value, 10)
  const cartId = Number.parseInt(quickBuyCartId.value, 10)
  sessionStorage.removeItem(QUICK_BUY_CONTEXT_KEY)
  sessionStorage.removeItem(SELECTED_CART_ITEM_IDS_KEY)
  isQuickBuyMode.value = false
  if (!Number.isFinite(cartItemId) || cartItemId <= 0) return
  isCleaningUpQuickBuy.value = true
  try {
    if (originalQty > 0 && Number.isFinite(productColorId) && productColorId > 0) {
      await cartApi.update(cartItemId, { cartID: Number.isFinite(cartId) && cartId > 0 ? cartId : Number.parseInt(userStore.cartId, 10), productColorID: productColorId, quantity: originalQty }, userStore.token)
    } else {
      await cartApi.remove(cartItemId, userStore.token)
    }
    window.dispatchEvent(new Event('cart-changed'))
  } catch { /* silent */ } finally {
    isCleaningUpQuickBuy.value = false
  }
}

const restoreOriginalCartAfterQuickBuyOrder = async () => {
  const originalQty = Number.parseInt(quickBuyOriginalQuantity.value, 10) || 0
  const productColorId = Number.parseInt(quickBuyProductColorId.value, 10)
  if (originalQty <= 0 || !Number.isFinite(productColorId) || productColorId <= 0) return
  try {
    let currentCartId = Number.parseInt(userStore.cartId, 10)
    if (!Number.isFinite(currentCartId) || currentCartId <= 0) currentCartId = await userStore.getOrCreateCart()
    const itemRes = await cartApi.getByCart(currentCartId)
    const exists = (itemRes.data || []).some((i) => Number.parseInt(i.productColorID ?? i.productID, 10) === productColorId)
    if (!exists) { await userStore.addToCartAPI(productColorId, originalQty); window.dispatchEvent(new Event('cart-changed')) }
  } catch { /* silent */ }
}

// ── Place Order ──
const placeOrder = async () => {
  if (!checkoutItems.value.length || isCheckingOut.value) return
  const accountId = Number.parseInt(userStore.accountId, 10)
  if (!Number.isFinite(accountId) || accountId <= 0) return notify('Không xác định được tài khoản', 'error')
  const invalid = checkoutItems.value.find((i) => {
    const stock = Number.parseInt(i.stockQuantity, 10) || 0
    const qty = Number.parseInt(i.quantity, 10) || 0
    return qty <= 0 || qty > stock
  })
  if (invalid) return notify(`${invalid.productName} không đủ tồn kho`, 'warning')
  const finalCoupon = String(couponCode.value || '').trim()
  if (finalCoupon) {
    const res = await getAllDiscountCoupons().catch(() => ({ data: [] }))
    const coupon = (res.data || []).find((x) => String(x.couponCode || '').toLowerCase() === finalCoupon.toLowerCase())
    if (!coupon) return notify('Mã giảm giá không còn tồn tại', 'warning')
    if (!isCouponValid(coupon)) return notify('Mã giảm giá không hợp lệ hoặc đã hết hạn', 'warning')
    if (!meetsMinOrderValue(coupon)) return notify(`Đơn tối thiểu ${formatPrice(coupon.minOrderValue)}đ`, 'warning')
  }
  const cartItemIds = checkoutItems.value.map((x) => x.cartItemID)
  const isBankTransfer = selectedPaymentMethod.value === 'BANK_TRANSFER'
  isCheckingOut.value = true
  try {
    const res = await paymentApi.checkoutSelected(accountId, selectedPaymentMethod.value, cartItemIds, userStore.token, finalCoupon, shippingFee.value)
    const orderId = res.data?.id || res.data?.orderID || res.data?.orderId || res.data?.data?.id || res.data?.data?.orderId
    if (isQuickBuyMode.value) {
      isQuickBuyOrderPlaced.value = true
      await restoreOriginalCartAfterQuickBuyOrder()
    }
    sessionStorage.removeItem(SELECTED_CART_ITEM_IDS_KEY)
    sessionStorage.removeItem(QUICK_BUY_CONTEXT_KEY)
    window.dispatchEvent(new Event('cart-changed'))
    if (isBankTransfer) {
      if (!orderId) return notify('Đặt đơn thành công nhưng chưa đọc được mã đơn để tạo QR', 'warning')
      try {
        const mbRes = await paymentApi.getMBBankInfo(orderId, userStore.token)
        mbBankPaymentInfo.value = mbRes.data || null
        pendingOnlineOrderId.value = orderId
        showMBBankDialog.value = true
        return
      } catch {
        notify(`Đơn #${orderId} đã tạo nhưng chưa tải được QR. Liên hệ admin.`, 'warning')
        return
      }
    }
    notify(`Đặt hàng thành công. Mã đơn #${orderId || ''}`.trim())
    setTimeout(() => router.push({ name: 'PurchaseHistory' }), 600)
  } catch (error) {
    notify(error?.response?.data?.message || 'Thanh toán thất bại. Vui lòng thử lại', 'error')
  } finally {
    isCheckingOut.value = false
  }
}

// ── Dialog Actions ──
const goToPurchaseHistory = () => { showMBBankDialog.value = false; router.push({ name: 'PurchaseHistory' }) }

const closeOnlinePaymentDialog = async () => {
  const accountId = Number.parseInt(userStore.accountId, 10)
  if (!pendingOnlineOrderId.value || !Number.isFinite(accountId) || accountId <= 0) { showMBBankDialog.value = false; return }
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
    notify(error?.response?.data?.message || 'Không thể đóng thanh toán online lúc này', 'error')
  } finally {
    isClosingOnlineDialog.value = false
  }
}

const confirmOnlineTransfer = async () => {
  if (!pendingOnlineOrderId.value || isConfirmingTransfer.value) { goToPurchaseHistory(); return }
  isConfirmingTransfer.value = true
  try {
    markOnlineOrderConfirmed(pendingOnlineOrderId.value)
    notify(`Đơn #${pendingOnlineOrderId.value} đang chờ admin xác nhận`)
    pendingOnlineOrderId.value = null
    mbBankPaymentInfo.value = null
    goToPurchaseHistory()
  } catch (error) {
    notify(error?.response?.data?.message || 'Chưa thể xác nhận chuyển khoản, vui lòng thử lại', 'error')
  } finally {
    isConfirmingTransfer.value = false
  }
}

const copyToClipboard = async (value, label) => {
  try {
    await navigator.clipboard.writeText(String(value || ''))
    notify(`${label} đã được sao chép`)
  } catch {
    notify(`Không thể sao chép ${label.toLowerCase()}`, 'warning')
  }
}

// ── Local Storage Helpers ──
const getIds = (key) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(parsed) ? parsed.map((x) => Number.parseInt(x, 10)).filter(Number.isFinite) : []
  } catch { return [] }
}
const saveIds = (key, ids) => localStorage.setItem(key, JSON.stringify(ids))
const markOnlineOrderConfirmed = (id) => {
  const n = Number.parseInt(id, 10)
  if (!Number.isFinite(n)) return
  const ids = getIds(ONLINE_CONFIRMED_ORDERS_KEY)
  if (!ids.includes(n)) saveIds(ONLINE_CONFIRMED_ORDERS_KEY, [...ids, n])
}
const removeOnlineConfirmedOrderId = (id) => {
  const n = Number.parseInt(id, 10)
  if (!Number.isFinite(n)) return
  saveIds(ONLINE_CONFIRMED_ORDERS_KEY, getIds(ONLINE_CONFIRMED_ORDERS_KEY).filter((x) => x !== n))
}
const markCancelledOnlineOrderHidden = (id) => {
  const n = Number.parseInt(id, 10)
  if (!Number.isFinite(n)) return
  const ids = getIds(HIDDEN_CANCELLED_ONLINE_ORDERS_KEY)
  if (!ids.includes(n)) saveIds(HIDDEN_CANCELLED_ONLINE_ORDERS_KEY, [...ids, n])
}

const goBackCart = async () => { await cleanupUnpaidQuickBuyItem(); router.push({ name: 'Cart' }) }

onMounted(async () => {
  await Promise.all([loadCheckoutItems(), loadUserClaimedCoupons(), loadAvailableCoupons(), loadGhnProvinces(), loadSavedAddresses()])
  await onSavedAddressChange()
})
onBeforeUnmount(() => cleanupUnpaidQuickBuyItem())
</script>

<style scoped>
/* ── Base ── */
.checkout-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
  font-family: inherit;
}

/* ── Header ── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 2.5rem;
}
.page-eyebrow {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(0,0,0,0.35);
  font-weight: 500;
  margin-bottom: 4px;
}
.page-title {
  font-size: 26px;
  font-weight: 500;
  letter-spacing: -0.02em;
}
.header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}
.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(0,0,0,0.6);
  background: #fff;
  border: 0.5px solid rgba(0,0,0,0.15);
  border-radius: 6px;
  padding: 7px 14px;
  cursor: pointer;
  transition: border-color 0.15s;
}
.btn-back:hover { border-color: rgba(0,0,0,0.3); }

/* ── Steps ── */
.checkout-steps {
  display: flex;
  align-items: center;
  gap: 0;
}
.step {
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(0,0,0,0.3);
}
.step.done, .step.active { color: rgba(0,0,0,0.7); }
.step.active { font-weight: 500; color: #000; }
.step-sep {
  display: inline-block;
  width: 20px;
  height: 0.5px;
  background: rgba(0,0,0,0.15);
  margin: 0 8px;
}
@media (max-width: 580px) { .checkout-steps { display: none; } }

/* ── Loading / Empty ── */
.loading-state { display: flex; justify-content: center; padding: 5rem 0; }
.empty-state { text-align: center; padding: 3rem; }
.empty-title { font-size: 16px; font-weight: 500; margin-bottom: 16px; }

/* ── Layout ── */
.checkout-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1.5rem;
  align-items: start;
}
@media (max-width: 860px) {
  .checkout-layout { grid-template-columns: 1fr; }
  .checkout-right { order: -1; }
}

/* ── Section Card ── */
.section-card {
  background: #fff;
  border: 0.5px solid rgba(0,0,0,0.1);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 0.5px solid rgba(0,0,0,0.08);
}
.section-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #000;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.section-title { font-size: 14px; font-weight: 500; }
.section-body { padding: 18px; }

/* ── Mode Toggle ── */
.mode-toggle {
  display: flex;
  border: 0.5px solid rgba(0,0,0,0.15);
  border-radius: 7px;
  overflow: hidden;
  margin-bottom: 16px;
}
.toggle-btn {
  flex: 1;
  padding: 8px 12px;
  font-size: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: rgba(0,0,0,0.5);
  transition: all 0.15s;
}
.toggle-btn.active { background: #000; color: #fff; font-weight: 500; }

/* ── Fields ── */
.field-grid { display: grid; gap: 10px; margin-bottom: 10px; }
.field-grid.two { grid-template-columns: 1fr 1fr; }
.field-grid.three { grid-template-columns: 1fr 1fr 1fr; }
@media (max-width: 560px) {
  .field-grid.two, .field-grid.three { grid-template-columns: 1fr; }
}
.field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }
.field:last-child { margin-bottom: 0; }
.field-label {
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(0,0,0,0.4);
  font-weight: 500;
}
.field-input,
.field-select {
  padding: 9px 11px;
  border: 0.5px solid rgba(0,0,0,0.2);
  border-radius: 7px;
  font-size: 13px;
  background: #fff;
  color: #000;
  outline: none;
  transition: border-color 0.15s;
  appearance: none;
  font-family: inherit;
}
.field-input:focus, .field-select:focus { border-color: #000; }
.field-select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23999'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 28px;
}

/* ── Address Preview ── */
.address-preview {
  margin-top: 12px;
  padding: 10px 12px;
  background: rgba(0,0,0,0.03);
  border-left: 2px solid rgba(0,0,0,0.12);
  border-radius: 0 6px 6px 0;
  font-size: 13px;
  color: rgba(0,0,0,0.6);
  line-height: 1.5;
}

/* ── Save Address Btn ── */
.btn-save-address {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 9px 16px;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-save-address:hover:not(:disabled) { opacity: 0.8; }
.btn-save-address:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Payment Options ── */
.pay-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 0.5px solid rgba(0,0,0,0.12);
  border-radius: 9px;
  cursor: pointer;
  margin-bottom: 8px;
  transition: border-color 0.15s;
}
.pay-option:hover { border-color: rgba(0,0,0,0.25); }
.pay-option.selected { border-color: #000; border-width: 1px; }
.radio-circle {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color 0.15s;
}
.radio-circle.on { border-color: #000; }
.radio-dot { width: 9px; height: 9px; border-radius: 50%; background: #000; }
.pay-info { flex: 1; }
.pay-name { font-size: 13px; font-weight: 500; }
.pay-desc { font-size: 11px; color: rgba(0,0,0,0.45); margin-top: 2px; }

/* ── Coupon Section ── */
.coupon-applied {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0,0,0,0.15);
  border-radius: 8px;
  margin-bottom: 16px;
}
.coupon-applied-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.coupon-code-text { font-weight: 500; }
.coupon-save { font-size: 12px; color: rgba(0,0,0,0.5); }
.coupon-remove {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  transition: color 0.15s;
}
.coupon-remove:hover { color: #000; }
.coupon-section-label {
  font-size: 11px;
  font-weight: 500;
  color: rgba(0,0,0,0.5);
  letter-spacing: 0.04em;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

/* ── Coupon Grid ── */
.coupon-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}
.coupon-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 0.5px solid rgba(0,0,0,0.12);
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.15s;
}
.coupon-card:hover { border-color: rgba(0,0,0,0.3); }
.coupon-card.selected { border-color: #000; border-width: 1px; background: rgba(0,0,0,0.02); }
.coupon-badge {
  width: 54px;
  height: 54px;
  border-radius: 8px;
  background: #000;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 500;
  flex-shrink: 0;
  text-align: center;
  line-height: 1.2;
}
.coupon-info { flex: 1; min-width: 0; }
.coupon-code-label { font-size: 13px; font-weight: 500; }
.coupon-desc { font-size: 11px; color: rgba(0,0,0,0.5); margin-top: 2px; }
.coupon-min { font-size: 11px; color: rgba(0,0,0,0.35); margin-top: 1px; }
.coupon-check { flex-shrink: 0; opacity: 0.5; }
.coupon-card.selected .coupon-check { opacity: 1; }

.btn-apply-coupon {
  width: 100%;
  padding: 9px;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
  margin-bottom: 4px;
}
.btn-apply-coupon:hover:not(:disabled) { opacity: 0.8; }
.btn-apply-coupon:disabled { opacity: 0.4; cursor: not-allowed; }

.coupon-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.coupon-input {
  flex: 1;
  padding: 9px 11px;
  border: 0.5px solid rgba(0,0,0,0.2);
  border-radius: 7px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
  background: #fff;
  color: #000;
}
.coupon-input:focus { border-color: #000; }
.btn-coupon-apply {
  padding: 9px 16px;
  background: #fff;
  border: 0.5px solid rgba(0,0,0,0.2);
  border-radius: 7px;
  font-size: 12px;
  cursor: pointer;
  color: #000;
  white-space: nowrap;
  transition: background 0.15s;
  font-family: inherit;
}
.btn-coupon-apply:hover:not(:disabled) { background: rgba(0,0,0,0.05); }
.btn-coupon-apply:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Right: Summary ── */
.checkout-right { position: sticky; top: 1.5rem; }
.summary-card {
  background: #fff;
  border: 0.5px solid rgba(0,0,0,0.1);
  border-radius: 12px;
  padding: 22px;
}
.summary-eyebrow {
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(0,0,0,0.35);
  font-weight: 500;
  margin-bottom: 4px;
}
.summary-heading { font-size: 15px; font-weight: 500; margin-bottom: 16px; }

/* ── Order Items ── */
.order-items { margin-bottom: 4px; }
.order-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 0.5px solid rgba(0,0,0,0.07);
}
.order-item:last-child { border-bottom: none; }
.order-item-info { flex: 1; min-width: 0; }
.order-item-name { font-size: 12px; font-weight: 500; line-height: 1.4; margin-bottom: 2px; }
.order-item-meta { font-size: 11px; color: rgba(0,0,0,0.45); }
.order-item-price { text-align: right; flex-shrink: 0; }
.order-item-amount { font-size: 13px; font-weight: 500; }
.order-item-qty { font-size: 11px; color: rgba(0,0,0,0.4); margin-top: 2px; }

.summary-divider { border: none; border-top: 0.5px solid rgba(0,0,0,0.08); margin: 14px 0; }

.summary-rows { display: flex; flex-direction: column; gap: 2px; }
.sum-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(0,0,0,0.5);
  padding: 5px 0;
}
.sum-row.discount { color: #2d7a3a; }

.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  font-size: 13px;
  font-weight: 500;
}
.total-amount { font-size: 22px; font-weight: 500; letter-spacing: -0.02em; }

.btn-checkout {
  width: 100%;
  padding: 13px;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s;
  margin-bottom: 4px;
}
.btn-checkout:hover:not(:disabled) { opacity: 0.8; }
.btn-checkout:disabled { opacity: 0.35; cursor: not-allowed; }

.security-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 11px;
  color: rgba(0,0,0,0.35);
  margin-top: 12px;
}

/* ── Buttons (shared) ── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-primary:hover { opacity: 0.8; }
.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  background: transparent;
  color: #000;
  border: 0.5px solid rgba(0,0,0,0.25);
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-outline:hover { background: rgba(0,0,0,0.04); }

/* ── Dialog ── */
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
}
.dialog-body { padding: 20px 24px; }
.dialog-loading { display: flex; justify-content: center; padding: 48px; }
.dialog-actions { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; }

/* ── QR Layout ── */
.qr-layout { display: grid; grid-template-columns: 240px 1fr; gap: 24px; align-items: start; }
@media (max-width: 580px) { .qr-layout { grid-template-columns: 1fr; } }
.qr-box {
  border: 0.5px solid rgba(0,0,0,0.1);
  border-radius: 10px;
  padding: 12px;
  background: #fff;
}
.qr-info { display: flex; flex-direction: column; gap: 14px; }
.info-row { display: flex; flex-direction: column; gap: 3px; }
.info-label { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(0,0,0,0.35); }
.info-value { font-size: 13px; }
.copy-btn {
  background: none;
  border: 0.5px solid rgba(0,0,0,0.15);
  border-radius: 5px;
  padding: 3px 7px;
  cursor: pointer;
  color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  transition: all 0.15s;
}
.copy-btn:hover { border-color: rgba(0,0,0,0.35); color: #000; }
</style>