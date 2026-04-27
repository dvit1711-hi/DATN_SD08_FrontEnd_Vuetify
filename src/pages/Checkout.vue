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
              <div class="text-subtitle-1 font-weight-bold text-black">
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
            <div class="d-flex justify-space-between mb-4">
              <span class="text-body-2 text-black">Phí vận chuyển</span>
              <span class="font-weight-medium">{{ formatPrice(shippingFee) }}đ</span>
            </div>
            <v-divider class="mb-4" />
            <div class="d-flex justify-space-between align-center mb-4">
              <span class="text-subtitle-1 font-weight-bold">Tổng cộng</span>
              <span class="text-h6 font-weight-bold">{{ formatPrice(finalTotal) }}đ</span>
            </div>

            <v-card class="mb-4" variant="outlined">
              <v-card-title class="text-subtitle-2 font-weight-bold d-flex align-center ga-2">
                <v-icon icon="mdi-map-marker-path" />
                Địa chỉ nhận hàng
              </v-card-title>
              <v-divider />
              <v-card-text class="pt-4">
                <v-radio-group
                  v-model="addressMode"
                  inline
                  density="comfortable"
                  hide-details
                  class="mb-3"
                >
                  <v-radio label="Địa chỉ đã lưu" value="saved" />
                  <v-radio label="Thêm địa chỉ mới" value="new" />
                </v-radio-group>

                <template v-if="addressMode === 'saved'">
                  <v-select
                    v-model="selectedAddressId"
                    :items="savedAddressOptions"
                    item-title="label"
                    item-value="id"
                    label="Chọn địa chỉ đã lưu"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    :loading="isLoadingSavedAddresses"
                    :disabled="isLoadingSavedAddresses || savedAddressOptions.length === 0"
                    @update:model-value="onSavedAddressChange"
                  />
                  <div class="text-caption text-grey mt-2">{{ selectedSavedAddressLabel }}</div>
                </template>

                <template v-else>
                  <v-row dense>
                    <v-col cols="12" sm="4">
                      <v-text-field
                        v-model="newAddressForm.unitNumber"
                        label="Số nhà"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                      />
                    </v-col>
                    <v-col cols="12" sm="4">
                      <v-text-field
                        v-model="newAddressForm.streetNumber"
                        label="Số đường"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                      />
                    </v-col>
                    <v-col cols="12" sm="4">
                      <v-text-field
                        v-model="newAddressForm.addressLine1"
                        label="Tên đường"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        v-model="newAddressForm.postalCode"
                        label="Mã bưu chính (không bắt buộc)"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                      />
                    </v-col>
                  </v-row>
                </template>

                <v-divider class="my-4" />
                <v-row dense>
                  <v-col cols="12">
                    <v-select
                      v-model="shippingInput.provinceId"
                      :items="ghnProvinces"
                      item-title="provinceName"
                      item-value="provinceId"
                      label="Tỉnh/Thành phố"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      :loading="isLoadingProvinces"
                      @update:model-value="onProvinceChange"
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-select
                      v-model="shippingInput.toDistrictId"
                      :items="ghnDistricts"
                      item-title="districtName"
                      item-value="districtId"
                      label="Quận/Huyện"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      :loading="isLoadingDistricts"
                      :disabled="!shippingInput.provinceId"
                      @update:model-value="onDistrictChange"
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-select
                      v-model="shippingInput.toWardCode"
                      :items="ghnWards"
                      item-title="wardName"
                      item-value="wardCode"
                      label="Phường/Xã"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      :loading="isLoadingWards"
                      :disabled="!shippingInput.toDistrictId"
                    />
                  </v-col>
                </v-row>

                <v-btn
                  v-if="addressMode === 'new'"
                  class="mt-4"
                  color="primary"
                  block
                  :loading="isSavingNewAddress"
                  :disabled="isSavingNewAddress"
                  @click="saveNewAddress"
                >
                  Lưu địa chỉ mới và sử dụng
                </v-btn>
              </v-card-text>
            </v-card>

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

                <div class="d-flex gap-2">
                  <v-btn
                    v-if="selectedCoupon"
                    flex-grow-1
                    color="primary"
                    size="small"
                    :loading="isApplyingCoupon"
                    @click="applySelectedCoupon"
                  >
                    Áp dụng: {{ selectedCoupon.discountCoupon.couponCode }}
                  </v-btn>
                  <v-btn
                    flex-grow-1
                    variant="outlined"
                    size="small"
                    @click="() => { selectedCoupon = null; couponCode = ''; discountAmount = 0 }"
                  >
                    Không dùng mã
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>

            <!-- Manual coupon input -->
            <v-card class="mb-4" variant="outlined">
              <v-card-title class="text-subtitle-2 font-weight-bold">Mã Giảm Giá Khác</v-card-title>
              <v-divider />
              <v-card-text>
                <div class="d-flex gap-2">
                  <v-text-field
                    v-model="manualCouponCode"
                    label="Nhập mã giảm giá (tùy chọn)"
                    variant="outlined"
                    density="comfortable"
                    clearable
                    hint="Để trống nếu không có mã"
                  />
                  <v-btn
                    color="primary"
                    :disabled="!manualCouponCode || isApplyingCoupon"
                    :loading="isApplyingCoupon"
                    class="mt-1"
                    @click="applyManualCoupon"
                  >
                    Áp dụng
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>

            <!-- All available discount coupons as combobox -->
            <v-card class="mb-4" variant="outlined">
              <v-card-title class="text-subtitle-2 font-weight-bold d-flex align-center ga-2">
                <v-icon>mdi-tag-multiple</v-icon>
                Tất cả mã giảm giá có sẵn ({{ availableCoupons.length }})
              </v-card-title>
              <v-divider />
              <v-card-text>
                <div v-if="availableCoupons.length === 0" class="text-center py-4">
                  <p class="text-body-2 text-grey">{{ isLoadingAvailableCoupons ? 'Đang tải...' : 'Hiện không có mã giảm giá nào khả dụng' }}</p>
                </div>

                <v-select
                  v-else
                  v-model="selectedAvailableCoupon"
                  :items="couponsDisplay"
                  item-title="displayText"
                  return-object
                  label="Chọn mã giảm giá"
                  variant="outlined"
                  density="comfortable"
                  clearable
                  :loading="isLoadingAvailableCoupons"
                  @update:model-value="(coupon) => {
                    if (coupon) {
                      applyAvailableCoupon(coupon)
                    }
                  }"
                />
              </v-card-text>
            </v-card>

            <!-- Current discount status -->
            <v-card v-if="discountAmount > 0" class="mb-4" variant="outlined" color="success">
              <v-card-text class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-subtitle-2 font-weight-bold">Mã giảm giá đã áp dụng</div>
                  <div class="text-body-2 text-grey">{{ couponCode }}</div>
                </div>
                <div class="text-h6 font-weight-bold text-success">-{{ formatPrice(discountAmount) }}đ</div>
              </v-card-text>
            </v-card>

            <v-alert v-if="discountAmount === 0" class="mb-4" color="info" title="Thông báo">
              Bạn đang đặt hàng không sử dụng mã giảm giá. Có thể áp dụng mã khác ở trên nếu có.
            </v-alert>

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
          Thanh toán ngân hàng
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
                  <v-list-item-subtitle class="text-body-1 font-weight-bold text-black">{{ formatPrice(mbBankPaymentInfo.amount) }}đ</v-list-item-subtitle>
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
import { computed, onMounted, ref, watch } from 'vue'
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
const newAddressForm = ref({
  unitNumber: '',
  streetNumber: '',
  addressLine1: '',
  postalCode: '',
})
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
const selectedAvailableCoupon = ref(null)
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
  { label: 'Thanh toán khi nhận hàng (COD)', value: 'COD', description: 'Admin sẽ xác nhận thanh toán sau khi giao hàng.' },
  { label: 'Thanh toán ngân hàng (QR)', value: 'BANK_TRANSFER', description: 'Hệ thống tạo mã QR chuyển khoản theo đơn hàng để bạn thanh toán nhanh.' },
]
const selectedPaymentMethod = ref('COD')

const selectedPaymentMethodDescription = computed(() => {
  return paymentMethods.find((m) => m.value === selectedPaymentMethod.value)?.description || ''
})
const savedAddressOptions = computed(() => savedAddresses.value.map((address) => ({
  ...address,
  label: formatAddress(address),
})))
const selectedSavedAddress = computed(() => savedAddresses.value.find((address) => Number(address.id) === Number(selectedAddressId.value)) || null)
const selectedSavedAddressLabel = computed(() => formatAddress(selectedSavedAddress.value) || 'Chưa chọn địa chỉ')
const totalQuantity = computed(() => checkoutItems.value.reduce((sum, item) => sum + item.quantity, 0))
const totalPrice = computed(() => checkoutItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0))
const finalTotal = computed(() => Math.max(0, totalPrice.value - discountAmount.value) + Math.max(0, Number(shippingFee.value) || 0))
const couponsDisplay = computed(() => {
  return availableCoupons.value.map(coupon => {
    let displayText = coupon.couponCode
    if (coupon.discountType === 'percent') {
      displayText += ` - Giảm ${coupon.discountValue}%`
    } else {
      displayText += ` - Giảm ${formatPrice(coupon.discountValue)} đ`
    }
    return { ...coupon, displayText }
  })
})

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price || 0)

const todayText = () => new Date().toISOString().slice(0, 10)

// Check if coupon is valid and applicable
const isCouponValid = (coupon) => {
  if (!coupon) return false
  
  if (coupon.active === false) return false
  
  const now = todayText()
  if (coupon.startDate && coupon.startDate > now) return false
  if (coupon.endDate && coupon.endDate < now) return false
  
  const quantity = Number.parseInt(coupon.quantity, 10) || 0
  if (quantity <= 0) return false
  
  const value = Number(coupon.discountValue) || 0
  if (value <= 0) return false
  
  return true
}

// Check if coupon meets minimum order value requirement
const meetsMinOrderValue = (coupon) => {
  const minOrderValue = Number(coupon.minOrderValue) || 0
  return totalPrice.value >= minOrderValue
}

// Calculate discount amount for a valid coupon
const calculateDiscount = (coupon) => {
  const value = Number(coupon.discountValue) || 0
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
  }
  
  return Math.min(Math.max(discount, 0), totalPrice.value)
}

// Find alternative coupon when current one fails
const findAlternativeCoupon = async () => {
  try {
    const res = await getAllDiscountCoupons()
    const coupons = res.data || []
    
    // Filter valid coupons sorted by discount percentage (highest first)
    const validCoupons = coupons
      .filter(c => isCouponValid(c))
      .sort((a, b) => {
        const aDiscount = Number(a.discountValue) || 0
        const bDiscount = Number(b.discountValue) || 0
        const aIsPercent = (a.discountType || '').toLowerCase() === 'percent'
        const bIsPercent = (b.discountType || '').toLowerCase() === 'percent'
        
        // Prefer percent discounts, then sort by value
        if (aIsPercent && !bIsPercent) return -1
        if (!aIsPercent && bIsPercent) return 1
        return bDiscount - aDiscount
      })
    
    // Find first coupon that meets minimum order value
    for (const coupon of validCoupons) {
      if (meetsMinOrderValue(coupon)) {
        return coupon
      }
    }
    
    return null
  } catch (error) {
    console.error('Lỗi tìm mã giảm giá thay thế:', error)
    return null
  }
}

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

    if (!isCouponValid(coupon)) {
      throw new Error('Mã giảm giá không hợp lệ hoặc đã hết hạn')
    }

    // Check if meets minimum order value
    if (!meetsMinOrderValue(coupon)) {
      // Try to find alternative coupon
      const alternativeCoupon = await findAlternativeCoupon()
      
      if (alternativeCoupon) {
        couponCode.value = alternativeCoupon.couponCode
        discountAmount.value = calculateDiscount(alternativeCoupon)
        snackbarMessage.value = `Mã "${code}" không đủ điều kiện. Tự động sử dụng mã "${alternativeCoupon.couponCode}" thay thế`
        snackbarColor.value = 'info'
        showSnackbar.value = true
        return
      } else {
        // No alternative found, clear discount and show info
        discountAmount.value = 0
        couponCode.value = ''
        snackbarMessage.value = `Mã "${code}" không đủ giá trị tối thiểu (${formatPrice(coupon.minOrderValue)}đ). Không tìm thấy mã thay thế phù hợp.`
        snackbarColor.value = 'info'
        showSnackbar.value = true
        return
      }
    }

    const value = Number(coupon.discountValue) || 0
    if (value <= 0) {
      throw new Error('Giá trị giảm giá không hợp lệ')
    }

    discountAmount.value = calculateDiscount(coupon)
    snackbarMessage.value = 'Áp dụng mã giảm giá thành công'
    snackbarColor.value = 'success'
    showSnackbar.value = true
  } catch (error) {
    discountAmount.value = 0
    couponCode.value = ''
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
    address.region,
    address.city,
  ]
    .map((x) => (x == null ? '' : String(x).trim()))
    .filter((x) => x.length > 0)

  return parts.length > 0 ? parts.join(', ') : 'Bạn chưa cập nhật địa chỉ nhận hàng'
}

const normalizeText = (value) => String(value || '').trim().toLowerCase()

const findProvinceByName = (provinceName) => ghnProvinces.value.find((item) => normalizeText(item.provinceName) === normalizeText(provinceName)) || null

const findDistrictByName = (districtName) => ghnDistricts.value.find((item) => normalizeText(item.districtName) === normalizeText(districtName)) || null

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

  const ward = ghnWards.value.find((item) => normalizeText(item.wardName) === normalizeText(address.addressLine2)) || null
  if (ward) {
    shippingInput.value.toWardCode = ward.wardCode
  }
}

const loadAvailableCoupons = async () => {
  isLoadingAvailableCoupons.value = true
  try {
    const res = await getAllDiscountCoupons()
    const coupons = res.data || []
    // Filter only valid, active coupons
    availableCoupons.value = coupons.filter(coupon => isCouponValid(coupon))
  } catch (error) {
    console.error('Lỗi tải danh sách mã giảm giá có sẵn:', error)
    availableCoupons.value = []
  } finally {
    isLoadingAvailableCoupons.value = false
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
    
    // Auto-select coupon with highest discount percentage and try to apply it
    if (claimed.length > 0) {
      // Sort by discount percentage (percent coupons first, then by value)
      const sorted = [...claimed].sort((a, b) => {
        const aValue = Number(a.discountCoupon?.discountValue) || 0
        const bValue = Number(b.discountCoupon?.discountValue) || 0
        const aIsPercent = (a.discountCoupon?.discountType || '').toLowerCase() === 'percent'
        const bIsPercent = (b.discountCoupon?.discountType || '').toLowerCase() === 'percent'
        
        if (aIsPercent && !bIsPercent) return -1
        if (!aIsPercent && bIsPercent) return 1
        return bValue - aValue
      })
      
      // Try to apply coupons in order, use first one that meets conditions
      let appliedCoupon = null
      for (const coupon of sorted) {
        const dc = coupon.discountCoupon
        if (isCouponValid(dc) && meetsMinOrderValue(dc)) {
          appliedCoupon = coupon
          break
        }
      }
      
      if (appliedCoupon) {
        selectedCoupon.value = appliedCoupon
        couponCode.value = appliedCoupon.discountCoupon.couponCode
        await previewCoupon()
      } else {
        // No applies coupon that meets conditions, select first but don't apply
        selectedCoupon.value = sorted[0]
        discountAmount.value = 0
        couponCode.value = ''
      }
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
  const code = String(manualCouponCode.value || '').trim()
  if (!code) {
    snackbarMessage.value = 'Vui lòng nhập mã giảm giá'
    snackbarColor.value = 'warning'
    showSnackbar.value = true
    return
  }
  
  isApplyingCoupon.value = true
  try {
    couponCode.value = code
    // Clear manual input after attempt
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
    manualCouponCode.value = ''
    await previewCoupon()
  } finally {
    isApplyingCoupon.value = false
  }
}

const normalizeCheckoutItem = (item) => {
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
}

const loadCheckoutItems = async () => {
  const rawSelectedIds = sessionStorage.getItem(SELECTED_CART_ITEM_IDS_KEY)
  const rawQuickBuyContext = sessionStorage.getItem(QUICK_BUY_CONTEXT_KEY)

  let selectedIds = []
  if (rawSelectedIds) {
    try {
      const parsed = JSON.parse(rawSelectedIds)
      if (Array.isArray(parsed)) {
        selectedIds = parsed
      }
    } catch {
      selectedIds = []
    }
  }

  let quickBuyContext = null
  if (rawQuickBuyContext) {
    try {
      quickBuyContext = JSON.parse(rawQuickBuyContext)
    } catch {
      quickBuyContext = null
    }
  }

  if ((!Array.isArray(selectedIds) || selectedIds.length === 0) && !quickBuyContext) {
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

    const cartItems = itemRes.data || []

    if (quickBuyContext) {
      const targetProductColorId = Number.parseInt(quickBuyContext.productColorID, 10)
      const matchedByColor = cartItems.filter((item) => {
        const colorId = Number.parseInt(item.productColorID ?? item.productID, 10)
        return Number.isFinite(targetProductColorId) && colorId === targetProductColorId
      })

      if (matchedByColor.length > 0) {
        const latestMatchedItem = [...matchedByColor].sort((a, b) => {
          const bId = Number.parseInt(b.cartItemID ?? b.id, 10) || 0
          const aId = Number.parseInt(a.cartItemID ?? a.id, 10) || 0
          return bId - aId
        })[0]

        const normalized = normalizeCheckoutItem(latestMatchedItem)
        checkoutItems.value = [normalized]
        sessionStorage.setItem(SELECTED_CART_ITEM_IDS_KEY, JSON.stringify([normalized.cartItemID]))
        return
      }

      sessionStorage.removeItem(QUICK_BUY_CONTEXT_KEY)
    }

    const selectedSet = new Set(selectedIds)
    checkoutItems.value = cartItems
      .filter((item) => selectedSet.has(item.cartItemID))
      .map((item) => normalizeCheckoutItem(item))
  } catch (error) {
    console.error('Lỗi tải dữ liệu checkout:', error)
    snackbarMessage.value = 'Không thể tải dữ liệu thanh toán'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  } finally {
    isLoading.value = false
  }
}

const loadSavedAddresses = async () => {
  const accountId = Number.parseInt(userStore.accountId, 10)
  if (!Number.isFinite(accountId) || accountId <= 0) {
    savedAddresses.value = []
    selectedAddressId.value = null
    userAddress.value = null
    return
  }

  isLoadingSavedAddresses.value = true
  try {
    const res = await addressApi.getByAccountId(accountId, userStore.token)
    savedAddresses.value = Array.isArray(res.data) ? res.data : []

    if (savedAddresses.value.length > 0) {
      selectedAddressId.value = savedAddresses.value[0].id
      userAddress.value = savedAddresses.value[0]
    } else {
      selectedAddressId.value = null
      userAddress.value = null
    }
  } catch (error) {
    console.error('Lỗi tải danh sách địa chỉ đã lưu:', error)
    savedAddresses.value = []
    selectedAddressId.value = null
    userAddress.value = null
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
  if (!Number.isFinite(accountId) || accountId <= 0) {
    snackbarMessage.value = 'Không xác định được tài khoản để lưu địa chỉ'
    snackbarColor.value = 'error'
    showSnackbar.value = true
    return
  }

  const provinceName = ghnProvinces.value.find((x) => Number(x.provinceId) === Number(shippingInput.value.provinceId))?.provinceName || ''
  const districtName = ghnDistricts.value.find((x) => Number(x.districtId) === Number(shippingInput.value.toDistrictId))?.districtName || ''
  const wardName = ghnWards.value.find((x) => String(x.wardCode) === String(shippingInput.value.toWardCode))?.wardName || ''

  if (!newAddressForm.value.unitNumber || !newAddressForm.value.streetNumber || !newAddressForm.value.addressLine1 || !provinceName || !districtName || !wardName) {
    snackbarMessage.value = 'Vui lòng nhập đủ số nhà, số đường, tên đường và chọn đầy đủ tỉnh/huyện/xã'
    snackbarColor.value = 'warning'
    showSnackbar.value = true
    return
  }

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
    snackbarMessage.value = 'Đã lưu địa chỉ mới'
    snackbarColor.value = 'success'
    showSnackbar.value = true
  } catch (error) {
    console.error('Lỗi lưu địa chỉ mới:', error)
    snackbarMessage.value = error?.response?.data?.message || 'Không thể lưu địa chỉ mới'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  } finally {
    isSavingNewAddress.value = false
  }
}

watch(
  () => [shippingInput.value.toDistrictId, shippingInput.value.toWardCode],
  async ([districtId, wardCode]) => {
    if (!districtId || !wardCode || isCalculatingShipping.value) return
    await calculateGhnShippingFee(true)
  },
)

watch(
  () => addressMode.value,
  (mode) => {
    if (mode === 'saved') {
      newAddressForm.value = {
        unitNumber: '',
        streetNumber: '',
        addressLine1: '',
        postalCode: '',
      }
    }
  },
)


const loadGhnProvinces = async () => {
  isLoadingProvinces.value = true
  try {
    const res = await paymentApi.getGhnProvinces(userStore.token)
    ghnProvinces.value = Array.isArray(res.data) ? res.data : []
  } catch (error) {
    console.error('Lỗi tải danh sách tỉnh GHN:', error)
    ghnProvinces.value = []
    snackbarMessage.value = 'Không thể tải danh sách tỉnh/thành GHN'
    snackbarColor.value = 'warning'
    showSnackbar.value = true
  } finally {
    isLoadingProvinces.value = false
  }
}

const onProvinceChange = async () => {
  shippingInput.value.toDistrictId = ''
  shippingInput.value.toWardCode = ''
  ghnDistricts.value = []
  ghnWards.value = []

  const provinceId = Number.parseInt(shippingInput.value.provinceId, 10)
  if (!Number.isFinite(provinceId) || provinceId <= 0) {
    return
  }

  isLoadingDistricts.value = true
  try {
    const res = await paymentApi.getGhnDistricts(provinceId, userStore.token)
    ghnDistricts.value = Array.isArray(res.data) ? res.data : []
  } catch (error) {
    console.error('Lỗi tải danh sách quận GHN:', error)
    ghnDistricts.value = []
    snackbarMessage.value = 'Không thể tải danh sách quận/huyện GHN'
    snackbarColor.value = 'warning'
    showSnackbar.value = true
  } finally {
    isLoadingDistricts.value = false
  }
}

const onDistrictChange = async () => {
  shippingInput.value.toWardCode = ''
  ghnWards.value = []

  const districtId = Number.parseInt(shippingInput.value.toDistrictId, 10)
  if (!Number.isFinite(districtId) || districtId <= 0) {
    return
  }

  isLoadingWards.value = true
  try {
    const res = await paymentApi.getGhnWards(districtId, userStore.token)
    ghnWards.value = Array.isArray(res.data) ? res.data : []
  } catch (error) {
    console.error('Lỗi tải danh sách phường GHN:', error)
    ghnWards.value = []
    snackbarMessage.value = 'Không thể tải danh sách phường/xã GHN'
    snackbarColor.value = 'warning'
    showSnackbar.value = true
  } finally {
    isLoadingWards.value = false
  }
}

const calculateGhnShippingFee = async (silent = false) => {
  const toDistrictId = Number.parseInt(shippingInput.value.toDistrictId, 10)
  const toWardCode = String(shippingInput.value.toWardCode || '').trim()

  if (!Number.isFinite(toDistrictId) || toDistrictId <= 0) {
    if (!silent) {
      snackbarMessage.value = 'Vui lòng nhập mã quận/huyện GHN hợp lệ'
      snackbarColor.value = 'warning'
      showSnackbar.value = true
    }
    return
  }

  if (!toWardCode) {
    if (!silent) {
      snackbarMessage.value = 'Vui lòng nhập mã phường/xã GHN'
      snackbarColor.value = 'warning'
      showSnackbar.value = true
    }
    return
  }

  isCalculatingShipping.value = true
  try {
    const payload = {
      toDistrictId,
      toWardCode,
      weight: Number.parseInt(shippingInput.value.weight, 10) || 1000,
      length: Number.parseInt(shippingInput.value.length, 10) || 20,
      width: Number.parseInt(shippingInput.value.width, 10) || 20,
      height: Number.parseInt(shippingInput.value.height, 10) || 20,
      insuranceValue: Number(totalPrice.value) || 0,
    }

    const res = await paymentApi.getGhnShippingFee(payload, userStore.token)
    shippingFee.value = Number(res.data?.shippingFee) || 0
    if (!silent) {
      snackbarMessage.value = 'Đã cập nhật phí ship từ GHN'
      snackbarColor.value = 'success'
      showSnackbar.value = true
    }
  } catch (error) {
    console.error('Lỗi tính phí GHN:', error)
    shippingFee.value = 0
    snackbarMessage.value = error?.response?.data?.message || 'Không thể tính phí ship GHN. Vui lòng kiểm tra mã khu vực'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  } finally {
    isCalculatingShipping.value = false
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
  // Allow empty coupon code - system will handle it as no discount
  const finalCouponCode = String(couponCode.value || '').trim()

  isCheckingOut.value = true
  try {
    const res = await paymentApi.checkoutSelected(
      accountId,
      paymentMethodForCheckout,
      cartItemIds,
      userStore.token,
      finalCouponCode, // Can be empty string
      shippingFee.value,
    )
    const orderId =
      res.data?.id ||
      res.data?.orderID ||
      res.data?.orderId ||
      res.data?.data?.id ||
      res.data?.data?.orderId

    sessionStorage.removeItem(SELECTED_CART_ITEM_IDS_KEY)
    sessionStorage.removeItem(QUICK_BUY_CONTEXT_KEY)
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
  sessionStorage.removeItem(QUICK_BUY_CONTEXT_KEY)
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
  await Promise.all([loadCheckoutItems(), loadUserClaimedCoupons(), loadAvailableCoupons(), loadGhnProvinces(), loadSavedAddresses()])
  await onSavedAddressChange()
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

/* Available coupons card styles */
.coupon-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #e0e0e0;
  background-color: #fafafa;
}

.coupon-card:hover {
  border-color: #1976d2;
  background-color: #f0f7ff;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.15);
  transform: translateY(-2px);
}

.coupon-card.selected {
  border-color: #1976d2;
  background-color: #e3f2fd;
  box-shadow: 0 4px 16px rgba(25, 118, 210, 0.25);
}

.h-100 {
  height: 100%;
}

.gap-3 {
  gap: 12px;
}

.ga-3 {
  gap: 12px;
}

.ga-2 {
  gap: 8px;
}
</style>
