<template>
  <v-container class="promotion-container" fluid>
    <!-- HEADER -->
    <div class="header-section">
      <div class="header-content">
        <div class="section-label">
        </div>

        <h1>Khuyến mãi & mã giảm giá</h1>

        <p>
          Nhận các mã giảm giá mới nhất và sử dụng khi thanh toán đơn hàng của bạn
        </p>
      </div>
    </div>

    <!-- TABS -->
    <div class="tabs-section">
      <v-tabs
        v-model="activeTab"
        class="custom-tabs"
        slider-color="black"
      >
        <v-tab value="available" class="tab-item">
          Mã khả dụng
        </v-tab>

        <v-tab value="claimed" class="tab-item">
          Mã đã nhận
        </v-tab>
      </v-tabs>
    </div>

    <!-- LOADING -->
    <div
      v-if="isLoading"
      class="d-flex justify-center py-16"
    >
      <v-progress-circular
        indeterminate
        color="black"
        size="40"
      />
    </div>

    <!-- AVAILABLE -->
    <div v-else-if="activeTab === 'available'">
      <v-row>
        <v-col
          v-for="coupon in validAvailableCoupons"
          :key="coupon.id"
          cols="12"
          md="6"
          lg="4"
        >
          <v-card
            class="coupon-card"
            elevation="0"
          >
            <!-- TOP -->
            <div class="card-top">
              <div class="coupon-code">
                {{ coupon.couponCode }}
              </div>

              <div class="discount-badge">
                {{
                  coupon.discountType === 'percent'
                    ? `${coupon.discountValue}%`
                    : `${formatPrice(coupon.discountValue)}đ`
                }}
              </div>
            </div>

            <!-- BODY -->
            <v-card-text class="card-body">
              <div class="coupon-name">
                {{ coupon.name }}
              </div>

              <div class="coupon-meta">
                <div class="meta-item">
                  <span>Đơn tối thiểu</span>

                  <strong>
                    {{ formatPrice(coupon.minOrderValue) }}đ
                  </strong>
                </div>

                <div class="meta-item">
                  <span>Hết hạn sau</span>

                  <strong>
                    {{ daysUntilExpiry(coupon.endDate) }} ngày
                  </strong>
                </div>
              </div>

              <div class="coupon-actions">
                <v-btn
                  variant="outlined"
                  color="black"
                  size="large"
                  @click="showCouponDetails(coupon)"
                >
                  Chi tiết
                </v-btn>

                <v-btn
                  variant="flat"
                  color="black"
                  size="large"
                  :disabled="isUserClaimedThisCoupon(coupon.id)"
                  :loading="claimingId === coupon.id"
                  @click="claimCoupon(coupon)"
                >
                  {{
                    isUserClaimedThisCoupon(coupon.id)
                      ? 'Đã nhận'
                      : 'Nhận mã'
                  }}
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- CLAIMED -->
    <div v-else-if="activeTab === 'claimed'">
      <v-row>
        <v-col
          v-for="userCoupon in validClaimedCoupons"
          :key="userCoupon.id"
          cols="12"
          md="6"
          lg="4"
        >
          <v-card
            class="coupon-card"
            elevation="0"
          >
            <div class="claimed-status">
              {{ getStatusLabel(userCoupon.status) }}
            </div>

            <div class="card-top">
              <div class="coupon-code">
                {{ userCoupon.discountCoupon.couponCode }}
              </div>
            </div>

            <v-card-text class="card-body">
              <div class="coupon-name">
                {{
                  userCoupon.discountCoupon.discountType === 'percent'
                    ? `${userCoupon.discountCoupon.discountValue}%`
                    : `${formatPrice(userCoupon.discountCoupon.discountValue)}đ`
                }}
              </div>

              <div class="coupon-meta">
                <div class="meta-item">
                  <span>Ngày nhận</span>

                  <strong>
                    {{ formatDate(userCoupon.claimedDate) }}
                  </strong>
                </div>

                <div class="meta-item">
                  <span>Hết hạn</span>

                  <strong>
                    {{ formatDate(userCoupon.discountCoupon.endDate) }}
                  </strong>
                </div>
              </div>

              <div class="coupon-actions">
                <v-btn
                  variant="outlined"
                  color="black"
                  size="large"
                  @click="copyCouponCode(userCoupon.discountCoupon.couponCode)"
                >
                  Sao chép
                </v-btn>

                <v-btn
                  variant="flat"
                  color="black"
                  size="large"
                  @click="removeCoupon(userCoupon.id)"
                >
                  Xóa
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- DIALOG CHI TIẾT -->
    <v-dialog
      v-model="showDetailsDialog"
      width="520"
    >
      <v-card
        v-if="selectedCouponDetail"
        class="details-card"
      >
        <v-card-text class="pa-8">
          <div class="dialog-top">
            <div>
              <div class="dialog-label">
                Mã giảm giá
              </div>

              <div class="dialog-code">
                {{ selectedCouponDetail.couponCode }}
              </div>
            </div>

            <v-btn
              icon="mdi-close"
              variant="text"
              @click="showDetailsDialog = false"
            />
          </div>

          <div class="dialog-price">
            {{
              selectedCouponDetail.discountType === 'percent'
                ? `${selectedCouponDetail.discountValue}%`
                : `${formatPrice(selectedCouponDetail.discountValue)}đ`
            }}
          </div>

          <div class="dialog-grid">
            <div class="dialog-item">
              <span>Đơn tối thiểu</span>

              <strong>
                {{ formatPrice(selectedCouponDetail.minOrderValue) }}đ
              </strong>
            </div>

            <div class="dialog-item">
              <span>Số lượng</span>

              <strong>
                {{ selectedCouponDetail.quantity }}
              </strong>
            </div>

            <div class="dialog-item">
              <span>Ngày bắt đầu</span>

              <strong>
                {{ formatDate(selectedCouponDetail.startDate) }}
              </strong>
            </div>

            <div class="dialog-item">
              <span>Ngày kết thúc</span>

              <strong>
                {{ formatDate(selectedCouponDetail.endDate) }}
              </strong>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- SNACKBAR -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      timeout="3000"
    >
      {{ snackbarMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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

/* DIALOG */
const showDetailsDialog = ref(false)
const selectedCouponDetail = ref(null)

const showCouponDetails = (coupon) => {
  selectedCouponDetail.value = coupon
  showDetailsDialog.value = true
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN').format(price || 0)
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('vi-VN')
}

const isExpired = (endDate) => {
  if (!endDate) return false

  const today = new Date()
  const end = new Date(endDate)

  today.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  return end < today
}

const daysUntilExpiry = (endDate) => {
  if (!endDate) return 0

  const today = new Date()
  const end = new Date(endDate)

  const diffTime = end - today

  return Math.max(
    0,
    Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  )
}

const validAvailableCoupons = computed(() => {
  return availableCoupons.value.filter(
    coupon => !isExpired(coupon.endDate)
  )
})

const validClaimedCoupons = computed(() => {
  return claimedCoupons.value.filter(
    coupon => !isExpired(coupon.discountCoupon?.endDate)
  )
})

const getStatusLabel = (status) => {
  const labels = {
    claimed: 'Đã nhận',
    used: 'Đã dùng',
    expired: 'Hết hạn'
  }

  return labels[status] || status
}

const isUserClaimedThisCoupon = (couponId) => {
  return claimedCoupons.value.some(
    item => item.discountCoupon?.id === couponId
  )
}

const loadAvailableCoupons = async () => {
  try {
    const res = await userDiscountCouponApi.getAvailableDiscountCoupons()
    availableCoupons.value = res.data || []
  } catch (error) {
    snackbarMessage.value = 'Không thể tải mã giảm giá'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  }
}

const loadClaimedCoupons = async () => {
  const accountId = Number.parseInt(userStore.accountId)

  if (!accountId) return

  try {
    const res =
      await userDiscountCouponApi.getUserDiscountCoupons(accountId)

    claimedCoupons.value = res.data || []
  } catch (error) {
    console.error(error)
  }
}

const claimCoupon = async (coupon) => {
  const accountId = Number.parseInt(userStore.accountId)

  if (!accountId) return

  claimingId.value = coupon.id

  try {
    await userDiscountCouponApi.claimDiscountCoupon(
      accountId,
      coupon.id
    )

    snackbarMessage.value = 'Nhận mã thành công'
    snackbarColor.value = 'success'
    showSnackbar.value = true

    await loadClaimedCoupons()
  } catch (error) {
    snackbarMessage.value =
      error.response?.data || 'Không thể nhận mã'

    snackbarColor.value = 'error'
    showSnackbar.value = true
  } finally {
    claimingId.value = null
  }
}

const copyCouponCode = async (code) => {
  await navigator.clipboard.writeText(code)

  snackbarMessage.value = 'Đã sao chép mã'
  snackbarColor.value = 'success'
  showSnackbar.value = true
}

const removeCoupon = async (id) => {
  try {
    await userDiscountCouponApi.deleteUserDiscountCoupon(id)

    snackbarMessage.value = 'Xóa mã thành công'
    snackbarColor.value = 'success'
    showSnackbar.value = true

    await loadClaimedCoupons()
  } catch (error) {
    snackbarMessage.value = 'Không thể xóa mã'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  }
}

onMounted(async () => {
  isLoading.value = true

  await Promise.all([
    loadAvailableCoupons(),
    loadClaimedCoupons()
  ])

  isLoading.value = false
})
</script>

<style scoped>
.promotion-container {
  min-height: 100vh;
  background: #f6f6f6;
  max-width: 1440px;
  margin: 0 auto;
  padding: 40px 48px 60px;
}

/* HEADER */
.header-section {
  padding-left: 60px;
  padding-right: 60px;
  margin-bottom: 32px;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 2px;
  color: #999;
  margin-bottom: 14px;
}

.header-content h1 {
  font-size: 42px;
  font-weight: 700;
  color: #111;
  margin-bottom: 14px;
  letter-spacing: -1px;
}

.header-content p {
  font-size: 15px;
  line-height: 1.7;
  color: #666;
}

/* TABS */
.tabs-section {
  margin-bottom: 40px;
  padding-left: 0;
  padding-right: 0;
}

.custom-tabs {
  background: white;
  border: 1px solid #ececec;
  border-radius: 20px;
  padding: 10px;
  height: 70px;
}

.custom-tabs :deep(.v-tabs-bar) {
  height: 70px;
}

.custom-tabs :deep(.v-tabs-bar__content) {
  height: 70px;
}

.tab-item {
  text-transform: none !important;
  font-weight: 600;
  font-size: 16px !important;
  height: 50px !important;
}

/* CARD */
.coupon-card {
  background: white;
  border-radius: 24px;
  border: 1px solid #ebebeb;
  overflow: hidden;
  transition: 0.2s ease;
}

.coupon-card:hover {
  transform: translateY(-4px);
  border-color: #d7d7d7;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28px 28px 0;
}

.coupon-code {
  font-size: 30px;
  font-weight: 700;
  color: #111;
}

.discount-badge,
.claimed-status {
  background: #111;
  color: white;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 600;
}

.card-body {
  padding: 22px 28px 28px !important;
}

.coupon-name {
  font-size: 15px;
  color: #666;
  margin-bottom: 26px;
}

.coupon-meta {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 28px;
}

.meta-item {
  background: #fafafa;
  border: 1px solid #efefef;
  border-radius: 14px;
  padding: 15px 16px;
}

.meta-item span {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 6px;
}

.meta-item strong {
  font-size: 15px;
  font-weight: 600;
  color: #111;
}

.coupon-actions {
  display: flex;
  gap: 12px;
}

.v-btn {
  text-transform: none !important;
  border-radius: 14px !important;
  box-shadow: none !important;
  height: 46px !important;
  font-weight: 600 !important;
}

/* DIALOG */
.details-card {
  border-radius: 28px;
}

.dialog-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 28px;
}

.dialog-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.dialog-code {
  font-size: 30px;
  font-weight: 700;
  color: #111;
}

.dialog-price {
  font-size: 52px;
  font-weight: 700;
  color: #111;
  margin-bottom: 28px;
}

.dialog-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.dialog-item {
  background: #fafafa;
  border: 1px solid #efefef;
  border-radius: 14px;
  padding: 16px;
}

.dialog-item span {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.dialog-item strong {
  font-size: 14px;
  color: #111;
}

/* MOBILE */
@media (max-width: 768px) {
  .promotion-container {
    padding: 20px 16px 50px;
  }

  .header-section,
  .tabs-section {
    padding-left: 0;
    padding-right: 0;
  }

  .header-content h1 {
    font-size: 28px;
  }

  .coupon-code {
    font-size: 24px;
  }

  .coupon-actions {
    flex-direction: column;
  }

  .dialog-grid {
    grid-template-columns: 1fr;
  }

  .dialog-price {
    font-size: 38px;
  }
}
</style>