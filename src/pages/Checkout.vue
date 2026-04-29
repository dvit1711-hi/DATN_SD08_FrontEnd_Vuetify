<template>
  <v-container class="checkout-container py-8" fluid style="max-width: 1400px">
    <!-- Header Section -->
    <div class="mb-8 d-flex align-center justify-space-between flex-wrap ga-3">
      <div class="d-flex align-center gap-3">
        <div class="header-icon checkout-icon">
          <v-icon icon="mdi-credit-card" size="32" color="white"></v-icon>
        </div>
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Thanh toán đơn hàng</h1>
          <p class="text-body-2 text-grey">Xác nhận sản phẩm và hoàn tất đơn hàng của bạn</p>
        </div>
      </div>
      <v-btn 
        variant="outlined" 
        prepend-icon="mdi-arrow-left" 
        color="primary"
        @click="goBackCart"
      >
        Quay lại giỏ hàng
      </v-btn>
    </div>

    <v-row v-if="checkoutItems.length > 0" class="ga-6">
      <!-- Items Section -->
      <v-col cols="12" lg="8">
        <!-- Order Items -->
        <div class="mb-6">
          <h3 class="text-h6 font-weight-bold mb-4 d-flex align-center gap-2">
            <v-icon icon="mdi-package-variant" color="primary"></v-icon>
            Danh sách sản phẩm ({{ checkoutItems.length }})
          </h3>

          <transition-group name="list" tag="div">
            <v-card
              v-for="item in checkoutItems"
              :key="item.cartItemID"
              class="checkout-item-card mb-4"
              elevation="0"
              border
            >
              <v-card-text class="pa-4">
                <div class="d-flex gap-4 flex-wrap">
                  <!-- Product Image -->
                  <div>
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
                    <div class="mb-3">
                      <div class="text-h6 font-weight-bold mb-1">{{ item.productName }}</div>
                      <div class="text-caption text-grey">Mã: #{{ item.productColorID }}</div>
                    </div>

                    <!-- Variant Info -->
                    <div class="variant-section">
                      <div class="d-flex align-center gap-2 mb-2">
                        <span class="text-caption text-grey" style="min-width: 60px;">🎨 Màu:</span>
                        <div v-if="item.colorCode" class="color-swatch" :style="{ backgroundColor: item.colorCode }"></div>
                        <span class="text-caption font-weight-medium">{{ item.colorName }}</span>
                      </div>
                      <div class="d-flex align-center gap-2 mb-2">
                        <span class="text-caption text-grey" style="min-width: 60px;">📏 Size:</span>
                        <v-chip size="small" variant="outlined" color="primary">{{ item.sizeName || '-' }}</v-chip>
                      </div>
                      <div class="d-flex align-center gap-2">
                        <span class="text-caption text-grey" style="min-width: 60px;">📦 Số lượng:</span>
                        <v-chip size="small" color="primary" variant="tonal">{{ item.quantity }}</v-chip>
                      </div>
                    </div>
                  </div>

                  <!-- Price Info -->
                  <div class="d-flex flex-column gap-3 align-end" style="min-width: 160px;">
                    <div class="text-center">
                      <div class="text-caption text-grey mb-1">Đơn giá</div>
                      <div class="text-subtitle-1 font-weight-bold">{{ formatPrice(item.price) }}đ</div>
                    </div>

                    <v-divider />

                    <div class="text-center">
                      <div class="text-caption text-grey mb-1">Thành tiền</div>
                      <div class="text-h6 font-weight-bold text-primary">
                        {{ formatPrice(item.price * item.quantity) }}đ
                      </div>
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </transition-group>
        </div>

        <!-- Shipping Address Section -->
        <v-card class="mb-6 address-card" elevation="0" border>
          <div class="section-header">
            <h3 class="text-h6 font-weight-bold d-flex align-center gap-2">
              <v-icon icon="mdi-map-marker-radius" color="white" size="24"></v-icon>
              Địa chỉ nhận hàng
            </h3>
          </div>

          <v-card-text class="pa-6">
            <!-- Address Mode Selection -->
            <div class="address-mode-selector mb-6 pb-4" style="border-bottom: 1px solid #e0e0e0;">
              <div class="text-caption text-grey font-weight-medium mb-3">Chọn loại địa chỉ</div>
              <v-radio-group
                v-model="addressMode"
                inline
                density="compact"
                hide-details
              >
                <v-radio label="Địa chỉ đã lưu" value="saved" />
                <v-radio label="Thêm địa chỉ mới" value="new" />
              </v-radio-group>
            </div>

            <!-- Saved Address Selection -->
            <template v-if="addressMode === 'saved'">
              <div class="mb-4">
                <v-select
                  v-model="selectedAddressId"
                  :items="savedAddressOptions"
                  item-title="label"
                  item-value="id"
                  label="Chọn một địa chỉ đã lưu"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  :loading="isLoadingSavedAddresses"
                  :disabled="isLoadingSavedAddresses || savedAddressOptions.length === 0"
                  @update:model-value="onSavedAddressChange"
                />
              </div>
              <v-alert
                v-if="selectedSavedAddress"
                type="info"
                variant="tonal"
                icon="mdi-check-circle"
                class="mt-3"
                :text="selectedSavedAddressLabel"
                dense
              />
              <div v-else class="text-caption text-grey mt-3">
                <v-icon icon="mdi-information-outline" size="16" class="mr-1" />
                Chọn địa chỉ từ danh sách trên
              </div>
            </template>

            <!-- New Address Form -->
            <template v-else>
              <!-- Address Details -->
              <div class="mb-5 pb-4" style="border-bottom: 1px solid #f0f0f0;">
                <div class="text-caption text-grey font-weight-medium mb-4">Chi tiết địa chỉ</div>
                <v-row dense>
                  <v-col cols="12" sm="6" md="4">
                    <v-text-field
                      v-model="newAddressForm.unitNumber"
                      label="Số nhà"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      placeholder="e.g., 123"
                    />
                  </v-col>
                  <v-col cols="12" sm="6" md="4">
                    <v-text-field
                      v-model="newAddressForm.streetNumber"
                      label="Số đường"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      placeholder="e.g., 456"
                    />
                  </v-col>
                  <v-col cols="12" sm="12" md="4">
                    <v-text-field
                      v-model="newAddressForm.addressLine1"
                      label="Tên đường"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      placeholder="e.g., Phố Huế"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="newAddressForm.postalCode"
                      label="Mã bưu chính (không bắt buộc)"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      placeholder="e.g., 100000"
                    />
                  </v-col>
                </v-row>
              </div>

              <!-- Location Selection -->
              <div class="mb-4">
                <div class="text-caption text-grey font-weight-medium mb-4">Khu vực giao hàng</div>
                <v-row dense>
                  <v-col cols="12">
                    <v-select
                      v-model="shippingInput.provinceId"
                      :items="ghnProvinces"
                      item-title="provinceName"
                      item-value="provinceId"
                      label="Tỉnh/Thành phố *"
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
                      label="Quận/Huyện *"
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
                      label="Phường/Xã *"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      :loading="isLoadingWards"
                      :disabled="!shippingInput.toDistrictId"
                    />
                  </v-col>
                </v-row>
              </div>

              <v-btn
                color="primary"
                size="large"
                block
                class="mt-6 save-address-btn"
                :loading="isSavingNewAddress"
                :disabled="isSavingNewAddress"
                @click="saveNewAddress"
              >
                <v-icon start>mdi-check</v-icon>
                Lưu địa chỉ mới và sử dụng
              </v-btn>
            </template>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Summary Section -->
      <v-col cols="12" lg="4">
        <v-card class="summary-card" elevation="0" border style="position: sticky; top: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 16px;">
            <h3 class="text-h6 font-weight-bold text-white mb-0">Thông tin thanh toán</h3>
          </div>

          <v-card-text class="pa-6">
            <!-- Summary Items -->
            <div class="mb-4">
              <div class="d-flex justify-space-between mb-3">
                <span class="text-body-2 text-grey">Sản phẩm</span>
                <span class="font-weight-bold">{{ totalQuantity }}</span>
              </div>
              <div class="d-flex justify-space-between mb-4">
                <span class="text-body-2 text-grey">Tạm tính</span>
                <span class="font-weight-bold">{{ formatPrice(totalPrice) }}đ</span>
              </div>
              <div v-if="discountAmount > 0" class="d-flex justify-space-between mb-4">
                <span class="text-body-2 text-grey">Giảm giá</span>
                <span class="font-weight-bold text-success">-{{ formatPrice(discountAmount) }}đ</span>
              </div>
              <div class="d-flex justify-space-between mb-4">
                <span class="text-body-2 text-grey">Phí vận chuyển</span>
                <span class="font-weight-bold">{{ formatPrice(shippingFee) }}đ</span>
              </div>
              <v-divider class="mb-4" />
            </div>

            <!-- Total -->
            <div class="d-flex justify-space-between align-center mb-6">
              <span class="text-body-1 font-weight-bold">Tổng cộng</span>
              <span class="text-h5 font-weight-bold text-primary">{{ formatPrice(finalTotal) }}đ</span>
            </div>

            <!-- Place Order Button -->
            <v-btn
              block
              color="primary"
              class="mb-3"
              size="large"
              style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;"
              :loading="isCheckingOut"
              :disabled="checkoutItems.length === 0 || isCheckingOut"
              @click="placeOrder"
            >
              Đặt hàng
            </v-btn>

            <!-- Security Info -->
            <div class="pt-4 text-center border-t">
              <div class="text-caption text-grey">
                <v-icon icon="mdi-shield-check" size="16" class="mr-1"></v-icon>
                Thanh toán an toàn & bảo mật
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Payment Method Section -->
    <v-row class="ga-6">
      <v-col cols="12" lg="8">
        <v-card class="mb-6 payment-card" elevation="0" border>
          <div class="section-header">
            <h3 class="text-h6 font-weight-bold d-flex align-center gap-2">
              <v-icon icon="mdi-credit-card" color="white" size="24"></v-icon>
              Phương thức thanh toán
            </h3>
          </div>

          <v-card-text class="pa-6">
            <v-radio-group
              v-model="selectedPaymentMethod"
              density="comfortable"
              hide-details
            >
              <div v-for="method in paymentMethods" :key="method.value" class="payment-method-item mb-4 pb-4" :style="{ borderBottom: method === paymentMethods[paymentMethods.length - 1] ? 'none' : '1px solid #f0f0f0' }">
                <div class="d-flex align-center mb-2">
                  <v-radio :value="method.value" />
                  <div class="ml-3">
                    <div class="text-body-2 font-weight-bold">{{ method.label }}</div>
                    <div class="text-caption text-grey">{{ method.description }}</div>
                  </div>
                </div>
              </div>
            </v-radio-group>
          </v-card-text>
        </v-card>

        <!-- Discount Section -->
        <v-card class="mb-6 discount-card" elevation="0" border>
          <div class="section-header">
            <h3 class="text-h6 font-weight-bold d-flex align-center gap-2">
              <v-icon icon="mdi-tag-multiple" color="white" size="24"></v-icon>
              Mã giảm giá &amp; Khuyến mãi
            </h3>
          </div>

          <v-card-text class="pa-6">
            <!-- Current Discount Status -->
            <v-card v-if="discountAmount > 0" class="discount-applied-card mb-6" variant="flat">
              <v-card-text class="pa-4">
                <div class="d-flex align-center justify-space-between flex-wrap gap-2">
                  <div class="d-flex align-center ga-3">
                    <v-icon size="32" color="success">mdi-check-circle</v-icon>
                    <div>
                      <div class="text-caption text-grey">Mã giảm giá đã áp dụng</div>
                      <div class="text-subtitle-1 font-weight-bold">{{ couponCode }}</div>
                    </div>
                  </div>
                  <div class="text-center">
                    <div class="text-caption text-grey">Tiết kiệm</div>
                    <div class="text-h5 font-weight-bold text-success">-{{ formatPrice(discountAmount) }}đ</div>
                  </div>
                  <v-btn
                    variant="text"
                    color="error"
                    size="small"
                    icon="mdi-close"
                    @click="() => { selectedCoupon = null; couponCode = ''; discountAmount = 0 }"
                  />
                </div>
              </v-card-text>
            </v-card>

            <!-- User's Claimed Coupons Section -->
            <div v-if="qualifiedUserClaimedCoupons.length > 0" class="mb-6">
              <div class="discount-section-label mb-3">
                <v-icon size="20" color="amber">mdi-gift</v-icon>
                <span class="font-weight-bold">Mã Của Bạn</span>
                <v-chip size="small" variant="tonal" label>{{ qualifiedUserClaimedCoupons.length }}</v-chip>
              </div>
              <div class="coupons-grid">
                <div
                  v-for="coupon in qualifiedUserClaimedCoupons"
                  :key="coupon.id"
                  class="coupon-card-modern"
                  :class="{ 'card-selected': selectedCoupon?.id === coupon.id }"
                  @click="selectCouponForCheckout(coupon)"
                >
                  <div class="coupon-card-inner">
                    <div class="coupon-badge">
                      <div v-if="coupon.discountCoupon.discountType === 'percent'" class="badge-value">
                        {{ coupon.discountCoupon.discountValue }}%
                      </div>
                      <div v-else class="badge-value">
                        {{ formatPrice(coupon.discountCoupon.discountValue) }}đ
                      </div>
                    </div>
                    <div class="coupon-info flex-grow-1">
                      <div class="coupon-code">{{ coupon.discountCoupon.couponCode }}</div>
                      <div class="coupon-desc text-caption">
                        Giảm {{ coupon.discountCoupon.discountType === 'percent' ? coupon.discountCoupon.discountValue + '%' : formatPrice(coupon.discountCoupon.discountValue) + 'đ' }}
                      </div>
                      <div v-if="coupon.discountCoupon.minOrderValue > 0" class="coupon-min text-caption">
                        Tối thiểu: {{ formatPrice(coupon.discountCoupon.minOrderValue) }}đ
                      </div>
                    </div>
                    <v-icon
                      class="coupon-check"
                      :color="selectedCoupon?.id === coupon.id ? 'primary' : 'grey'"
                    >
                      {{ selectedCoupon?.id === coupon.id ? 'mdi-check-circle-outline' : 'mdi-circle-outline' }}
                    </v-icon>
                  </div>
                </div>
              </div>

              <div v-if="selectedCoupon" class="d-flex ga-2 mt-4">
                <v-btn
                  color="primary"
                  size="large"
                  block
                  :loading="isApplyingCoupon"
                  @click="applySelectedCoupon"
                >
                  <v-icon start>mdi-check</v-icon>
                  Áp dụng mã này
                </v-btn>
              </div>
            </div>

            <!-- Manual Coupon Input -->
            <div class="mb-6">
              <div class="discount-section-label mb-3">
                <v-icon size="20" color="blue">mdi-keyboard</v-icon>
                <span class="font-weight-bold">Nhập Mã Khác</span>
              </div>
              <div class="d-flex ga-2">
                <v-text-field
                  v-model="manualCouponCode"
                  placeholder="Nhập mã giảm giá tại đây..."
                  variant="outlined"
                  density="comfortable"
                  clearable
                  class="flex-grow-1"
                  hide-details
                />
                <v-btn
                  color="primary"
                  size="large"
                  :disabled="!manualCouponCode || isApplyingCoupon"
                  :loading="isApplyingCoupon"
                  icon="mdi-send"
                  @click="applyManualCoupon"
                />
              </div>
            </div>

            <!-- All Available Coupons -->
            <div v-if="couponsDisplay.length > 0" class="mb-4">
              <div class="discount-section-label mb-3">
                <v-icon size="20" color="success">mdi-tag-multiple</v-icon>
                <span class="font-weight-bold">Khám Phá Mã Khác</span>
                <v-chip size="small" variant="tonal" color="success" label>{{ couponsDisplay.length }}</v-chip>
              </div>
              <v-select
                v-model="selectedAvailableCoupon"
                :items="couponsDisplay"
                item-title="displayText"
                return-object
                placeholder="Chọn mã giảm giá từ danh sách..."
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
            </div>

            <!-- No Discount Alert -->
            <v-alert
              v-if="discountAmount === 0"
              type="info"
              variant="tonal"
              icon="mdi-lightbulb-outline"
              class="discount-info-alert"
            >
              <div class="font-weight-bold mb-1">Tiết kiệm thêm tiền!</div>
              {{ qualifiedUserClaimedCoupons.length > 0 || couponsDisplay.length > 0 
                ? 'Chọn một mã giảm giá để giảm tổng tiền thanh toán của bạn.'
                : 'Hiện không có mã giảm giá nào khả dụng cho đơn hàng này.' }}
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-empty-state
      v-if="!isLoading"
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
const qualifiedUserClaimedCoupons = computed(() => {
  return userClaimedCoupons.value.filter(coupon => {
    const minOrderValue = Number(coupon.discountCoupon?.minOrderValue) || 0
    return totalPrice.value >= minOrderValue
  })
})

const couponsDisplay = computed(() => {
  return availableCoupons.value
    .filter(coupon => {
      const minOrderValue = Number(coupon.minOrderValue) || 0
      return totalPrice.value >= minOrderValue
    })
    .map(coupon => {
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

const cleanupUnpaidQuickBuyItem = async () => {
  if (isCleaningUpQuickBuy.value || !isQuickBuyMode.value || isQuickBuyOrderPlaced.value) {
    return
  }

  const cartItemId = Number.parseInt(quickBuyCartItemId.value, 10)
  const originalQty = Number.parseInt(quickBuyOriginalQuantity.value, 10) || 0
  const productColorId = Number.parseInt(quickBuyProductColorId.value, 10)
  const cartId = Number.parseInt(quickBuyCartId.value, 10)

  sessionStorage.removeItem(QUICK_BUY_CONTEXT_KEY)
  sessionStorage.removeItem(SELECTED_CART_ITEM_IDS_KEY)
  isQuickBuyMode.value = false
  quickBuyCartItemId.value = null
  quickBuyOriginalQuantity.value = 0
  quickBuyProductColorId.value = null
  quickBuyCartId.value = null

  if (!Number.isFinite(cartItemId) || cartItemId <= 0) {
    return
  }

  isCleaningUpQuickBuy.value = true
  try {
    if (originalQty > 0 && Number.isFinite(productColorId) && productColorId > 0) {
      await cartApi.update(
        cartItemId,
        {
          cartID: Number.isFinite(cartId) && cartId > 0 ? cartId : Number.parseInt(userStore.cartId, 10),
          productColorID: productColorId,
          quantity: originalQty,
        },
        userStore.token,
      )
    } else {
      await cartApi.remove(cartItemId, userStore.token)
    }
    window.dispatchEvent(new Event('cart-changed'))
  } catch (error) {
    console.error('Lỗi dọn sản phẩm mua ngay chưa thanh toán:', error)
  } finally {
    isCleaningUpQuickBuy.value = false
  }
}

const restoreOriginalCartAfterQuickBuyOrder = async () => {
  const originalQty = Number.parseInt(quickBuyOriginalQuantity.value, 10) || 0
  const productColorId = Number.parseInt(quickBuyProductColorId.value, 10)

  if (originalQty <= 0 || !Number.isFinite(productColorId) || productColorId <= 0) {
    return
  }

  try {
    let currentCartId = Number.parseInt(userStore.cartId, 10)
    if (!Number.isFinite(currentCartId) || currentCartId <= 0) {
      currentCartId = await userStore.getOrCreateCart()
    }

    const itemRes = await cartApi.getByCart(currentCartId)
    const exists = (itemRes.data || []).some((item) => {
      const colorId = Number.parseInt(item.productColorID ?? item.productID, 10)
      return colorId === productColorId
    })

    if (!exists) {
      await userStore.addToCartAPI(productColorId, originalQty)
      window.dispatchEvent(new Event('cart-changed'))
    }
  } catch (error) {
    console.error('Lỗi khôi phục sản phẩm cũ trong giỏ sau mua ngay:', error)
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
      if (quickBuyContext?.source !== 'buy-now') {
        quickBuyContext = null
      }
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
      const targetCartItemId = Number.parseInt(quickBuyContext.cartItemID, 10)
      const targetProductColorId = Number.parseInt(quickBuyContext.productColorID, 10)
      const buyNowQuantity = Number.parseInt(quickBuyContext.buyNowQuantity ?? quickBuyContext.quantity, 10) || 1
      const originalQty = Number.parseInt(quickBuyContext.originalQuantity, 10) || 0
      let matchedByColor = []

      if (Number.isFinite(targetCartItemId) && targetCartItemId > 0) {
        const matchedById = cartItems.find((item) => Number.parseInt(item.cartItemID, 10) === targetCartItemId)
        if (matchedById) {
          matchedByColor = [matchedById]
        }
      }

      if (matchedByColor.length === 0) {
        matchedByColor = cartItems.filter((item) => {
          const colorId = Number.parseInt(item.productColorID ?? item.productID, 10)
          return Number.isFinite(targetProductColorId) && colorId === targetProductColorId
        })
      }

      if (matchedByColor.length > 0) {
        const latestMatchedItem = [...matchedByColor].sort((a, b) => {
          const bId = Number.parseInt(b.cartItemID ?? b.id, 10) || 0
          const aId = Number.parseInt(a.cartItemID ?? a.id, 10) || 0
          return bId - aId
        })[0]

        const normalized = normalizeCheckoutItem(latestMatchedItem)

        // If quick-buy merged into existing cart line, temporarily force order quantity to buy-now quantity.
        if (originalQty > 0 && normalized.quantity !== buyNowQuantity) {
          await cartApi.update(
            normalized.cartItemID,
            {
              cartID: normalized.cartID,
              productColorID: normalized.productColorID,
              quantity: buyNowQuantity,
            },
            userStore.token,
          )
          normalized.quantity = buyNowQuantity
        }

        checkoutItems.value = [normalized]
        isQuickBuyMode.value = true
        quickBuyCartItemId.value = normalized.cartItemID
        quickBuyOriginalQuantity.value = originalQty
        quickBuyProductColorId.value = normalized.productColorID
        quickBuyCartId.value = normalized.cartID
        sessionStorage.setItem(SELECTED_CART_ITEM_IDS_KEY, JSON.stringify([normalized.cartItemID]))
        sessionStorage.setItem(QUICK_BUY_CONTEXT_KEY, JSON.stringify({
          ...quickBuyContext,
          source: 'buy-now',
          cartItemID: normalized.cartItemID,
          buyNowQuantity,
          originalQuantity: originalQty,
          productColorID: normalized.productColorID,
        }))
        return
      }

      isQuickBuyMode.value = false
      quickBuyCartItemId.value = null
      quickBuyOriginalQuantity.value = 0
      quickBuyProductColorId.value = null
      quickBuyCartId.value = null
      sessionStorage.removeItem(QUICK_BUY_CONTEXT_KEY)
    }

    isQuickBuyMode.value = false
    quickBuyCartItemId.value = null
    quickBuyOriginalQuantity.value = 0
    quickBuyProductColorId.value = null
    quickBuyCartId.value = null
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

  // Validate coupon if provided
  const finalCouponCode = String(couponCode.value || '').trim()
  if (finalCouponCode) {
    // Check if coupon is still valid and meets minimum order value
    const res = await getAllDiscountCoupons().catch(() => ({ data: [] }))
    const coupons = res.data || []
    const coupon = coupons.find((x) => String(x.couponCode || '').toLowerCase() === finalCouponCode.toLowerCase())
    
    if (!coupon) {
      snackbarMessage.value = 'Mã giảm giá không còn tồn tại'
      snackbarColor.value = 'warning'
      showSnackbar.value = true
      return
    }
    
    if (!isCouponValid(coupon)) {
      snackbarMessage.value = 'Mã giảm giá không hợp lệ hoặc đã hết hạn'
      snackbarColor.value = 'warning'
      showSnackbar.value = true
      return
    }
    
    if (!meetsMinOrderValue(coupon)) {
      snackbarMessage.value = `Mã giảm giá yêu cầu đơn tối thiểu ${formatPrice(coupon.minOrderValue)}đ. Đơn của bạn chỉ có ${formatPrice(totalPrice.value)}đ`
      snackbarColor.value = 'warning'
      showSnackbar.value = true
      return
    }
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
      finalCouponCode, // Can be empty string
      shippingFee.value,
    )
    const orderId =
      res.data?.id ||
      res.data?.orderID ||
      res.data?.orderId ||
      res.data?.data?.id ||
      res.data?.data?.orderId

    if (isQuickBuyMode.value) {
      isQuickBuyOrderPlaced.value = true
      await restoreOriginalCartAfterQuickBuyOrder()
    }

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

const goBackCart = async () => {
  await cleanupUnpaidQuickBuyItem()
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

onBeforeUnmount(() => {
  cleanupUnpaidQuickBuyItem()
})
</script>

<style scoped>
/* Checkout Container */
.checkout-container {
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  min-height: 100vh;
}

/* Header Icon */
.header-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.header-icon.checkout-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Card Styles */
.address-card,
.payment-card,
.discount-card {
  border-radius: 12px !important;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  background: white;
}

.address-card:hover,
.payment-card:hover,
.discount-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* Checkout Item Card */
.checkout-item-card {
  border-radius: 12px !important;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  background: white;
}

.checkout-item-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
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

/* Section Header */
.section-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 16px;
  border-radius: 12px 12px 0 0;
}

.section-header h3 {
  color: white;
  margin: 0;
}

/* Address Mode Selector */
.address-mode-selector {
  padding-bottom: 12px;
}

.address-mode-selector .v-radio {
  margin-right: 16px;
}

/* Save Address Button */
.save-address-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.save-address-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3) !important;
}

/* Payment Method Item */
.payment-method-item {
  transition: all 0.3s ease;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
}

.payment-method-item:hover {
  background: rgba(102, 126, 234, 0.05);
}

/* Summary Card */
.summary-card {
  position: sticky;
  top: 24px;
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  background: white;
}

/* Discount Section Label */
.discount-section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.15);
  color: #1976d2;
  font-size: 14px;
}

.discount-section-label .v-chip {
  margin-left: auto;
}

/* Applied Discount Card */
.discount-applied-card {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%) !important;
  border: 2px solid #28a745;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.15);
}

.discount-applied-card .pa-4 {
  padding: 16px !important;
}

/* Modern Coupon Cards Grid */
.coupons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.coupon-card-modern {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.coupon-card-modern::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.coupon-card-modern:hover {
  border-color: #1976d2;
  background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
  box-shadow: 0 6px 20px rgba(25, 118, 210, 0.2);
  transform: translateY(-4px);
}

.coupon-card-modern:hover::before {
  opacity: 1;
}

.coupon-card-modern.card-selected {
  border-color: #1976d2;
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  box-shadow: 0 8px 24px rgba(25, 118, 210, 0.3);
  color: white;
}

.coupon-card-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.coupon-badge {
  flex-shrink: 0;
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.coupon-card-modern.card-selected .coupon-badge {
  background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
  color: #1976d2;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.badge-value {
  font-size: 14px;
  font-weight: 700;
  text-align: center;
  line-height: 1.2;
}

.coupon-info {
  flex-grow: 1;
  min-width: 0;
}

.coupon-code {
  font-weight: 700;
  font-size: 16px;
  color: inherit;
  margin-bottom: 4px;
  word-break: break-word;
}

.coupon-card-modern.card-selected .coupon-code {
  color: white;
}

.coupon-desc {
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 4px;
}

.coupon-card-modern.card-selected .coupon-desc {
  color: rgba(255, 255, 255, 0.9);
}

.coupon-min {
  color: rgba(0, 0, 0, 0.5);
}

.coupon-card-modern.card-selected .coupon-min {
  color: rgba(255, 255, 255, 0.8);
}

.coupon-check {
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.coupon-card-modern:hover .coupon-check {
  color: #1976d2 !important;
}

.rounded-lg {
  border-radius: 8px;
}

/* Discount Info Alert */
.discount-info-alert {
  border-radius: 12px !important;
  border: 1px solid rgba(25, 118, 210, 0.2) !important;
  background: rgba(25, 118, 210, 0.05) !important;
  color: #1976d2;
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
