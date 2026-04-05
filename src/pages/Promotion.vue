<template>
  <v-container class="py-8" fluid>
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold mb-2">🎉 Khuyến Mãi & Mã Giảm Giá</h1>
      <p class="text-subtitle-1 text-grey">Nhận các mã giảm giá mới nhất và sử dụng khi thanh toán đơn hàng</p>
    </div>

    <!-- Tabs for Available vs Claimed -->
    <v-tabs v-model="activeTab" class="mb-6">
      <v-tab value="available" icon="mdi-gift-outline">
        <span class="ml-2">Mã Khả Dụng</span>
        <v-chip class="ml-2" size="small" color="primary">{{ availableCoupons.length }}</v-chip>
      </v-tab>
      <v-tab value="claimed" icon="mdi-check-circle-outline">
        <span class="ml-2">Mã Đã Nhận</span>
        <v-chip class="ml-2" size="small" color="success">{{ claimedCoupons.length }}</v-chip>
      </v-tab>
    </v-tabs>

    <!-- Loading State -->
    <div v-if="isLoading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <!-- Available Coupons Tab -->
    <div v-else-if="activeTab === 'available'">
      <v-row v-if="availableCoupons.length > 0" class="ga-0">
        <v-col
          v-for="coupon in availableCoupons"
          :key="coupon.id"
          cols="12"
        >
          <div class="coupon-item-wrapper d-flex align-center ga-3 pa-4 mb-3 rounded-lg" :style="{ backgroundColor: getCouponBgColor(coupon.discountType) }">
            <!-- Left Coupon Icon -->
            <div class="coupon-icon-box d-flex align-center justify-center rounded">
              <v-icon size="48" color="white">{{ coupon.discountType === 'percent' ? 'mdi-percent' : 'mdi-currency-usd' }}</v-icon>
            </div>

            <!-- Middle Content -->
            <div class="coupon-content flex-grow-1">
              <!-- Discount Badge and Title -->
              <div class="d-flex align-center ga-2 mb-1">
                <v-chip
                  size="small"
                  :color="coupon.discountType === 'percent' ? '#FF6B6B' : '#4CAF50'"
                  text-color="white"
                  class="font-weight-bold"
                >
                  {{ coupon.discountType === 'percent' ? 'Giảm giá' : 'Giảm' }}
                </v-chip>
                <span class="text-subtitle-1 font-weight-bold">
                  Giảm {{ coupon.discountType === 'percent' ? coupon.discountValue + '%' : formatPrice(coupon.discountValue) + 'K' }} 
                  Đơn tối thiểu {{ formatPrice(coupon.minOrderValue / 1000) }}K
                </span>
              </div>

              <!-- Discount Details -->
              <div class="text-caption text-grey-darken-1">
                Còn lại {{ coupon.quantity > 0 ? '100%' : '0%' }} - 
                <span v-if="daysUntilExpiry(coupon.endDate) > 0">
                  Hết hạn sau: {{ daysUntilExpiry(coupon.endDate) }} ngày
                </span>
                <span v-else class="text-error">Đã hết hạn</span>
              </div>
            </div>

            <!-- Right Actions -->
            <div class="d-flex flex-column ga-2 align-center">
              <v-btn
                size="small"
                variant="text"
                color="primary"
                @click="showCouponDetails(coupon)"
              >
                Chi tiết >>
              </v-btn>
              
              <v-btn
                size="large"
                :color="getButtonColor(coupon)"
                :disabled="isUserClaimedThisCoupon(coupon.id)"
                :loading="claimingId === coupon.id"
                @click="claimCoupon(coupon)"
              >
                {{ isUserClaimedThisCoupon(coupon.id) ? '✓ Đã nhận' : 'Nhận Mã' }}
              </v-btn>
            </div>
          </div>
        </v-col>
      </v-row>

      <v-empty-state
        v-else
        icon="mdi-gift-off"
        title="Không có mã giảm giá khả dụng"
        text="Hãy kiểm tra lại sau, sẽ có những mã mới!"
      />
    </div>

    <!-- Claimed Coupons Tab -->
    <div v-else-if="activeTab === 'claimed'">
      <v-row v-if="claimedCoupons.length > 0" class="ga-4">
        <v-col
          v-for="userCoupon in claimedCoupons"
          :key="userCoupon.id"
          cols="12"
          sm="6"
          lg="4"
        >
          <v-card class="claimed-coupon-card h-100" variant="outlined">
            <v-card-text class="pa-4">
              <!-- Status Badge -->
              <div class="d-flex justify-space-between align-start mb-3">
                <div>
                  <div class="text-h6 font-weight-bold">{{ userCoupon.discountCoupon.couponCode }}</div>
                  <div class="text-caption text-grey">{{ userCoupon.discountCoupon.name }}</div>
                </div>
                <v-chip
                  :color="
                    userCoupon.status === 'used'
                      ? 'success'
                      : userCoupon.status === 'expired'
                        ? 'error'
                        : 'warning'
                  "
                  small
                  text-color="white"
                >
                  {{ getStatusLabel(userCoupon.status) }}
                </v-chip>
              </div>

              <!-- Discount Value -->
              <div class="mb-3 pa-3 bg-light rounded">
                <div class="text-caption text-grey">Giảm giá</div>
                <div class="text-h5 font-weight-bold text-success">
                  {{
                    userCoupon.discountCoupon.discountType === 'percent'
                      ? userCoupon.discountCoupon.discountValue + '%'
                      : formatPrice(userCoupon.discountCoupon.discountValue) + 'đ'
                  }}
                </div>
              </div>

              <!-- Dates -->
              <div class="details-section">
                <div class="detail-row">
                  <span class="text-caption text-grey">Nhận vào:</span>
                  <span class="text-body-2">{{ formatDateTime(userCoupon.claimedDate) }}</span>
                </div>
                <div v-if="userCoupon.usedDate" class="detail-row">
                  <span class="text-caption text-grey">Sử dụng vào:</span>
                  <span class="text-body-2">{{ formatDateTime(userCoupon.usedDate) }}</span>
                </div>
              </div>

              <!-- Copy Code Button -->
              <v-btn
                block
                variant="outlined"
                class="mt-4"
                @click="copyCouponCode(userCoupon.discountCoupon.couponCode)"
              >
                📋 Sao Chép Mã
              </v-btn>

              <!-- Delete Button -->
              <v-btn
                block
                variant="text"
                size="small"
                class="mt-2"
                @click="removeCoupon(userCoupon.id)"
              >
                🗑️ Xóa
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-empty-state
        v-else
        icon="mdi-gift-outline"
        title="Bạn chưa nhận mã giảm giá nào"
        text="Hãy nhận các mã ở tab 'Mã Khả Dụng' để sử dụng khi thanh toán"
      >
        <template #actions>
          <v-btn color="primary" @click="activeTab = 'available'">Quay lại mã khả dụng</v-btn>
        </template>
      </v-empty-state>
    </div>

    <!-- Snackbar Notifications -->
    <v-snackbar v-model="showSnackbar" :color="snackbarColor" timeout="3000" top>
      {{ snackbarMessage }}
    </v-snackbar>

    <!-- Confirm Delete Dialog -->
    <v-dialog v-model="showDeleteDialog" width="400">
      <v-card>
        <v-card-title>Xác nhận xóa</v-card-title>
        <v-card-text>Bạn có chắc chắn muốn xóa mã giảm giá này không?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showDeleteDialog = false">Hủy</v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="isDeleting"
            @click="confirmDelete"
          >
            Xóa
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Coupon Details Dialog -->
    <v-dialog v-model="showDetailsDialog" width="600">
      <v-card v-if="selectedCouponDetail">
        <v-card-title class="d-flex justify-space-between align-center">
          {{ selectedCouponDetail.couponCode }}
          <v-btn icon="mdi-close" variant="text" @click="showDetailsDialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <div class="mb-4">
            <div class="text-caption text-grey">Mã giảm giá</div>
            <div class="text-h5 font-weight-bold">{{ selectedCouponDetail.couponCode }}</div>
          </div>

          <div class="mb-4">
            <div class="text-caption text-grey">Giảm giá</div>
            <div class="text-h4 font-weight-bold text-success">
              {{
                selectedCouponDetail.discountType === 'percent'
                  ? selectedCouponDetail.discountValue + '%'
                  : formatPrice(selectedCouponDetail.discountValue) + 'đ'
              }}
            </div>
            <div v-if="selectedCouponDetail.maxDiscountValue && selectedCouponDetail.discountType === 'percent'" class="text-caption text-grey mt-1">
              Tối đa giảm: {{ formatPrice(selectedCouponDetail.maxDiscountValue) }}đ
            </div>
          </div>

          <v-divider class="my-4" />

          <div class="d-flex gap-3 mb-3">
            <div class="flex-grow-1">
              <div class="text-caption text-grey">Đơn tối thiểu</div>
              <div class="font-weight-bold">{{ formatPrice(selectedCouponDetail.minOrderValue) }}đ</div>
            </div>
            <div class="flex-grow-1">
              <div class="text-caption text-grey">Lượt còn lại</div>
              <div class="font-weight-bold">{{ selectedCouponDetail.quantity }}</div>
            </div>
          </div>

          <div class="d-flex gap-3 mb-3">
            <div class="flex-grow-1">
              <div class="text-caption text-grey">Ngày bắt đầu</div>
              <div class="font-weight-bold">{{ formatDate(selectedCouponDetail.startDate) }}</div>
            </div>
            <div class="flex-grow-1">
              <div class="text-caption text-grey">Ngày kết thúc</div>
              <div class="font-weight-bold">{{ formatDate(selectedCouponDetail.endDate) }}</div>
            </div>
          </div>

          <div v-if="selectedCouponDetail.description" class="mb-4 pa-3 bg-blue-lighten-5 rounded">
            <div class="text-caption">{{ selectedCouponDetail.description }}</div>
          </div>

          <v-divider class="my-4" />

          <div class="d-flex gap-2">
            <v-btn
              block
              variant="outlined"
              @click="copyCouponCode(selectedCouponDetail.couponCode)"
            >
              📋 Sao Chép Mã
            </v-btn>
            <v-btn
              block
              color="primary"
              :disabled="isUserClaimedThisCoupon(selectedCouponDetail.id)"
              :loading="claimingId === selectedCouponDetail.id"
              @click="claimCoupon(selectedCouponDetail)"
            >
              {{ isUserClaimedThisCoupon(selectedCouponDetail.id) ? '✓ Đã nhận' : 'Nhận Mã' }}
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import userDiscountCouponApi from '@/api/userDiscountCouponApi'

const userStore = useUserStore()

const activeTab = ref('available')
const isLoading = ref(false)
const availableCoupons = ref([])
const claimedCoupons = ref([])
const claimingId = ref(null)
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')
const showDeleteDialog = ref(false)
const isDeleting = ref(false)
const couponToDelete = ref(null)
const showDetailsDialog = ref(false)
const selectedCouponDetail = ref(null)

const getCouponBgColor = (type) => {
  return type === 'percent' ? '#FEF3E2' : '#E8F5E9'
}

const getButtonColor = (coupon) => {
  return coupon.discountType === 'percent' ? '#FF6B6B' : '#4CAF50'
}

const daysUntilExpiry = (endDate) => {
  if (!endDate) return 0
  const today = new Date()
  const end = new Date(endDate)
  const diffTime = end - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

const showCouponDetails = (coupon) => {
  selectedCouponDetail.value = coupon
  showDetailsDialog.value = true
}

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price || 0)

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('vi-VN')
}

const formatDateTime = (datetime) => {
  if (!datetime) return '-'
  return new Date(datetime).toLocaleString('vi-VN')
}

const getStatusLabel = (status) => {
  const labels = {
    claimed: 'Đã Nhận',
    used: 'Đã Sử Dụng',
    expired: 'Hết Hạn',
  }
  return labels[status] || status
}

const isUserClaimedThisCoupon = (couponId) => {
  return claimedCoupons.value.some((uc) => uc.discountCoupon?.id === couponId)
}

const loadAvailableCoupons = async () => {
  try {
    const res = await userDiscountCouponApi.getAvailableDiscountCoupons()
    availableCoupons.value = res.data || []
  } catch (error) {
    console.error('Lỗi tải mã giảm giá khả dụng:', error)
    snackbarMessage.value = 'Lỗi tải mã giảm giá'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  }
}

const loadClaimedCoupons = async () => {
  const accountId = Number.parseInt(userStore.accountId, 10)
  if (!Number.isFinite(accountId) || accountId <= 0) {
    return
  }

  try {
    const res = await userDiscountCouponApi.getUserDiscountCoupons(accountId)
    claimedCoupons.value = res.data || []
  } catch (error) {
    console.error('Lỗi tải mã đã nhận:', error)
  }
}

const claimCoupon = async (coupon) => {
  const accountId = Number.parseInt(userStore.accountId, 10)
  if (!Number.isFinite(accountId) || accountId <= 0) {
    snackbarMessage.value = 'Bạn cần đăng nhập để nhận mã giảm giá'
    snackbarColor.value = 'warning'
    showSnackbar.value = true
    return
  }

  claimingId.value = coupon.id

  try {
    await userDiscountCouponApi.claimDiscountCoupon(accountId, coupon.id)
    snackbarMessage.value = `Nhận mã "${coupon.couponCode}" thành công!`
    snackbarColor.value = 'success'
    showSnackbar.value = true

    await loadClaimedCoupons()
  } catch (error) {
    snackbarMessage.value = error.response?.data || 'Không thể nhận mã giảm giá'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  } finally {
    claimingId.value = null
  }
}

const copyCouponCode = (code) => {
  navigator.clipboard.writeText(code).then(() => {
    snackbarMessage.value = `Đã sao chép mã "${code}"`
    snackbarColor.value = 'info'
    showSnackbar.value = true
  })
}

const removeCoupon = (userCouponId) => {
  couponToDelete.value = userCouponId
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (!couponToDelete.value) return

  isDeleting.value = true
  try {
    await userDiscountCouponApi.deleteUserDiscountCoupon(couponToDelete.value)
    snackbarMessage.value = 'Xóa mã giảm giá thành công'
    snackbarColor.value = 'success'
    showSnackbar.value = true

    await loadClaimedCoupons()
    showDeleteDialog.value = false
  } catch (error) {
    snackbarMessage.value = 'Không thể xóa mã giảm giá'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  } finally {
    isDeleting.value = false
    couponToDelete.value = null
  }
}

onMounted(async () => {
  isLoading.value = true
  await Promise.all([loadAvailableCoupons(), loadClaimedCoupons()])
  isLoading.value = false
})
</script>

<style scoped>
.coupon-item-wrapper {
  border-left: 4px solid #FF6B6B;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  min-height: 120px;
}

.coupon-item-wrapper:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.coupon-icon-box {
  min-width: 80px;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E72 100%);
  border-radius: 8px;
  flex-shrink: 0;
}

.coupon-content {
  flex-grow: 1;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.bg-light {
  background-color: #f5f5f5;
}

.details-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rounded-lg {
  border-radius: 12px;
}
</style>
