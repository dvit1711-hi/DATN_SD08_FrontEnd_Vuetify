<template>
  <v-container class="promotion-container" fluid>
    <!-- Enhanced Header Section -->
    <div class="header-section mb-8">
      <div class="header-content">
        <div class="d-flex align-center gap-4 mb-4">
          <div class="header-icon">
            <v-icon icon="mdi-gift-multiple" size="40" color="white"></v-icon>
          </div>
          <div>
            <h1 class="text-h3 font-weight-bold mb-1">Khuyến Mãi & Mã Giảm Giá</h1>
            <p class="text-subtitle-1 text-grey-darken-1">Nhận các mã giảm giá mới nhất và sử dụng khi thanh toán đơn hàng của bạn</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Tabs Section -->
    <div class="tabs-section mb-8">
      <v-tabs 
        v-model="activeTab" 
        class="custom-tabs"
        slider-color="primary"
      >
        <v-tab value="available" class="tab-item">
          <div class="d-flex align-center gap-2">
            <v-icon icon="mdi-gift-outline" size="20"></v-icon>
            <span>Mã Khả Dụng</span>
            <v-chip 
              size="small" 
              color="primary" 
              text-color="white"
              class="ml-2"
            >
              {{ availableCoupons.length }}
            </v-chip>
          </div>
        </v-tab>
        <v-tab value="claimed" class="tab-item">
          <div class="d-flex align-center gap-2">
            <v-icon icon="mdi-check-circle-outline" size="20"></v-icon>
            <span>Mã Đã Nhận</span>
            <v-chip 
              size="small" 
              color="success" 
              text-color="white"
              class="ml-2"
            >
              {{ claimedCoupons.length }}
            </v-chip>
          </div>
        </v-tab>
      </v-tabs>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <!-- Available Coupons Tab -->
    <div v-else-if="activeTab === 'available'">
      <v-row v-if="availableCoupons.length > 0" class="ga-4">
        <v-col
          v-for="coupon in availableCoupons"
          :key="coupon.id"
          cols="12"
          sm="6"
          md="6"
          lg="3"
          xl="3"
        >
          <div class="coupon-card-wrapper">
            <v-card class="coupon-card h-100 position-relative" elevation="0">
              <!-- Top Discount Badge -->
              <div class="discount-badge" :class="coupon.discountType === 'percent' ? 'percent' : 'fixed'">
                <div class="badge-value">
                  {{ coupon.discountType === 'percent' ? coupon.discountValue + '%' : formatPrice(coupon.discountValue) }}
                </div>
                <div class="badge-label">{{ coupon.discountType === 'percent' ? 'Giảm' : 'Giảm' }}</div>
              </div>

              <!-- Card Header with Gradient -->
              <div class="card-header" :style="{ background: getGradientBg(coupon.discountType) }">
                <v-icon size="48" color="white">{{ coupon.discountType === 'percent' ? 'mdi-percent' : 'mdi-currency-usd' }}</v-icon>
              </div>

              <!-- Card Content -->
              <v-card-text class="pa-4">
                <!-- Coupon Title -->
                <div class="mb-3">
                  <div class="text-subtitle-2 text-grey font-weight-medium">{{ coupon.name }}</div>
                  <div class="text-h6 font-weight-bold line-clamp-2">{{ coupon.couponCode }}</div>
                </div>

                <!-- Min Order Value -->
                <div class="info-box mb-3">
                  <div class="info-label">Đơn hàng tối thiểu</div>
                  <div class="info-value text-success font-weight-bold">
                    {{ formatPrice(coupon.minOrderValue) }}đ
                  </div>
                </div>

                <!-- Expiry Info -->
                <div class="d-flex gap-2 mb-4">
                  <div class="flex-grow-1">
                    <div class="text-caption text-grey">Lượt còn lại</div>
                    <div class="font-weight-bold">{{ coupon.quantity > 0 ? '✓ Có' : '✗ Hết' }}</div>
                  </div>
                  <div class="flex-grow-1 text-right">
                    <div class="text-caption text-grey">Hết hạn trong</div>
                    <div class="font-weight-bold" :class="daysUntilExpiry(coupon.endDate) <= 3 ? 'text-error' : 'text-primary'">
                      {{ daysUntilExpiry(coupon.endDate) }} ngày
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="d-flex gap-2">
                  <v-btn
                    size="small"
                    variant="tonal"
                    color="primary"
                    icon="mdi-information-outline"
                    @click="showCouponDetails(coupon)"
                    class="flex-grow-1"
                  >
                    Chi tiết
                  </v-btn>
                  
                  <v-btn
                    size="small"
                    :variant="isUserClaimedThisCoupon(coupon.id) ? 'tonal' : 'flat'"
                    :color="isUserClaimedThisCoupon(coupon.id) ? 'success' : getButtonColor(coupon)"
                    :disabled="isUserClaimedThisCoupon(coupon.id)"
                    :loading="claimingId === coupon.id"
                    @click="claimCoupon(coupon)"
                    class="flex-grow-1"
                  >
                    {{ isUserClaimedThisCoupon(coupon.id) ? '✓ Đã nhận' : 'Nhận Mã' }}
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </div>
        </v-col>
      </v-row>

      <v-empty-state
        v-else
        icon="mdi-gift-off"
        title="Không có mã giảm giá khả dụng"
        text="Hãy kiểm tra lại sau, sẽ có những mã mới!"
        class="empty-state"
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
          md="6"
          lg="3"
          xl="3"
        >
          <v-card class="claimed-coupon-card h-100 position-relative" elevation="0">
            <!-- Status Badge -->
            <div class="status-badge" :class="userCoupon.status">
              {{ getStatusLabel(userCoupon.status) }}
            </div>

            <!-- Card Header -->
            <div class="claimed-card-header">
              <v-icon size="40" color="white">mdi-check-decagram</v-icon>
            </div>

            <!-- Card Content -->
            <v-card-text class="pa-4">
              <!-- Coupon Code -->
              <div class="mb-3">
                <div class="text-caption text-grey">Mã giảm giá</div>
                <div class="text-h5 font-weight-bold" style="font-family: 'Courier New', monospace;">
                  {{ userCoupon.discountCoupon.couponCode }}
                </div>
              </div>

              <!-- Discount Value -->
              <div class="discount-info mb-4">
                <div class="discount-label">Giảm giá</div>
                <div class="discount-amount">
                  {{
                    userCoupon.discountCoupon.discountType === 'percent'
                      ? userCoupon.discountCoupon.discountValue + '%'
                      : formatPrice(userCoupon.discountCoupon.discountValue) + 'đ'
                  }}
                </div>
              </div>

              <!-- Dates -->
              <div class="dates-section mb-4">
                <div class="date-item">
                  <span class="text-caption text-grey">📅 Nhận vào</span>
                  <div class="text-body-2 font-weight-medium">{{ formatDate(userCoupon.claimedDate) }}</div>
                </div>
                <div v-if="userCoupon.usedDate" class="date-item">
                  <span class="text-caption text-grey">✅ Sử dụng</span>
                  <div class="text-body-2 font-weight-medium">{{ formatDate(userCoupon.usedDate) }}</div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="d-flex gap-2">
                <v-btn
                  block
                  variant="flat"
                  color="primary"
                  size="small"
                  icon="mdi-content-copy"
                  @click="copyCouponCode(userCoupon.discountCoupon.couponCode)"
                >
                  Sao Chép
                </v-btn>
                <v-btn
                  block
                  variant="outlined"
                  color="error"
                  size="small"
                  icon="mdi-delete"
                  @click="removeCoupon(userCoupon.id)"
                >
                  Xóa
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-empty-state
        v-else
        icon="mdi-gift-outline"
        title="Bạn chưa nhận mã giảm giá nào"
        text="Hãy nhận các mã ở tab 'Mã Khả Dụng' để sử dụng khi thanh toán"
        class="empty-state"
      >
        <template #actions>
          <v-btn 
            color="primary" 
            size="large"
            @click="activeTab = 'available'"
          >
            <v-icon start>mdi-arrow-left</v-icon>
            Quay lại mã khả dụng
          </v-btn>
        </template>
      </v-empty-state>
    </div>

    <!-- Snackbar Notifications -->
    <v-snackbar v-model="showSnackbar" :color="snackbarColor" timeout="3000" top>
      {{ snackbarMessage }}
    </v-snackbar>

    <!-- Confirm Delete Dialog -->
    <v-dialog v-model="showDeleteDialog" width="400" class="delete-dialog">
      <v-card class="delete-card">
        <div class="delete-header">
          <v-icon icon="mdi-alert-circle-outline" size="48" color="error"></v-icon>
        </div>
        <v-card-title class="text-center text-h5 font-weight-bold">Xác nhận xóa</v-card-title>
        <v-card-text class="text-center text-body-2 py-6">
          Bạn có chắc chắn muốn xóa mã giảm giá này không? Hành động này không thể hoàn tác.
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-btn 
            variant="text" 
            color="grey-darken-1"
            block
            @click="showDeleteDialog = false"
          >
            Hủy
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            block
            :loading="isDeleting"
            @click="confirmDelete"
          >
            Xóa Mã
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Coupon Details Dialog -->
    <v-dialog v-model="showDetailsDialog" width="600" class="details-dialog">
      <v-card v-if="selectedCouponDetail" class="details-card">
        <div class="details-header" :style="{ background: getGradientBg(selectedCouponDetail.discountType) }">
          <div class="details-badge">
            <div class="badge-value">
              {{ selectedCouponDetail.discountType === 'percent' ? selectedCouponDetail.discountValue + '%' : formatPrice(selectedCouponDetail.discountValue) }}
            </div>
          </div>
          <v-btn 
            icon="mdi-close" 
            variant="text" 
            color="white"
            class="position-absolute"
            style="top: 12px; right: 12px;"
            @click="showDetailsDialog = false" 
          />
        </div>

        <v-card-text class="pa-6">
          <div class="mb-6">
            <div class="text-caption text-grey">Mã giảm giá</div>
            <div class="text-h4 font-weight-bold" style="font-family: 'Courier New', monospace;">{{ selectedCouponDetail.couponCode }}</div>
          </div>

          <div class="mb-6 info-card">
            <div class="info-label">Giảm giá</div>
            <div class="info-amount">
              {{
                selectedCouponDetail.discountType === 'percent'
                  ? selectedCouponDetail.discountValue + '%'
                  : formatPrice(selectedCouponDetail.discountValue) + 'đ'
              }}
            </div>
            <div v-if="selectedCouponDetail.maxDiscountValue && selectedCouponDetail.discountType === 'percent'" class="text-caption text-grey mt-2">
              ⚠️ Tối đa giảm: {{ formatPrice(selectedCouponDetail.maxDiscountValue) }}đ
            </div>
          </div>

          <v-divider class="my-4" />

          <div class="details-grid mb-6">
            <div class="detail-item">
              <div class="text-caption text-grey">📋 Đơn tối thiểu</div>
              <div class="font-weight-bold text-body-2">{{ formatPrice(selectedCouponDetail.minOrderValue) }}đ</div>
            </div>
            <div class="detail-item">
              <div class="text-caption text-grey">📦 Lượt còn lại</div>
              <div class="font-weight-bold text-body-2">{{ selectedCouponDetail.quantity }} mã</div>
            </div>
            <div class="detail-item">
              <div class="text-caption text-grey">📅 Ngày bắt đầu</div>
              <div class="font-weight-bold text-body-2">{{ formatDate(selectedCouponDetail.startDate) }}</div>
            </div>
            <div class="detail-item">
              <div class="text-caption text-grey">⏰ Ngày kết thúc</div>
              <div class="font-weight-bold text-body-2">{{ formatDate(selectedCouponDetail.endDate) }}</div>
            </div>
          </div>

          <div v-if="selectedCouponDetail.description" class="mb-6 description-box">
            <div class="text-caption text-grey mb-2">📝 Mô tả</div>
            <div class="text-body-2">{{ selectedCouponDetail.description }}</div>
          </div>

          <v-divider class="my-4" />

          <div class="d-flex gap-2">
            <v-btn
              block
              variant="outlined"
              color="primary"
              size="large"
              icon="mdi-content-copy"
              @click="copyCouponCode(selectedCouponDetail.couponCode)"
            >
              Sao Chép Mã
            </v-btn>
            <v-btn
              block
              color="primary"
              size="large"
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

const getGradientBg = (type) => {
  return type === 'percent' 
    ? 'linear-gradient(135deg, #FF6B6B 0%, #FF8E72 100%)'
    : 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)'
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
/* Promotion Container */
.promotion-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  padding: 32px 0;
}

/* Enhanced Header Section */
.header-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 32px;
  color: white;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.25);
  position: relative;
  overflow: hidden;
}

.header-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 300px;
  height: 300px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
}

.header-section::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: 10%;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
}

.header-content {
  position: relative;
  z-index: 1;
}

.header-icon {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

/* Tabs Section */
.tabs-section {
  background: white;
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.custom-tabs {
  border-radius: 8px;
}

.tab-item {
  padding: 12px 24px;
  text-transform: none !important;
  font-weight: 500;
  letter-spacing: 0;
}

/* Card Container */
.coupon-card-wrapper {
  position: relative;
  height: 100%;
  transition: all 0.3s ease;
}

.coupon-card {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.coupon-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.15) !important;
}

/* Discount Badge */
.discount-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
  color: white;
  font-weight: bold;
  border: 3px solid white;
}

.discount-badge.percent {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E72 100%);
}

.discount-badge.fixed {
  background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
}

.badge-value {
  font-size: 28px;
  line-height: 1;
  font-weight: 700;
}

.badge-label {
  font-size: 10px;
  opacity: 0.9;
  margin-top: 4px;
  font-weight: 500;
}

/* Card Header */
.card-header {
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  position: relative;
}

.card-header::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%);
  pointer-events: none;
}

.card-header > * {
  position: relative;
  z-index: 1;
}

/* Info Box */
.info-box {
  background: linear-gradient(135deg, #F0F4FF 0%, #F5F3FF 100%);
  padding: 14px;
  border-radius: 12px;
  border-left: 4px solid #6366F1;
  transition: all 0.3s ease;
}

.info-box:hover {
  background: linear-gradient(135deg, #E8ECFF 0%, #EDEBFF 100%);
}

.info-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 16px;
  font-weight: 700;
}

/* Line Clamp */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
}

/* Claimed Card Styles */
.claimed-coupon-card {
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.claimed-coupon-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.15) !important;
}

.claimed-card-header {
  height: 120px;
  background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.claimed-card-header::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%);
  pointer-events: none;
}

.claimed-card-header > * {
  position: relative;
  z-index: 1;
}

.status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  z-index: 10;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.used {
  background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
}

.status-badge.claimed {
  background: linear-gradient(135deg, #FF9800 0%, #FFA726 100%);
}

.status-badge.expired {
  background: linear-gradient(135deg, #F44336 0%, #EF5350 100%);
}

.discount-info {
  background: linear-gradient(135deg, #F0F4FF 0%, #F5F3FF 100%);
  padding: 20px;
  border-radius: 12px;
  border-left: 4px solid #6366F1;
  transition: all 0.3s ease;
}

.discount-info:hover {
  background: linear-gradient(135deg, #E8ECFF 0%, #EDEBFF 100%);
}

.discount-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.discount-amount {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dates-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.date-item {
  padding: 12px;
  background: linear-gradient(135deg, #F5F5F5 0%, #FAFAFA 100%);
  border-radius: 8px;
  border-left: 3px solid #9C27B0;
  transition: all 0.3s ease;
}

.date-item:hover {
  background: linear-gradient(135deg, #EEEEEE 0%, #F5F5F5 100%);
}

.date-item .text-caption {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
}

.position-relative {
  position: relative;
}

/* Details Dialog */
.details-dialog::v-deep(.v-dialog__content) {
  align-items: flex-start;
  padding-top: 40px;
}

.details-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
}

.details-header {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 20px;
}

.details-badge {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 3px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.details-badge .badge-value {
  font-size: 32px;
  color: white;
  font-weight: 700;
}

.info-card {
  background: linear-gradient(135deg, #F0F4FF 0%, #F5F3FF 100%);
  padding: 20px;
  border-radius: 12px;
  border-left: 4px solid #6366F1;
}

.info-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-amount {
  font-size: 36px;
  font-weight: 700;
  background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.detail-item {
  padding: 12px;
  background: #F5F5F5;
  border-radius: 8px;
  border-left: 3px solid #6366F1;
  transition: all 0.3s ease;
}

.detail-item:hover {
  background: #EEEEEE;
  transform: translateY(-2px);
}

.description-box {
  background: linear-gradient(135deg, #FFF3E0 0%, #FFF9C4 100%);
  padding: 16px;
  border-radius: 12px;
  border-left: 4px solid #FF9800;
}

/* Delete Dialog */
.delete-dialog::v-deep(.v-dialog__content) {
  align-items: center;
}

.delete-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
}

.delete-header {
  padding: 32px 20px;
  text-align: center;
  background: linear-gradient(135deg, #F5F5F5 0%, #FAFAFA 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Empty State */
.empty-state {
  padding: 40px 20px;
}

.empty-state::v-deep(.v-empty-state__image) {
  opacity: 0.5;
}

/* Utility Classes */
.rounded-lg {
  border-radius: 12px;
}
</style>
