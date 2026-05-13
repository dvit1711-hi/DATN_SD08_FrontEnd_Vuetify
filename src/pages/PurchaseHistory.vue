<template>
  <div class="cart-page">
    <div class="page-header">
      <div>
        <p class="page-eyebrow">Order History</p>
        <h1 class="page-title">Lịch sử mua hàng</h1>
      </div>
    </div>

    <div v-if="!isLoggedIn" class="auth-notice">
      <i class="notice-icon">⚠</i>
      <div>
        <p class="notice-title">Bạn chưa đăng nhập</p>
        <p class="notice-sub">Vui lòng đăng nhập để xem lịch sử mua hàng</p>
      </div>
      <button class="btn-outline" @click="goLogin">Đăng nhập</button>
    </div>

    <template v-else>
      <div v-if="isLoading" class="loading-state">
        <v-progress-circular indeterminate color="black" size="36" width="2" />
      </div>

      <div v-else-if="orders.length === 0" class="empty-state">
        <div class="empty-icon">
          <v-icon icon="mdi-package-variant-closed-remove" size="40" />
        </div>
        <p class="empty-title">Chưa có đơn hàng</p>
        <p class="empty-sub">Bạn chưa tạo đơn nào. Hãy mua sắm ngay</p>
        <button class="btn-primary" @click="goProducts">Khám phá sản phẩm</button>
      </div>

      <div v-else class="history-list">
        <div class="select-bar">
          <label class="select-all-label">
            <span>Lịch sử đơn hàng</span>
          </label>
          <span class="select-count">{{ orders.length }} đơn</span>
        </div>

        <transition-group name="item-list" tag="div">
          <div
            v-for="order in paginatedOrders"
            :key="order.orderId"
            class="cart-item purchase-order-card"
            @click="openOrder(order.orderId)"
          >
            <div class="purchase-order-thumb">
              <div class="purchase-order-thumb__image">
                <v-avatar size="96" rounded="lg" class="product-img">
                  <v-img
                    v-if="getOrderPreviewItems(order).length > 0"
                    :src="resolveOrderItemImageUrl(getOrderPreviewItems(order)[0].imageUrl)"
                    cover
                  />
                  <v-icon v-else icon="mdi-package-variant-closed" size="34" />
                </v-avatar>
                <div v-if="getOrderPreviewOverflowCount(order) > 0" class="purchase-order-thumb__count">
                  +{{ getOrderPreviewOverflowCount(order) }}
                </div>
              </div>
            </div>

            <div class="item-info purchase-order-info">
              <p class="item-brand">Đơn hàng</p>
              <p class="item-name">#{{ order.orderId }}</p>
              <div class="item-meta">
                <span class="meta-tag">{{ formatDate(order.orderDate) }}</span>
                <span v-if="order.trackingCode" class="meta-tag">Mã vận đơn: {{ order.trackingCode }}</span>
                <span class="meta-tag">{{ getPaymentMethodLabel(order.paymentMethod) }}</span>
              </div>
              <div class="purchase-order-subline">
                <span class="meta-tag">{{ getPaymentStatusLabel(order.paymentStatus) }}</span>
                <span v-if="order.couponCode" class="meta-tag">Mã: {{ order.couponCode }}</span>
              </div>
            </div>

            <div class="item-actions purchase-order-actions">
              <div class="price-block">
                <p class="price-label">Thành tiền</p>
                <p class="price-total">{{ formatPrice(order.totalAmount) }}đ</p>
                <p class="price-unit">
                  <v-chip size="x-small" :color="getDisplayStatus(order).color" variant="tonal">
                    {{ getDisplayStatus(order).label }}
                  </v-chip>
                </p>
              </div>

              <button
                v-if="canCancelOrder(order)"
                class="delete-btn purchase-order-cancel"
                :disabled="cancellingOrderId === order.orderId"
                @click.stop="cancelOrder(order)"
              >
                <v-progress-circular v-if="cancellingOrderId === order.orderId" indeterminate size="14" width="2" color="black" />
                <v-icon v-else icon="mdi-close-circle-outline" size="16" />
                <span>Hủy đơn</span>
              </button>
            </div>
          </div>
        </transition-group>

        <div v-if="orders.length > 0" class="select-bar select-bar--footer">
          <div class="purchase-history-page-controls">
            <v-pagination
              v-model="currentPage"
              :length="totalPages"
              :total-visible="7"
              color="primary"
              show-first-last-page
            />
          </div>

          <div class="purchase-history-select">
            <span class="text-caption text-grey">Hiển thị:</span>
            <v-select
              v-model="itemsPerPage"
              :items="[5, 10, 15, 20]"
              density="compact"
              style="min-width: 90px; max-width: 140px"
              hide-details
            />
            <span class="text-caption text-grey">mục / trang</span>
          </div>
        </div>

        <div class="text-center text-caption text-grey mt-3">
          Hiển thị {{ (currentPage - 1) * itemsPerPage + 1 }} đến {{ Math.min(currentPage * itemsPerPage, orders.length) }} trong {{ orders.length }} đơn hàng
        </div>
      </div>
    </template>

    <v-snackbar v-model="showSnackbar" :color="snackbarColor" timeout="3000" location="top" rounded="lg">
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import paymentApi from '@/api/paymentApi'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const orders = ref([])
const isLoading = ref(false)
const cancellingOrderId = ref(null)
const uiShippingStartedOrderIds = ref(new Set())
const uiDeliveredOrderIds = ref(new Set())

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)

const IMAGE_BASE_URL = ''
const fallbackImage = 'https://via.placeholder.com/64x64?text=No+Image'

const ONLINE_CONFIRMED_ORDERS_KEY = 'onlineTransferConfirmedOrderIds'
const HIDDEN_CANCELLED_ONLINE_ORDERS_KEY = 'hiddenCancelledOnlineOrderIds'
const ADMIN_ONLINE_SHIPPING_STARTED_KEY = 'adminOnlineShippingStartedOrderIds'
const ADMIN_UI_DELIVERED_ORDER_IDS_KEY = 'adminUiDeliveredOrderIds'

const isLoggedIn = computed(() => userStore.isLoggedIn)

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return orders.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(orders.value.length / itemsPerPage.value))

const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0))

const formatDate = (value) => {
  if (!value) return 'Không có dữ liệu'
  if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}/.test(value)) return value
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString('vi-VN')
}

const resolveOrderItemImageUrl = (imageUrl) => {
  const value = String(imageUrl || '').trim()
  if (!value) return fallbackImage
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:') || value.startsWith('blob:')) return value
  return value.startsWith('/') ? `${IMAGE_BASE_URL}${value}` : `${IMAGE_BASE_URL}/${value}`
}

const getOrderItems = (order) => (Array.isArray(order?.items) ? order.items : [])
const getOrderPreviewItems = (order, limit = 4) => getOrderItems(order).slice(0, limit)
const getOrderPreviewOverflowCount = (order, limit = 4) => Math.max(getOrderItems(order).length - limit, 0)

const getBoughtQuantity = (item) => Number(item?.quantity || 0)
const getReturnedQuantity = (item) => Number(item?.returnedQuantity || 0)
const getShippingReturnedQuantity = (item) => Number(item?.shippingReturnedQuantity || 0)
const getCompletedReturnedQuantity = (item) => Number(item?.completedReturnedQuantity || 0)

const getRemainingQuantity = (item) => {
  const remaining = item?.remainingQuantity ?? item?.returnableQuantity
  if (remaining !== undefined && remaining !== null) return Number(remaining || 0)
  return Math.max(0, getBoughtQuantity(item) - getReturnedQuantity(item))
}

const getShippingReturnedItems = (order) => getOrderItems(order).filter((i) => getShippingReturnedQuantity(i) > 0)
const getCompletedReturnedItems = (order) => getOrderItems(order).filter((i) => getCompletedReturnedQuantity(i) > 0)

const hasCompletedReturnedItems = (order) => getCompletedReturnedItems(order).length > 0
const hasShippingReturnedItems = (order) => getShippingReturnedItems(order).length > 0

const getShippingReturnedLineTotal = (item) => Number(item?.price || 0) * getShippingReturnedQuantity(item)
const getCompletedReturnedLineTotal = (item) => Number(item?.price || 0) * getCompletedReturnedQuantity(item)

const getShippingReturnedOrderTotal = (order) => getShippingReturnedItems(order).reduce((s, i) => s + getShippingReturnedLineTotal(i), 0)
const getCompletedReturnedOrderTotal = (order) => getCompletedReturnedItems(order).reduce((s, i) => s + getCompletedReturnedLineTotal(i), 0)

const getReturnLineByType = (order, item, type) => {
  const noteText = String(order?.note || '').trim()
  if (!noteText) return ''
  const productName = String(item?.productName || '').trim()
  const label = type === 'SHIPPING_RETURN' ? 'HOAN_HANG' : 'TRA_HANG'
  const lines = noteText.split(/\n+/).map((l) => l.trim()).filter(Boolean)
  return ([...lines].reverse().find((line) => {
    const sameType = line.includes(`[${label}`)
    const sameProduct = productName ? line.includes(productName) : true
    return sameType && sameProduct
  }) || '')
}

const getReturnNote = (order, item, type) => {
  const line = getReturnLineByType(order, item, type)
  const match = line.match(/Ghi chú:\s*(.*)$/i)
  return match?.[1]?.trim() || ''
}

const getReturnTime = (order, item, type) => {
  const line = getReturnLineByType(order, item, type)
  const match = line.match(/\[(?:HOAN_HANG|TRA_HANG)\s+([^\]]+)\]/i)
  return match?.[1]?.trim() || ''
}

const getLatestReturnTime = (order) => {
  const noteText = String(order?.note || '').trim()
  if (!noteText) return ''
  const lines = noteText.split(/\n+/).map((l) => l.trim()).filter((l) => /^\[(HOAN_HANG|TRA_HANG)\s+/i.test(l))
  const lastLine = lines[lines.length - 1] || ''
  const match = lastLine.match(/\[(?:HOAN_HANG|TRA_HANG)\s+([^\]]+)\]/i)
  return match?.[1]?.trim() || ''
}

const formatOrderAddress = (shippingAddress) => {
  const value = String(shippingAddress || '').trim()
  return value.length > 0 ? value : 'Không có địa chỉ cho đơn này'
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

const getPaymentMethodLabel = (method) => {
  const normalized = String(method || '').toUpperCase()
  if (normalized === 'COD') return 'Thanh toán khi nhận hàng'
  if (normalized === 'CASH') return 'Tiền mặt'
  if (normalized === 'BANK_TRANSFER') return 'Chuyển khoản ngân hàng'
  if (normalized === 'BANKING') return 'Chuyển khoản ngân hàng'
  if (normalized === 'E_WALLET') return 'Ví điện tử'
  if (normalized === 'VNPAY') return 'VNPay'
  if (normalized === 'MOMO') return 'MoMo'
  return 'Không xác định'
}

const isOnlinePaymentMethod = (order) => {
  const method = String(order?.paymentMethod || '').toUpperCase()
  return ['BANK_TRANSFER', 'E_WALLET', 'BANKING', 'VNPAY', 'MOMO'].includes(method)
}

const isCodPaymentMethod = (order) => {
  const method = String(order?.paymentMethod || '').toUpperCase()
  return method === 'COD' || method === 'CASH'
}

const loadIdSet = (key) => {
  try {
    const raw = localStorage.getItem(key)
    const parsed = JSON.parse(raw || '[]')
    return new Set(Array.isArray(parsed) ? parsed.map((v) => Number.parseInt(v, 10)).filter(Number.isFinite) : [])
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

const getDisplayStatus = (order) => {
  const orderStatus = String(order?.orderStatus || '').toUpperCase()
  const paymentStatus = String(order?.paymentStatus || '').toUpperCase()
  const uiShippingStarted = isUiShippingStartedOrder(order)
  const uiDelivered = isUiDeliveredOrder(order)

  if (orderStatus === 'CANCELLED' || paymentStatus === 'CANCELLED') return { label: 'Đã hủy', color: 'error' }
  if (orderStatus === 'RETURNED') return hasCompletedReturnedItems(order) ? { label: 'Trả hàng', color: 'error' } : { label: 'Hoàn hàng', color: 'error' }
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

const getTrackingSteps = (order) => {
  const orderStatus = String(order?.orderStatus || '').toUpperCase()
  const paymentStatus = String(order?.paymentStatus || '').toUpperCase()
  const createdTime = formatDate(order?.orderDate)
  const uiShippingStarted = isUiShippingStartedOrder(order)
  const uiDelivered = isUiDeliveredOrder(order)
  const baseSteps = isOnlinePaymentMethod(order) ? getOnlineBaseSteps() : getCodBaseSteps()

  if (orderStatus === 'CANCELLED' || paymentStatus === 'CANCELLED') {
    return [ { ...baseSteps[0], state: 'done', time: createdTime }, { code: 'CANCELLED', label: 'Đã hủy', icon: 'mdi-close-octagon-outline', time: createdTime, state: 'cancelled' } ]
  }

  if (orderStatus === 'RETURNED') {
    const returnedLabel = hasCompletedReturnedItems(order) ? 'Trả hàng' : 'Hoàn hàng'
    return [ ...baseSteps.map((step, index) => ({ ...step, state: 'done', time: index === 0 ? createdTime : '-' })), { code: 'RETURNED', label: returnedLabel, icon: 'mdi-keyboard-return', time: getLatestReturnTime(order) || createdTime, state: 'returned' } ]
  }

  let activeIndex = 0
  if (isOnlinePaymentMethod(order)) {
    if (orderStatus === 'PAID') activeIndex = 6
    else if (paymentStatus === 'PAID' && uiDelivered) activeIndex = 5
    else if (paymentStatus === 'PAID' && uiShippingStarted) activeIndex = 4
    else if (paymentStatus === 'PAID' || orderStatus === 'CONFIRMED') activeIndex = 3
    else activeIndex = 0
  } else {
    if (orderStatus === 'PAID') activeIndex = 6
    else if (orderStatus === 'CONFIRMED') activeIndex = 2
    else if (orderStatus === 'SHIPPING' && uiShippingStarted && !uiDelivered) activeIndex = 3
    else if (orderStatus === 'SHIPPING' && uiDelivered && paymentStatus === 'UNPAID') activeIndex = 4
    else if (orderStatus === 'SHIPPING' && uiDelivered && paymentStatus === 'PAID') activeIndex = 5
    else activeIndex = 0
  }

  return baseSteps.slice(0, activeIndex + 1).map((step, index) => {
    let state = 'pending'
    if (index < activeIndex) state = 'done'
    if (index === activeIndex) state = index === baseSteps.length - 1 ? 'done' : 'current'
    return { ...step, state, time: index === 0 || index <= activeIndex ? createdTime : '-' }
  })
}

const getOnlineConfirmedOrderIds = () => {
  try { const raw = localStorage.getItem(ONLINE_CONFIRMED_ORDERS_KEY); const parsed = JSON.parse(raw || '[]'); return Array.isArray(parsed) ? parsed.map((x) => Number.parseInt(x, 10)).filter(Number.isFinite) : [] } catch { return [] }
}

const getHiddenCancelledOnlineOrderIds = () => {
  try { const raw = localStorage.getItem(HIDDEN_CANCELLED_ONLINE_ORDERS_KEY); const parsed = JSON.parse(raw || '[]'); return Array.isArray(parsed) ? parsed.map((x) => Number.parseInt(x, 10)).filter(Number.isFinite) : [] } catch { return [] }
}

const getOrderSortTime = (order) => {
  const value = String(order?.orderDate || '').trim()
  if (value) {
    const ddMmYyyyMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/)
    if (ddMmYyyyMatch) {
      const [, day, month, year, hour = '0', minute = '0', second = '0'] = ddMmYyyyMatch
      const parsedTime = new Date(Number.parseInt(year, 10), Number.parseInt(month, 10) - 1, Number.parseInt(day, 10), Number.parseInt(hour, 10), Number.parseInt(minute, 10), Number.parseInt(second, 10)).getTime()
      if (Number.isFinite(parsedTime)) return parsedTime
    }
    const parsedTime = new Date(value).getTime()
    if (Number.isFinite(parsedTime)) return parsedTime
  }
  const orderId = Number.parseInt(order?.orderId, 10)
  return Number.isFinite(orderId) ? orderId : 0
}

const loadOrders = async () => {
  if (!isLoggedIn.value) { orders.value = []; currentPage.value = 1; return }
  const accountId = Number.parseInt(userStore.accountId, 10)
  if (!Number.isFinite(accountId) || accountId <= 0) { orders.value = []; currentPage.value = 1; return }
  isLoading.value = true
  try {
    reloadUiTimelineState()
    const res = await paymentApi.getOrdersByAccount(accountId, userStore.token)
    const allOrders = Array.isArray(res.data) ? res.data : []
    const confirmedOnlineOrderIds = new Set(getOnlineConfirmedOrderIds())
    const hiddenCancelledOnlineOrderIds = new Set(getHiddenCancelledOnlineOrderIds())
    orders.value = allOrders.filter((order) => {
      const orderId = Number.parseInt(order?.orderId, 10)
      if (Number.isFinite(orderId) && hiddenCancelledOnlineOrderIds.has(orderId)) return false
      const method = String(order?.paymentMethod || '').toUpperCase()
      const paymentStatus = String(order?.paymentStatus || '').toUpperCase()
      if (method !== 'BANK_TRANSFER' || paymentStatus !== 'UNPAID') return true
      return Number.isFinite(orderId) && confirmedOnlineOrderIds.has(orderId)
    }).sort((a, b) => {
      const timeDiff = getOrderSortTime(b) - getOrderSortTime(a)
      if (timeDiff !== 0) return timeDiff
      return Number.parseInt(b?.orderId || 0, 10) - Number.parseInt(a?.orderId || 0, 10)
    })
    // Restore page from query if present and valid, otherwise default to 1
    const parsed = Number.parseInt(String(route.query.page || ''), 10)
    const pages = Math.max(1, Math.ceil(orders.value.length / itemsPerPage.value))
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= pages) {
      currentPage.value = parsed
    } else {
      currentPage.value = 1
    }
  } catch (error) {
    console.error('Lỗi tải lịch sử mua hàng:', error)
    orders.value = []
    currentPage.value = 1
  } finally { isLoading.value = false }
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
  } catch (error) { console.error('Lỗi hủy đơn hàng:', error) } finally { cancellingOrderId.value = null }
}

const goLogin = () => router.push({ name: 'Login' })
const goProducts = () => router.push({ name: 'ProductList' })

const openOrder = (orderId) => {
  // persist current page in the PurchaseHistory URL so returning restores it
  try {
    router.replace({ name: 'PurchaseHistory', query: { page: String(currentPage.value) } })
  } catch {
    // ignore
  }

  router.push({ name: 'OrderDetail', params: { id: String(orderId) } })
}

onMounted(loadOrders)

watch(currentPage, () => { window.scrollTo({ top: 0, behavior: 'smooth' }) })
</script>

<style scoped>
.cart-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
  font-family: inherit;
}

.page-header {
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

.history-list {
  width: 100%;
}

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

.select-bar--footer {
  margin-top: 12px;
  margin-bottom: 0;
  flex-wrap: wrap;
  gap: 12px;
}

.purchase-history-page-controls {
  display: flex;
  justify-content: center;
  flex: 1 1 100%;
}

.purchase-history-select {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1 1 100%;
}

.cart-item {
  display: grid;
  grid-template-columns: 112px 1fr auto;
  gap: 14px;
  align-items: start;
  padding: 18px 16px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  background: #fff;
  margin-bottom: 8px;
  transition: border-color 0.15s;
  cursor: pointer;
}

.cart-item:hover { border-color: rgba(0, 0, 0, 0.25); }

.purchase-order-thumb {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.purchase-order-thumb__image {
  position: relative;
  width: 96px;
  height: 96px;
}

.purchase-order-thumb__count {
  position: absolute;
  right: -6px;
  bottom: -6px;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  border-radius: 999px;
  background: #000;
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 500;
}

.purchase-order-info {
  padding-top: 2px;
}

.item-brand {
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(0,0,0,0.35);
  font-weight: 500;
  margin-bottom: 4px;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  margin-bottom: 8px;
}

.item-meta,
.purchase-order-subline {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.purchase-order-subline { margin-top: 6px; }

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

.purchase-order-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 160px;
}

.price-block { text-align: right; }

.price-label {
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(0,0,0,0.35);
  margin-bottom: 2px;
}

.price-total { font-size: 16px; font-weight: 500; }

.price-unit {
  font-size: 11px;
  color: rgba(0,0,0,0.4);
  margin-top: 2px;
}

.delete-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 12px;
  background: #fff;
  color: #d32f2f;
  border: 1px solid #d32f2f;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  align-self: flex-end;
}

.delete-btn:hover:not(:disabled) {
  background: #d32f2f;
  color: #fff;
  box-shadow: 0 2px 8px rgba(211, 47, 47, 0.3);
}

.delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.purchase-order-cancel {
  margin-top: 0;
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

.item-list-enter-active,
.item-list-leave-active { transition: all 0.25s ease; }
.item-list-enter-from,
.item-list-leave-to { opacity: 0; transform: translateX(-16px); }

@media (max-width: 600px) {
  .cart-item {
    grid-template-columns: 96px 1fr;
  }

  .purchase-order-actions {
    grid-column: 1 / -1;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 12px;
    min-width: 0;
  }

  .price-block {
    text-align: left;
  }

  .purchase-order-cancel {
    margin-top: 0;
  }
}
</style>