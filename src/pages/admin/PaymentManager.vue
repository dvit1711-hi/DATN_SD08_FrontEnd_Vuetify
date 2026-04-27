<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Xác nhận thanh toán</h1>
      </div>

      <v-btn color="primary" prepend-icon="mdi-refresh" @click="loadOrders" :loading="isLoading">
        Làm mới
      </v-btn>
    </div>

    <v-card rounded="xl" elevation="0" class="pa-4 mb-6">
      <v-text-field
        v-model="searchKeyword"
        label="Tìm kiếm"
        placeholder="Tìm theo mã đơn, tên khách hàng, phương thức, trạng thái..."
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="comfortable"
        clearable
      />

      <div v-if="searchKeyword" class="text-caption text-medium-emphasis mt-2">
        Tìm thấy <strong>{{ searchedOrders.length }}</strong> kết quả
      </div>
    </v-card>

    <v-card rounded="xl" elevation="0" class="payment-manage-card">
      <div class="payment-card-head">
        <div>
          <div class="text-h6 font-weight-bold">Quản lý xác nhận thanh toán</div>
          <div class="text-body-2 text-grey">
            Online: khách mua trên mạng | Offline: khách lẻ mua tại quầy
          </div>
        </div>

        <v-chip :color="paymentTab === 'online' ? 'primary' : 'deep-orange'" variant="tonal" size="small">
          {{ currentTabOrders.length }} đơn
        </v-chip>
      </div>

      <div class="custom-payment-tabs">
        <button
          type="button"
          class="custom-payment-tab"
          :class="{ active: paymentTab === 'online' }"
          @click="paymentTab = 'online'"
        >
          <v-icon size="16">mdi-web</v-icon>
          <span>Online</span>
        </button>

        <button
          type="button"
          class="custom-payment-tab"
          :class="{ active: paymentTab === 'offline' }"
          @click="paymentTab = 'offline'"
        >
          <v-icon size="16">mdi-store</v-icon>
          <span>Offline</span>
        </button>
      </div>

      <div class="pt-3">
        <v-data-table
          :headers="headers"
          :items="currentTabOrders"
          :loading="isLoading"
          item-key="orderId"
          class="elevation-0"
        >
          <template #item.orderInfo="{ item }">
            <div>
              <div class="font-weight-bold">{{ getDisplayOrderCode(getRawItem(item)) }}</div>
              <div class="text-caption text-grey">
                {{ getDisplayCustomer(getRawItem(item)) }} |
                {{ formatDate(getRawItem(item)?.orderDate) }}
              </div>
            </div>
          </template>

          <template #item.paymentStatus="{ item }">
            <v-chip
              size="small"
              :color="getPaymentStatusColor(getRawItem(item)?.paymentStatus)"
              variant="tonal"
            >
              {{ getPaymentStatusLabel(getRawItem(item)?.paymentStatus) }}
            </v-chip>
          </template>

          <template #item.paymentMethod="{ item }">
            <v-chip size="small" color="orange" variant="tonal">
              {{ getRawItem(item)?.paymentMethod || 'UNKNOWN' }}
            </v-chip>
          </template>

          <template #item.orderStatus="{ item }">
            <v-chip size="small" :color="getOrderStatusColor(getRawItem(item))" variant="tonal">
              {{ getOrderStatusLabel(getRawItem(item)) }}
            </v-chip>
          </template>

          <template #item.totalAmount="{ item }">
            <span class="font-weight-bold">
              {{ formatPrice(getRawItem(item)?.totalAmount) }}đ
            </span>
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex ga-2">
              <v-btn color="primary" variant="tonal" size="small" @click="goToPaymentDetail(getRawItem(item))">
                Chi tiết
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </div>
    </v-card>

    <v-snackbar v-model="showSnackbar" :color="snackbarColor" timeout="3000" top>
      {{ snackbarMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import paymentApi from '@/api/paymentApi'

const router = useRouter()

const orders = ref([])
const searchKeyword = ref('')
const paymentTab = ref('online')
const isLoading = ref(false)
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')
const uiShippingStartedOrderIds = ref(new Set())
const uiDeliveredOrderIds = ref(new Set())

const headers = [
  { title: 'Đơn hàng', key: 'orderInfo', sortable: false },
  { title: 'Phương thức', key: 'paymentMethod' },
  { title: 'Thanh toán', key: 'paymentStatus' },
  { title: 'Trạng thái đơn', key: 'orderStatus' },
  { title: 'Tổng tiền', key: 'totalAmount' },
  { title: 'Thao tác', key: 'actions', sortable: false },
]

const ONLINE_SHIPPING_STARTED_KEY = 'adminOnlineShippingStartedOrderIds'
const UI_DELIVERED_ORDER_IDS_KEY = 'adminUiDeliveredOrderIds'

const getRawItem = (item) => item?.raw || item

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

const reloadLocalState = () => {
  uiShippingStartedOrderIds.value = loadIdSet(ONLINE_SHIPPING_STARTED_KEY)
  uiDeliveredOrderIds.value = loadIdSet(UI_DELIVERED_ORDER_IDS_KEY)
}

const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(value || 0)

const formatDate = (value) => {
  if (!value) return 'N/A'

  if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}/.test(value)) {
    return value
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString('vi-VN')
}

const parseOrderDateToTimestamp = (value) => {
  if (!value) return 0

  if (value instanceof Date) {
    const time = value.getTime()
    return Number.isNaN(time) ? 0 : time
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()

    const vnMatch = trimmed.match(
      /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/
    )

    if (vnMatch) {
      const [, dd, mm, yyyy, hh = '00', mi = '00', ss = '00'] = vnMatch
      const date = new Date(
        Number(yyyy),
        Number(mm) - 1,
        Number(dd),
        Number(hh),
        Number(mi),
        Number(ss)
      )
      const time = date.getTime()
      return Number.isNaN(time) ? 0 : time
    }

    const parsed = new Date(trimmed)
    const time = parsed.getTime()
    return Number.isNaN(time) ? 0 : time
  }

  return 0
}

const sortOrdersNewestFirst = (list = []) => {
  return [...list].sort((a, b) => {
    const timeDiff =
      parseOrderDateToTimestamp(b?.orderDate) - parseOrderDateToTimestamp(a?.orderDate)

    if (timeDiff !== 0) return timeDiff

    return Number(b?.orderId || 0) - Number(a?.orderId || 0)
  })
}

const getDisplayOrderCode = (order) => {
  return order?.trackingCode || `#${order?.orderId || '-'}`
}

const getAccountId = (order) => {
  return order?.accountId ?? order?.accountID ?? null
}

const hasAccount = (order) => {
  return !!getAccountId(order) || !!order?.accountUsername
}

const getOrderType = (order) => {
  return String(order?.orderType || '').toUpperCase()
}

const isOnlineOrder = (order) => getOrderType(order) === 'ONLINE'
const isOfflineOrder = (order) => getOrderType(order) === 'OFFLINE'

const isOfflineGuestOrder = (order) => {
  return isOfflineOrder(order) && !hasAccount(order)
}

const getOrderTypeLabel = (order) => {
  if (isOnlineOrder(order)) return 'Online'
  if (isOfflineGuestOrder(order)) return 'Offline - Khách lẻ'
  if (isOfflineOrder(order)) return 'Offline'
  return 'Không xác định'
}

const getDisplayCustomer = (order) => {
  if (isOfflineGuestOrder(order)) {
    return order?.customerName || order?.customerPhone || 'Khách lẻ'
  }

  if (isOfflineOrder(order)) {
    return order?.customerName || order?.accountUsername || 'Khách tại quầy'
  }

  return order?.accountUsername || order?.customerName || 'Khách online'
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

const isOnlinePaymentMethod = (order) => {
  const method = String(order?.paymentMethod || '').toUpperCase()
  return (
    method === 'BANK_TRANSFER' ||
    method === 'E_WALLET' ||
    method === 'BANKING' ||
    method === 'VNPAY' ||
    method === 'MOMO'
  )
}

const isCodPaymentMethod = (order) => {
  const method = String(order?.paymentMethod || '').toUpperCase()
  return method === 'COD'
}

const isUiShippingStartedOrder = (order) => {
  const orderId = order?.orderId
  if (!orderId) return false
  return uiShippingStartedOrderIds.value.has(orderId)
}

const isUiDeliveredOrder = (order) => {
  const orderId = order?.orderId
  if (!orderId) return false
  return uiDeliveredOrderIds.value.has(orderId)
}

const getOrderVisualStage = (order) => {
  const orderStatus = String(order?.orderStatus || '').toUpperCase()
  const paymentStatus = String(order?.paymentStatus || '').toUpperCase()

  if (orderStatus === 'CANCELLED' || paymentStatus === 'CANCELLED') return 'CANCELLED'

  if (isOfflineGuestOrder(order)) {
    if (orderStatus === 'PAID' || paymentStatus === 'PAID') return 'COMPLETED'
    return 'WAIT_CONFIRM'
  }

  if (orderStatus === 'PAID') return 'COMPLETED'

  if (orderStatus === 'SHIPPING') {
    if (isCodPaymentMethod(order) && isUiDeliveredOrder(order) && paymentStatus === 'UNPAID') {
      return 'WAIT_PAYMENT_CONFIRM'
    }

    if (isCodPaymentMethod(order) && isUiDeliveredOrder(order) && paymentStatus === 'PAID') {
      return 'WAIT_COMPLETE'
    }

    if (isUiDeliveredOrder(order)) return 'DELIVERED'
    if (isUiShippingStartedOrder(order)) return 'IN_TRANSIT'
    return 'WAIT_SHIP'
  }

  if (orderStatus === 'PENDING_PAYMENT' || orderStatus === 'PENDING') {
    if (isOnlinePaymentMethod(order) && paymentStatus === 'PAID') return 'WAIT_SHIP'
    return 'WAIT_CONFIRM'
  }

  return 'UNKNOWN'
}

const getOrderStatusLabel = (order) => {
  const stage = getOrderVisualStage(order)

  if (stage === 'WAIT_CONFIRM') return 'Chờ xác nhận'
  if (stage === 'WAIT_PAYMENT_CONFIRM') return 'Chờ xác nhận thanh toán'
  if (stage === 'WAIT_SHIP') return 'Chờ giao hàng'
  if (stage === 'IN_TRANSIT') return 'Đang giao hàng'
  if (stage === 'DELIVERED') return 'Đã giao hàng'
  if (stage === 'WAIT_COMPLETE') return 'Đã xác nhận thanh toán'
  if (stage === 'COMPLETED') return 'Hoàn thành'
  if (stage === 'CANCELLED') return 'Đã hủy'

  return 'Không xác định'
}

const getOrderStatusColor = (order) => {
  const stage = getOrderVisualStage(order)

  if (stage === 'WAIT_CONFIRM') return 'warning'
  if (stage === 'WAIT_PAYMENT_CONFIRM') return 'warning'
  if (stage === 'WAIT_SHIP') return 'success'
  if (stage === 'WAIT_COMPLETE') return 'success'
  if (stage === 'IN_TRANSIT') return 'primary'
  if (stage === 'DELIVERED') return 'warning'
  if (stage === 'COMPLETED') return 'success'
  if (stage === 'CANCELLED') return 'error'

  return 'grey'
}

const searchedOrders = computed(() => {
  if (!searchKeyword.value.trim()) return orders.value

  const keyword = searchKeyword.value.toLowerCase().trim()

  return orders.value.filter((order) => {
    const orderId = String(order.orderId || '').toLowerCase()
    const trackingCode = String(order.trackingCode || '').toLowerCase()
    const customer = getDisplayCustomer(order).toLowerCase()
    const paymentMethod = String(order.paymentMethod || '').toLowerCase()
    const paymentStatus = getPaymentStatusLabel(order.paymentStatus).toLowerCase()
    const orderStatus = getOrderStatusLabel(order).toLowerCase()
    const totalAmount = String(order.totalAmount || '').toLowerCase()
    const orderType = getOrderTypeLabel(order).toLowerCase()

    return (
      orderId.includes(keyword) ||
      trackingCode.includes(keyword) ||
      customer.includes(keyword) ||
      paymentMethod.includes(keyword) ||
      paymentStatus.includes(keyword) ||
      orderStatus.includes(keyword) ||
      totalAmount.includes(keyword) ||
      orderType.includes(keyword)
    )
  })
})

const onlineOrders = computed(() => {
  return sortOrdersNewestFirst(searchedOrders.value.filter(isOnlineOrder))
})

const offlineOrders = computed(() => {
  return sortOrdersNewestFirst(searchedOrders.value.filter(isOfflineOrder))
})

const currentTabOrders = computed(() => {
  return paymentTab.value === 'online' ? onlineOrders.value : offlineOrders.value
})

const goToPaymentDetail = (order) => {
  const rawOrder = getRawItem(order)
  if (!rawOrder?.orderId) return

  router.push({
    name: 'AdminPaymentDetail',
    params: {
      id: rawOrder.orderId,
    },
  })
}

const loadOrders = async () => {
  searchKeyword.value = ''
  isLoading.value = true
  reloadLocalState()

  try {
    const token = localStorage.getItem('token')
    const res = await paymentApi.getAllOrders(token)
    orders.value = sortOrdersNewestFirst(res.data || [])
  } catch (error) {
    console.error('Lỗi tải danh sách thanh toán:', error)
    snackbarMessage.value = 'Không tải được danh sách đơn hàng'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  } finally {
    isLoading.value = false
  }
}

onMounted(loadOrders)
</script>

<style scoped src="@/assets/css/payment-manager.css"></style>