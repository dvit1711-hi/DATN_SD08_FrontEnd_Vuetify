<template>
  <div class="cart-page">
    <div class="page-header">
      <div>
        <p class="page-eyebrow">Order Detail</p>
        <h1 class="page-title">Chi tiết đơn hàng</h1>
      </div>

      <v-btn class="btn-outline" variant="outlined" prepend-icon="mdi-arrow-left" @click="goBack">
        Quay lại
      </v-btn>
    </div>

    <div v-if="!userStore.isLoggedIn" class="auth-notice">
      <i class="notice-icon">⚠</i>
      <div>
        <p class="notice-title">Bạn chưa đăng nhập</p>
        <p class="notice-sub">Vui lòng đăng nhập để xem chi tiết đơn hàng</p>
      </div>
      <button class="btn-outline" @click="router.push({ name: 'Login' })">Đăng nhập</button>
    </div>

    <template v-else>
      <div v-if="isLoading" class="loading-state">
        <v-progress-circular indeterminate color="black" size="36" width="2" />
      </div>

      <div v-else-if="!order" class="empty-state">
        <div class="empty-icon">
          <v-icon icon="mdi-package-variant-closed" size="40" />
        </div>
        <p class="empty-title">Đơn hàng không tồn tại</p>
        <p class="empty-sub">Không tìm thấy dữ liệu đơn hàng bạn đang xem</p>
        <button class="btn-primary" @click="goBack">Quay lại</button>
      </div>

      <div v-else>
        <div class="select-bar">
          <label class="select-all-label">
            <span>Đơn #{{ order.orderId }}</span>
          </label>
          <span class="select-count">{{ formatDate(order.orderDate) }}</span>
        </div>

        <v-card variant="outlined" class="detail-card mb-3">
          <v-card-text>
            <div class="d-flex align-center justify-space-between flex-wrap ga-3">
              <div>
                <div class="font-weight-bold detail-title">Đơn #{{ order.orderId }}</div>
                <div class="text-caption text-grey">{{ formatDate(order.orderDate) }}</div>
              </div>

              <div class="d-flex align-center ga-2 flex-wrap justify-end detail-badges">
                <v-chip size="x-small" :color="getDisplayStatus(order).color" variant="tonal">
                  {{ getDisplayStatus(order).label }}
                </v-chip>
                <v-chip size="x-small" :color="getPaymentStatusColor(order.paymentStatus)" variant="tonal">
                  {{ getPaymentStatusLabel(order.paymentStatus) }}
                </v-chip>
                <div class="font-weight-bold text-black detail-price">{{ formatPrice(order.totalAmount) }}đ</div>
                <v-btn v-if="canCancelOrder(order)" color="error" variant="outlined" size="x-small"
                  :loading="cancellingOrderId === order.orderId" @click="cancelOrder(order)">
                  Hủy đơn
                </v-btn>
              </div>
            </div>

            <div class="detail-meta-row">
              <span class="meta-tag">{{ getPaymentMethodLabel(order.paymentMethod) }}</span>
              <span v-if="order.couponCode" class="meta-tag">Mã: {{ order.couponCode }}</span>
              <span v-if="order.trackingCode" class="meta-tag">Vận đơn: {{ order.trackingCode }}</span>
            </div>
          </v-card-text>
        </v-card>

        <div class="detail-section">
          <OrderTimeline title="Lịch sử đơn hàng" :steps="getTrackingSteps(order)" :animated="false" />
        </div>

        <v-alert type="info" variant="tonal" density="comfortable" class="mb-3" icon="mdi-map-marker"
          title="Địa chỉ nhận hàng" :text="formatOrderAddress(order.shippingAddress)" />

        <v-card variant="outlined" class="order-items-card">
          <v-card-title class="order-items-head">
            <div class="text-subtitle-1 font-weight-bold">Danh sách sản phẩm</div>
            <v-chip color="primary" variant="tonal" size="small">{{ getOrderItems(order).length }} sản phẩm</v-chip>
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-0">
            <v-list lines="two" class="bg-grey-lighten-5">
              <v-list-item v-for="item in getOrderItems(order)" :key="item.orderDetailId" class="py-3">
                <template #prepend>
                  <v-avatar size="56" rounded="lg" class="mr-3">
                    <v-img :src="resolveOrderItemImageUrl(item.imageUrl)" cover />
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-bold">{{ item.productName || 'Sản phẩm' }}</v-list-item-title>

                <v-list-item-subtitle>
                  <div>
                    Màu: {{ item.colorName || '-' }} | Size: {{ item.sizeName || '-' }} | Giá: {{ formatPrice(item.price) }}đ
                  </div>

                  <div class="mt-1 d-flex align-center ga-2 flex-wrap">
                    <v-chip size="x-small" variant="tonal">Đã mua: {{ getBoughtQuantity(item) }}</v-chip>
                  </div>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import paymentApi from '@/api/paymentApi'
import OrderTimeline from '@/components/common/OrderTimeline.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const order = ref(null)
const isLoading = ref(false)
const cancellingOrderId = ref(null)

const IMAGE_BASE_URL = ''
const fallbackImage = 'https://via.placeholder.com/64x64?text=No+Image'

const ONLINE_SHIPPING_STARTED_KEY = 'adminOnlineShippingStartedOrderIds'
const UI_DELIVERED_ORDER_IDS_KEY = 'adminUiDeliveredOrderIds'

const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0))

const formatDate = (value) => {
  if (!value) return 'Không có dữ liệu'

  if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}/.test(value)) {
    return value
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString('vi-VN')
}

const resolveOrderItemImageUrl = (imageUrl) => {
  const value = String(imageUrl || '').trim()
  if (!value) return fallbackImage
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:') || value.startsWith('blob:')) return value
  return value.startsWith('/') ? `${IMAGE_BASE_URL}${value}` : `${IMAGE_BASE_URL}/${value}`
}

const getOrderItems = (o) => {
  const candidates = [o?.items, o?.orderItems, o?.details, o?.orderDetails, o?.orderDetailList]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
  }
  return []
}

const getBoughtQuantity = (item) => Number(item?.quantity || item?.qty || 0)

const loadIdSet = (key) => {
  try {
    const raw = localStorage.getItem(key)
    const parsed = JSON.parse(raw || '[]')
    return new Set(Array.isArray(parsed) ? parsed.map((value) => Number.parseInt(value, 10)).filter(Number.isFinite) : [])
  } catch {
    return new Set()
  }
}

const uiShippingStartedOrderIds = ref(new Set())
const uiDeliveredOrderIds = ref(new Set())

const reloadUiTimelineState = () => {
  uiShippingStartedOrderIds.value = loadIdSet(ONLINE_SHIPPING_STARTED_KEY)
  uiDeliveredOrderIds.value = loadIdSet(UI_DELIVERED_ORDER_IDS_KEY)
}

const isUiShippingStartedOrder = (o) => {
  const orderId = Number.parseInt(o?.orderId, 10)
  return Number.isFinite(orderId) && uiShippingStartedOrderIds.value.has(orderId)
}

const isUiDeliveredOrder = (o) => {
  const orderId = Number.parseInt(o?.orderId, 10)
  return Number.isFinite(orderId) && uiDeliveredOrderIds.value.has(orderId)
}

const isOnlinePaymentMethod = (o) => {
  const method = String(o?.paymentMethod || '').toUpperCase()
  return ['BANK_TRANSFER', 'BANKING', 'E_WALLET', 'VNPAY', 'MOMO'].includes(method)
}

const isCodPaymentMethod = (o) => {
  const method = String(o?.paymentMethod || '').toUpperCase()
  return method === 'COD' || method === 'CASH'
}

const getPaymentMethodLabel = (method) => {
  const normalized = String(method || '').toUpperCase()
  if (normalized === 'COD') return 'Thanh toán khi nhận hàng'
  if (normalized === 'CASH') return 'Tiền mặt'
  if (normalized === 'BANK_TRANSFER' || normalized === 'BANKING') return 'Chuyển khoản ngân hàng'
  if (normalized === 'E_WALLET') return 'Ví điện tử'
  if (normalized === 'VNPAY') return 'VNPay'
  if (normalized === 'MOMO') return 'MoMo'
  return 'Không xác định'
}

const getPaymentStatusLabel = (status) => {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'PAID') return 'Đã thanh toán'
  if (normalized === 'UNPAID') return 'Chưa thanh toán'
  if (normalized === 'CANCELLED') return 'Đã hủy'
  return 'Không xác định'
}

const getPaymentStatusColor = (status) => {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'PAID') return 'success'
  if (normalized === 'UNPAID') return 'warning'
  if (normalized === 'CANCELLED') return 'error'
  return 'info'
}

const formatOrderAddress = (shippingAddress) => {
  const value = String(shippingAddress || '').trim()
  return value.length > 0 ? value : 'Không có địa chỉ cho đơn này'
}

const getOnlineBaseSteps = () => [
  { code: 'WAIT_CONFIRM', label: 'Chờ xác nhận', icon: 'mdi-text-box-check-outline', time: '-' },
  { code: 'CONFIRMED', label: 'Đã xác nhận', icon: 'mdi-check-circle-outline', time: '-' },
  { code: 'TRANSFER_CONFIRM', label: 'Xác nhận thanh toán', icon: 'mdi-bank-check', time: '-' },
  { code: 'WAIT_SHIP', label: 'Chờ giao hàng', icon: 'mdi-package-variant-closed-check', time: '-' },
  { code: 'SHIPPING', label: 'Đang giao hàng', icon: 'mdi-truck-delivery-outline', time: '-' },
  { code: 'DELIVERED', label: 'Đã giao hàng', icon: 'mdi-truck-check-outline', time: '-' },
  { code: 'COMPLETED', label: 'Hoàn thành', icon: 'mdi-check-decagram-outline', time: '-' },
]

const getCodBaseSteps = () => [
  { code: 'WAIT_CONFIRM', label: 'Chờ xác nhận', icon: 'mdi-text-box-check-outline', time: '-' },
  { code: 'CONFIRMED', label: 'Đã xác nhận', icon: 'mdi-check-circle-outline', time: '-' },
  { code: 'WAIT_SHIP', label: 'Chờ giao hàng', icon: 'mdi-package-variant-closed-check', time: '-' },
  { code: 'SHIPPING', label: 'Đang giao hàng', icon: 'mdi-truck-delivery-outline', time: '-' },
  { code: 'DELIVERED', label: 'Đã giao hàng', icon: 'mdi-truck-check-outline', time: '-' },
  { code: 'TRANSFER_CONFIRM', label: 'Đã thanh toán', icon: 'mdi-cash-check', time: '-' },
  { code: 'COMPLETED', label: 'Hoàn thành', icon: 'mdi-check-decagram-outline', time: '-' },
]

const getTrackingSteps = (o) => {
  const orderStatus = String(o?.orderStatus || '').toUpperCase()
  const paymentStatus = String(o?.paymentStatus || '').toUpperCase()
  const createdTime = formatDate(o?.orderDate)
  const uiShippingStarted = isUiShippingStartedOrder(o)
  const uiDelivered = isUiDeliveredOrder(o)
  const baseSteps = isOnlinePaymentMethod(o) ? getOnlineBaseSteps() : getCodBaseSteps()

  if (orderStatus === 'CANCELLED' || paymentStatus === 'CANCELLED') {
    return [
      { ...baseSteps[0], state: 'done', time: createdTime },
      { code: 'CANCELLED', label: 'Đã hủy', icon: 'mdi-close-octagon-outline', time: createdTime, state: 'cancelled' },
    ]
  }

  if (orderStatus === 'RETURNED') {
    return [
      ...baseSteps.map((step, index) => ({ ...step, state: 'done', time: index === 0 ? createdTime : '-' })),
      { code: 'RETURNED', label: 'Hoàn hàng', icon: 'mdi-keyboard-return', time: createdTime, state: 'returned' },
    ]
  }

  let activeIndex = 0

  if (isOnlinePaymentMethod(o)) {
    if (orderStatus === 'PAID') {
      activeIndex = 6
    } else if (paymentStatus === 'PAID' && uiDelivered) {
      activeIndex = 5
    } else if (paymentStatus === 'PAID' && uiShippingStarted) {
      activeIndex = 4
    } else if (paymentStatus === 'PAID' || orderStatus === 'CONFIRMED') {
      activeIndex = 3
    }
  } else {
    if (orderStatus === 'PAID') {
      activeIndex = 6
    } else if (orderStatus === 'CONFIRMED') {
      activeIndex = 2
    } else if (orderStatus === 'SHIPPING' && uiShippingStarted && !uiDelivered) {
      activeIndex = 3
    } else if (orderStatus === 'SHIPPING' && uiDelivered && paymentStatus === 'UNPAID') {
      activeIndex = 4
    } else if (orderStatus === 'SHIPPING' && uiDelivered && paymentStatus === 'PAID') {
      activeIndex = 5
    }
  }

  return baseSteps.slice(0, activeIndex + 1).map((step, index) => {
    let state = 'pending'
    if (index < activeIndex) state = 'done'
    if (index === activeIndex) state = index === baseSteps.length - 1 ? 'done' : 'current'
    return { ...step, state, time: index === 0 || index <= activeIndex ? createdTime : '-' }
  })
}

const getDisplayStatus = (o) => {
  const orderStatus = String(o?.orderStatus || '').toUpperCase()
  const paymentStatus = String(o?.paymentStatus || '').toUpperCase()
  const uiShippingStarted = isUiShippingStartedOrder(o)
  const uiDelivered = isUiDeliveredOrder(o)

  if (orderStatus === 'CANCELLED' || paymentStatus === 'CANCELLED') return { label: 'Đã hủy', color: 'error' }
  if (orderStatus === 'RETURNED') return { label: 'Hoàn hàng', color: 'error' }
  if (orderStatus === 'PARTIAL_RETURNED') return { label: 'Trả hàng một phần', color: 'deep-orange' }
  if (orderStatus === 'PAID') return { label: 'Hoàn thành', color: 'success' }
  if (orderStatus === 'CONFIRMED') return { label: 'Chờ giao hàng', color: 'warning' }
  if (orderStatus === 'SHIPPING') {
    if (uiDelivered && paymentStatus === 'PAID') return { label: 'Chờ hoàn thành', color: 'success' }
    if (uiDelivered && paymentStatus === 'UNPAID') return { label: 'Chờ xác nhận thanh toán', color: 'warning' }
    if (uiDelivered) return { label: 'Đã giao hàng', color: 'warning' }
    if (uiShippingStarted) return { label: 'Đang giao hàng', color: 'primary' }
    return { label: 'Chờ giao hàng', color: 'warning' }
  }
  if (orderStatus === 'PENDING_PAYMENT' || orderStatus === 'PENDING') return { label: 'Chờ xác nhận', color: 'warning' }
  return { label: 'Không xác định', color: 'info' }
}

const goBack = () => router.back()

const canCancelOrder = (o) => {
  const orderStatus = String(o?.orderStatus || '').toUpperCase()
  const paymentStatus = String(o?.paymentStatus || '').toUpperCase()
  return orderStatus === 'PENDING_PAYMENT' && paymentStatus === 'UNPAID'
}

const cancelOrder = async (o) => {
  if (!canCancelOrder(o)) return
  const confirmed = window.confirm(`Bạn có chắc muốn hủy đơn #${o.orderId}?`)
  if (!confirmed) return

  const accountId = Number.parseInt(userStore.accountId, 10)
  if (!Number.isFinite(accountId) || accountId <= 0) return

  cancellingOrderId.value = o.orderId
  try {
    await paymentApi.cancelOrderByUser(accountId, o.orderId, userStore.token)
    order.value = {
      ...o,
      orderStatus: 'CANCELLED',
      paymentStatus: 'CANCELLED',
    }
  } catch (error) {
    console.error('Lỗi hủy đơn hàng:', error)
  } finally {
    cancellingOrderId.value = null
  }
}

const loadOrderDetail = async () => {
  const id = String(route.params.id || '').trim()
  if (!id) return

  if (!userStore.isLoggedIn) {
    order.value = null
    return
  }

  isLoading.value = true
  try {
    reloadUiTimelineState()

    const token = userStore.token
    const accountId = Number.parseInt(userStore.accountId, 10)
    let ordersList = []

    if (Number.isFinite(accountId) && accountId > 0) {
      try {
        const accountRes = await paymentApi.getOrdersByAccount(accountId, token)
        ordersList = Array.isArray(accountRes.data) ? accountRes.data : []
      } catch (accountError) {
        console.warn('Không tải được đơn theo tài khoản, thử tải toàn bộ danh sách:', accountError)
      }
    }

    if (ordersList.length === 0) {
      const allRes = await paymentApi.getAllOrders(token)
      ordersList = Array.isArray(allRes.data) ? allRes.data : []
    }

    const found = ordersList.find((item) => String(item?.orderId) === id)
    order.value = found ? { ...found } : null
  } catch (error) {
    console.error('Lỗi tải chi tiết đơn hàng:', error)
    order.value = null
  } finally {
    isLoading.value = false
  }
}

onMounted(loadOrderDetail)
</script>

<style scoped>
.cart-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
  font-family: inherit;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 2.5rem;
}

.page-eyebrow {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.4);
  font-weight: 500;
  margin-bottom: 4px;
}

.page-title {
  font-size: 26px;
  font-weight: 500;
  letter-spacing: -0.02em;
}

.auth-notice {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border: 0.5px solid rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  background: #fff;
}

.notice-icon { font-size: 20px; }
.notice-title { font-size: 14px; font-weight: 500; }
.notice-sub { font-size: 12px; color: rgba(0,0,0,0.45); margin-top: 2px; }

.loading-state {
  display: flex;
  justify-content: center;
  padding: 5rem 0;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  background: #fff;
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.empty-title { font-size: 16px; font-weight: 500; margin-bottom: 6px; }
.empty-sub { font-size: 13px; color: rgba(0,0,0,0.45); margin-bottom: 20px; }

.select-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  background: #fff;
  margin-bottom: 10px;
}

.select-all-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  cursor: pointer;
  user-select: none;
}

.select-count {
  font-size: 11px;
  color: rgba(0,0,0,0.4);
  letter-spacing: 0.02em;
}

.detail-card {
  background: #fff;
  border: 0.5px solid rgba(0, 0, 0, 0.1) !important;
  border-radius: 12px;
}

.detail-title {
  font-size: 14px;
}

.detail-badges {
  gap: 8px !important;
}

.detail-price {
  font-size: 1rem;
  white-space: nowrap;
}

.detail-meta-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: rgba(0,0,0,0.5);
  background: rgba(0,0,0,0.04);
  border-radius: 4px;
  padding: 3px 8px;
}

.detail-section {
  background: #fff;
  border: 0.5px solid rgba(0,0,0,0.1);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.order-items-card {
  overflow: hidden;
  border-color: rgba(0, 0, 0, 0.1) !important;
}

.order-items-head {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:16px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-primary:hover:not(:disabled) { opacity: 0.8; }
.btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }

.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 11px 24px;
  background: transparent;
  color: #000;
  border: 0.5px solid rgba(0,0,0,0.25);
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-outline:hover { background: rgba(0,0,0,0.04); }

@media (max-width: 600px) {
  .page-header {
    align-items: flex-start;
  }

  .detail-badges {
    justify-content: flex-start;
  }
}
</style>
