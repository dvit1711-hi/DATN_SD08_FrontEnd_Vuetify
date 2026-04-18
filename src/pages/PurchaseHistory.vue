<template>
  <v-container class="py-8" fluid>
    <div class="mb-6 d-flex align-center justify-space-between flex-wrap ga-3">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Lịch sử mua hàng</h1>
        <p class="text-subtitle-1 text-grey">Theo dõi trạng thái đơn và thanh toán của bạn</p>
      </div>
      <v-btn color="black" variant="outlined" prepend-icon="mdi-refresh" @click="loadOrders">
        Làm mới
      </v-btn>
    </div>

    <v-alert v-if="!isLoggedIn" type="warning" variant="tonal" class="mb-6">
      Vui lòng đăng nhập để xem lịch sử mua hàng.
      <template #append>
        <v-btn color="warning" variant="flat" @click="goLogin">Đăng nhập</v-btn>
      </template>
    </v-alert>

    <div v-else>
      <v-empty-state
        v-if="!isLoading && orders.length === 0"
        title="Chưa có đơn hàng"
        text="Bạn chưa tạo đơn nào. Hãy mua sắm ngay"
        icon="mdi-package-variant-closed-remove"
      >
        <template #actions>
          <v-btn color="primary" @click="goProducts">Tiếp tục mua sắm</v-btn>
        </template>
      </v-empty-state>

      <v-expansion-panels v-else variant="accordion">
        <v-expansion-panel v-for="order in orders" :key="order.orderId" class="mb-3">
          <v-expansion-panel-title>
            <div class="w-100 order-summary">
              <div class="d-flex align-center justify-space-between flex-wrap ga-2">
                <div>
                  <div class="font-weight-bold">Đơn #{{ order.orderId }}</div>
                  <div class="text-caption text-grey">{{ formatDate(order.orderDate) }}</div>
                </div>

                <div class="d-flex align-center ga-2 flex-wrap justify-end">
                  <v-chip size="small" :color="getDisplayStatus(order).color" variant="tonal">
                    {{ getDisplayStatus(order).label }}</v-chip>
                  <v-chip v-if="order.couponCode" size="small" color="orange" variant="tonal">
                    Mã: {{ order.couponCode }}
                  </v-chip>
                  <v-chip size="small" color="orange" variant="tonal">
                    {{ getPaymentMethodLabel(order.paymentMethod) }}
                  </v-chip>
                  <div class="font-weight-bold text-black">{{ formatPrice(order.totalAmount) }}đ</div>
                </div>
              </div>

              <div class="order-preview mt-3">
                <div class="order-preview-label text-caption text-grey">Ảnh sản phẩm</div>
                <div class="order-preview-images">
                  <template v-if="getOrderPreviewItems(order).length > 0">
                    <v-avatar
                      v-for="(item, index) in getOrderPreviewItems(order)"
                      :key="`${order.orderId}-${item.orderDetailId || index}`"
                      size="44"
                      rounded="lg"
                      class="order-preview-avatar"
                    >
                      <v-img :src="item.imageUrl || fallbackImage" cover />
                    </v-avatar>

                    <div
                      v-if="getOrderPreviewOverflowCount(order) > 0"
                      class="order-preview-avatar order-preview-avatar--more"
                    >
                      +{{ getOrderPreviewOverflowCount(order) }}
                    </div>
                  </template>

                  <div v-else class="text-caption text-grey">Không có ảnh sản phẩm</div>
                </div>
              </div>
            </div>
          </v-expansion-panel-title>

          <v-expansion-panel-text>
            <v-card variant="tonal" color="grey-lighten-4" class="mb-3 tracking-card">
              <v-card-title class="text-subtitle-1 py-3">Theo dõi đơn hàng</v-card-title>
              <v-card-text class="pt-0">
                <div class="tracking-scroll">
                  <div class="tracking-row" :style="trackingWidthStyle(order)">
                    <div
                      v-for="(step, index) in getTrackingSteps(order)"
                      :key="`${order.orderId}-${step.code}-${index}`"
                      class="tracking-step"
                    >
                      <div class="tracking-icon" :class="`tracking-icon--${step.state}`">
                        <v-icon size="18">{{ step.icon }}</v-icon>
                      </div>

                      <div
                        v-if="index < getTrackingSteps(order).length - 1"
                        class="tracking-connector"
                        :class="connectorClass(getTrackingSteps(order)[index + 1])"
                      />

                      <div class="tracking-label">{{ step.label }}</div>
                      <div class="tracking-time">{{ step.time }}</div>
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <v-alert
              type="info"
              variant="tonal"
              density="comfortable"
              class="mb-3"
              icon="mdi-map-marker"
              title="Địa chỉ nhận hàng"
              :text="formatOrderAddress(order.shippingAddress)"
            />

            <div class="d-flex justify-end mb-3">
              <v-btn
                v-if="canCancelOrder(order)"
                color="error"
                variant="outlined"
                size="small"
                :loading="cancellingOrderId === order.orderId"
                @click="cancelOrder(order)"
              >
                Hủy đơn hàng
              </v-btn>
            </div>

            <v-list lines="two" class="bg-grey-lighten-5 rounded-lg">
              <v-list-item v-for="item in order.items" :key="item.orderDetailId" class="py-2">
                <template #prepend>
                  <v-avatar size="52" rounded="lg" class="mr-3">
                    <v-img :src="item.imageUrl || fallbackImage" cover />
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-medium">{{ item.productName }}</v-list-item-title>
                <v-list-item-subtitle>
                  Màu: {{ item.colorName || 'Không xác định' }} | Số lượng: {{ item.quantity }} | Giá: {{ formatPrice(item.price) }}đ
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>

    <div v-if="isLoading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" size="46" />
    </div>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import paymentApi from '@/api/paymentApi'

const router = useRouter()
const userStore = useUserStore()

const orders = ref([])
const isLoading = ref(false)
const cancellingOrderId = ref(null)
const uiShippingStartedOrderIds = ref(new Set())
const uiDeliveredOrderIds = ref(new Set())
const fallbackImage = 'https://via.placeholder.com/64x64?text=No+Image'
const ONLINE_CONFIRMED_ORDERS_KEY = 'onlineTransferConfirmedOrderIds'
const HIDDEN_CANCELLED_ONLINE_ORDERS_KEY = 'hiddenCancelledOnlineOrderIds'
const ADMIN_ONLINE_SHIPPING_STARTED_KEY = 'adminOnlineShippingStartedOrderIds'
const ADMIN_UI_DELIVERED_ORDER_IDS_KEY = 'adminUiDeliveredOrderIds'

const isLoggedIn = computed(() => userStore.isLoggedIn)

const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(value || 0)
const getOrderPreviewItems = (order, limit = 4) => {
  const items = Array.isArray(order?.items) ? order.items : []
  return items.slice(0, limit)
}

const getOrderPreviewOverflowCount = (order, limit = 4) => {
  const items = Array.isArray(order?.items) ? order.items : []
  return Math.max(items.length - limit, 0)
}

const formatOrderAddress = (shippingAddress) => {
  const value = String(shippingAddress || '').trim()
  return value.length > 0 ? value : 'Không có địa chỉ cho đơn này'
}

const formatDate = (value) => {
  if (!value) return 'Không có dữ liệu'

  if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}/.test(value)) {
    return value
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString('vi-VN')
}

const getPaymentStatusLabel = (status) => {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'PAID') return 'Đã thanh toán'
  if (normalized === 'UNPAID') return 'Chưa thanh toán'
  if (normalized === 'CANCELLED') return 'Đã hủy'
  return 'Không xác định'
}

const getOrderStatusLabel = (status) => {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'PENDING_PAYMENT') return 'Chờ xác nhận'
  if (normalized === 'SHIPPING') return 'Đang giao hàng'
  if (normalized === 'PAID') return 'Hoàn thành'
  if (normalized === 'CANCELLED') return 'Đã hủy'
  return 'Không xác định'
}

const getDisplayStatus = (order) => {
  const orderStatus = String(order?.orderStatus || '').toUpperCase()
  const paymentStatus = String(order?.paymentStatus || '').toUpperCase()
  const uiShippingStarted = isUiShippingStartedOrder(order)
  const uiDelivered = isUiDeliveredOrder(order)

  if (orderStatus === 'CANCELLED' || paymentStatus === 'CANCELLED') {
    return { label: 'Đã hủy', color: 'error' }
  }
  if (orderStatus === 'PAID') {
    return { label: 'Hoàn thành', color: 'success' }
  }
  if (orderStatus === 'SHIPPING') {
    if (uiDelivered) return { label: 'Đã giao hàng', color: 'warning' }
    if (uiShippingStarted) return { label: 'Đang giao hàng', color: 'primary' }
    return { label: 'Chờ giao hàng', color: 'warning' }
  }
  if (isOnlinePaymentMethod(order) && orderStatus === 'PENDING_PAYMENT' && paymentStatus === 'PAID') {
    return { label: 'Chờ giao hàng', color: 'warning' }
  }
  if (paymentStatus === 'PAID' && isCodPaymentMethod(order)) {
    return { label: 'Xác nhận thanh toán', color: 'warning' }
  }
  if (paymentStatus === 'UNPAID' || orderStatus === 'PENDING_PAYMENT') {
    return { label: 'Chờ xác nhận', color: 'warning' }
  }

  return { label: 'Không xác định', color: 'info' }
}

const getPaymentMethodLabel = (method) => {
  const normalized = String(method || '').toUpperCase()
  if (normalized === 'COD') return 'Thanh toán khi nhận hàng'
  if (normalized === 'BANK_TRANSFER') return 'Chuyển khoản ngân hàng'
  if (normalized === 'E_WALLET') return 'Ví điện tử'
  return 'Không xác định'
}

const isOnlinePaymentMethod = (order) => {
  const method = String(order?.paymentMethod || '').toUpperCase()
  return method === 'BANK_TRANSFER' || method === 'E_WALLET' || method === 'BANKING'
}

const isCodPaymentMethod = (order) => {
  const method = String(order?.paymentMethod || '').toUpperCase()
  return method === 'COD' || method === 'CASH'
}

const loadIdSet = (key) => {
  try {
    const raw = localStorage.getItem(key)
    const parsed = JSON.parse(raw || '[]')
    return new Set(
      Array.isArray(parsed)
        ? parsed.map((value) => Number.parseInt(value, 10)).filter(Number.isFinite)
        : []
    )
  } catch {
    return new Set()
  }
}

const reloadUiTimelineState = () => {
  uiShippingStartedOrderIds.value = loadIdSet(ADMIN_ONLINE_SHIPPING_STARTED_KEY)
  uiDeliveredOrderIds.value = loadIdSet(ADMIN_UI_DELIVERED_ORDER_IDS_KEY)
}

const isUiShippingStartedOrder = (order) => {
  const orderId = Number.parseInt(order?.orderId, 10)
  return Number.isFinite(orderId) && uiShippingStartedOrderIds.value.has(orderId)
}

const isUiDeliveredOrder = (order) => {
  const orderId = Number.parseInt(order?.orderId, 10)
  return Number.isFinite(orderId) && uiDeliveredOrderIds.value.has(orderId)
}

const getTrackingSteps = (order) => {
  const orderStatus = String(order?.orderStatus || '').toUpperCase()
  const paymentStatus = String(order?.paymentStatus || '').toUpperCase()
  const createdTime = formatDate(order?.orderDate)
  const uiShippingStarted = isUiShippingStartedOrder(order)
  const uiDelivered = isUiDeliveredOrder(order)
  const codFinalActionPending = isCodPaymentMethod(order) && paymentStatus === 'PAID' && uiDelivered && orderStatus !== 'PAID'

  const onlineSteps = [
    { code: 'WAIT_CONFIRM', label: 'Chờ xác nhận', icon: 'mdi-text-box-check-outline', time: '-' },
    { code: 'TRANSFER_CONFIRM', label: 'Xác nhận thanh toán', icon: 'mdi-bank-check', time: '-' },
    { code: 'WAIT_SHIP', label: 'Chờ giao hàng', icon: 'mdi-package-variant-closed-check', time: '-' },
    { code: 'SHIPPING', label: 'Đang giao hàng', icon: 'mdi-truck-delivery-outline', time: '-' },
    { code: 'DELIVERED', label: 'Đã giao hàng', icon: 'mdi-truck-check-outline', time: '-' },
    { code: 'COMPLETED', label: 'Hoàn thành', icon: 'mdi-check-decagram-outline', time: '-' },
  ]

  const codSteps = [
    { code: 'WAIT_CONFIRM', label: 'Chờ xác nhận', icon: 'mdi-text-box-check-outline', time: '-' },
    { code: 'WAIT_SHIP', label: 'Chờ giao hàng', icon: 'mdi-package-variant-closed-check', time: '-' },
    { code: 'SHIPPING', label: 'Đang giao hàng', icon: 'mdi-truck-delivery-outline', time: '-' },
    { code: 'DELIVERED', label: 'Đã giao hàng', icon: 'mdi-truck-check-outline', time: '-' },
    { code: 'TRANSFER_CONFIRM', label: 'Xác nhận thanh toán', icon: 'mdi-bank-check', time: '-' },
    { code: 'COMPLETED', label: 'Hoàn thành', icon: 'mdi-check-decagram-outline', time: '-' },
  ]

  const baseSteps = isOnlinePaymentMethod(order) ? onlineSteps : codSteps

  if (orderStatus === 'CANCELLED' || paymentStatus === 'CANCELLED') {
    return [
      { ...baseSteps[0], state: 'done', time: createdTime },
      {
        code: 'CANCELLED',
        label: 'Đã hủy',
        icon: 'mdi-close-octagon-outline',
        time: createdTime,
        state: 'cancelled',
      },
    ]
  }

  let activeIndex = 0

  if (isOnlinePaymentMethod(order)) {
    if (orderStatus === 'PAID') {
      activeIndex = 5
    } else if (paymentStatus === 'UNPAID' && orderStatus === 'PENDING_PAYMENT') {
      activeIndex = 0
    } else if (paymentStatus === 'PAID' && !uiShippingStarted) {
      activeIndex = 2
    } else if (paymentStatus === 'PAID' && uiShippingStarted && !uiDelivered) {
      activeIndex = 3
    } else if (paymentStatus === 'PAID' && uiDelivered) {
      activeIndex = 4
    }
  } else {
    if (orderStatus === 'PAID') {
      activeIndex = 5
    } else if (paymentStatus === 'UNPAID' && orderStatus === 'PENDING_PAYMENT') {
      activeIndex = 0
    } else if (paymentStatus === 'PAID' && orderStatus === 'SHIPPING' && uiShippingStarted && !uiDelivered) {
      activeIndex = 2
    } else if (paymentStatus === 'PAID' && orderStatus === 'SHIPPING' && uiDelivered) {
      activeIndex = 4
    } else if (orderStatus === 'SHIPPING' && uiShippingStarted && !uiDelivered && paymentStatus === 'UNPAID') {
      activeIndex = 2
    } else if (uiDelivered && paymentStatus === 'UNPAID') {
      activeIndex = 4
    }
  }

  return baseSteps.map((step, index) => {
    let state = 'pending'
    if (index < activeIndex) state = 'done'
    if (index === activeIndex) state = codFinalActionPending ? 'current' : index === baseSteps.length - 1 ? 'done' : 'current'

    return {
      ...step,
      state,
      time: index === 0 || (index === baseSteps.length - 1 && (state === 'done' || codFinalActionPending)) ? createdTime : '-',
    }
  })
}

const connectorClass = (nextStep) => {
  if (!nextStep) return 'tracking-connector--pending'
  if (nextStep.state === 'done') return 'tracking-connector--done'
  if (nextStep.state === 'current') return 'tracking-connector--current'
  if (nextStep.state === 'cancelled') return 'tracking-connector--cancelled'
  return 'tracking-connector--pending'
}

const trackingWidthStyle = (order) => {
  const count = Math.max(getTrackingSteps(order).length, 1)
  return { minWidth: `${count * 160}px` }
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

const getHiddenCancelledOnlineOrderIds = () => {
  try {
    const raw = localStorage.getItem(HIDDEN_CANCELLED_ONLINE_ORDERS_KEY)
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed.map((x) => Number.parseInt(x, 10)).filter(Number.isFinite) : []
  } catch {
    return []
  }
}

const getOrderSortTime = (order) => {
  const value = String(order?.orderDate || '').trim()

  if (value) {
    const ddMmYyyyMatch = value.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
    )

    if (ddMmYyyyMatch) {
      const [, day, month, year, hour = '0', minute = '0', second = '0'] = ddMmYyyyMatch
      const parsedTime = new Date(
        Number.parseInt(year, 10),
        Number.parseInt(month, 10) - 1,
        Number.parseInt(day, 10),
        Number.parseInt(hour, 10),
        Number.parseInt(minute, 10),
        Number.parseInt(second, 10)
      ).getTime()

      if (Number.isFinite(parsedTime)) {
        return parsedTime
      }
    }

    const parsedTime = new Date(value).getTime()
    if (Number.isFinite(parsedTime)) {
      return parsedTime
    }
  }

  const orderId = Number.parseInt(order?.orderId, 10)
  return Number.isFinite(orderId) ? orderId : 0
}

const loadOrders = async () => {
  if (!isLoggedIn.value) {
    orders.value = []
    return
  }

  const accountId = Number.parseInt(userStore.accountId, 10)
  if (!Number.isFinite(accountId) || accountId <= 0) {
    orders.value = []
    return
  }

  isLoading.value = true
  try {
    reloadUiTimelineState()
    const res = await paymentApi.getOrdersByAccount(accountId, userStore.token)
    const allOrders = res.data || []
    const confirmedOnlineOrderIds = new Set(getOnlineConfirmedOrderIds())
    const hiddenCancelledOnlineOrderIds = new Set(getHiddenCancelledOnlineOrderIds())
    orders.value = allOrders
      .filter((order) => {
        const orderId = Number.parseInt(order?.orderId, 10)
        if (Number.isFinite(orderId) && hiddenCancelledOnlineOrderIds.has(orderId)) {
          return false
        }

        const method = String(order?.paymentMethod || '').toUpperCase()
        const paymentStatus = String(order?.paymentStatus || '').toUpperCase()
        if (method !== 'BANK_TRANSFER' || paymentStatus !== 'UNPAID') {
          return true
        }

        return Number.isFinite(orderId) && confirmedOnlineOrderIds.has(orderId)
      })
      .sort((a, b) => {
        const timeDiff = getOrderSortTime(b) - getOrderSortTime(a)
        if (timeDiff !== 0) return timeDiff

        const orderIdDiff = Number.parseInt(b?.orderId, 10) - Number.parseInt(a?.orderId, 10)
        return Number.isFinite(orderIdDiff) ? orderIdDiff : 0
      })
  } catch (error) {
    console.error('Lỗi tải lịch sử mua hàng:', error)
    orders.value = []
  } finally {
    isLoading.value = false
  }
}

const canCancelOrder = (order) => {
  const orderStatus = String(order?.orderStatus || '').toUpperCase()
  const paymentStatus = String(order?.paymentStatus || '').toUpperCase()
  return orderStatus === 'PENDING_PAYMENT' && paymentStatus === 'UNPAID'
}

const cancelOrder = async (order) => {
  if (!canCancelOrder(order)) return

  const confirmed = window.confirm(`Bạn có chắc muốn hủy đơn #${order.orderId}?`)
  if (!confirmed) return

  const accountId = Number.parseInt(userStore.accountId, 10)
  if (!Number.isFinite(accountId) || accountId <= 0) return

  cancellingOrderId.value = order.orderId
  try {
    await paymentApi.cancelOrderByUser(accountId, order.orderId, userStore.token)
    order.orderStatus = 'CANCELLED'
    order.paymentStatus = 'CANCELLED'
  } catch (error) {
    console.error('Lỗi hủy đơn hàng:', error)
  } finally {
    cancellingOrderId.value = null
  }
}

const goLogin = () => router.push({ name: 'Login' })
const goProducts = () => router.push({ name: 'ProductList' })

onMounted(loadOrders)
</script>

<style scoped>
.order-summary {
  width: 100%;
}

.order-preview {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding-top: 12px;
}

.order-preview-images {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.order-preview-avatar {
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
  overflow: hidden;
}

.order-preview-avatar--more {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #f5f5f5;
  color: #616161;
  font-weight: 700;
  font-size: 0.8rem;
}

.tracking-card {
  border-radius: 12px;
}

.tracking-scroll {
  overflow-x: auto;
  padding-bottom: 4px;
}

.tracking-row {
  display: flex;
  gap: 10px;
}

.tracking-step {
  position: relative;
  flex: 1;
  min-width: 150px;
  text-align: center;
}

.tracking-icon {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  margin: 0 auto;
  display: grid;
  place-items: center;
  color: #fff;
}

.tracking-icon--done {
  background: #22a745;
}

.tracking-icon--current {
  background: #f7b500;
}

.tracking-icon--pending {
  background: #cfd8dc;
  color: #607d8b;
}

.tracking-icon--cancelled {
  background: #ff5722;
}

.tracking-connector {
  position: absolute;
  top: 15px;
  left: calc(50% + 24px);
  width: calc(100% - 8px);
  height: 7px;
  border-radius: 999px;
}

.tracking-connector--done {
  background: #22a745;
}

.tracking-connector--current {
  background: #f7b500;
}

.tracking-connector--pending {
  background: #d9dee3;
}

.tracking-connector--cancelled {
  background: #ff5722;
}

.tracking-label {
  margin-top: 8px;
  font-weight: 600;
  font-size: 0.84rem;
}

.tracking-time {
  margin-top: 2px;
  color: #6f6f6f;
  font-size: 0.75rem;
}

@media (max-width: 700px) {
  .order-preview-images {
    gap: 6px;
  }
}
</style>
