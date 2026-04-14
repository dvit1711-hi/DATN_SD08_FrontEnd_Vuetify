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
      <v-text-field v-model="searchKeyword" label="Tìm kiếm"
        placeholder="Tìm theo mã đơn, tên khách hàng, phương thức, trạng thái..." prepend-inner-icon="mdi-magnify"
        variant="outlined" density="comfortable" clearable />
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
        <button type="button" class="custom-payment-tab" :class="{ active: paymentTab === 'online' }"
          @click="paymentTab = 'online'">
          <v-icon size="16">mdi-web</v-icon>
          <span>Online</span>
        </button>

        <button type="button" class="custom-payment-tab" :class="{ active: paymentTab === 'offline' }"
          @click="paymentTab = 'offline'">
          <v-icon size="16">mdi-store</v-icon>
          <span>Offline</span>
        </button>
      </div>

      <div class="pt-3">
        <v-data-table :headers="headers" :items="currentTabOrders" :loading="isLoading" item-key="orderId"
          class="elevation-0">
          <template #item.orderInfo="{ item }">
            <div>
              <div class="font-weight-bold">{{ getDisplayOrderCode(item) }}</div>
              <div class="text-caption text-grey">
                {{ getDisplayCustomer(item) }} | {{ formatDate(item.orderDate) }}
              </div>
            </div>
          </template>

          <template #item.paymentStatus="{ item }">
            <v-chip size="small" :color="getPaymentStatusColor(item.paymentStatus)" variant="tonal">
              {{ getPaymentStatusLabel(item.paymentStatus) }}
            </v-chip>
          </template>

          <template #item.paymentMethod="{ item }">
            <v-chip size="small" color="orange" variant="tonal">
              {{ item.paymentMethod || 'UNKNOWN' }}
            </v-chip>
          </template>

          <template #item.orderStatus="{ item }">
            <v-chip size="small" :color="getOrderStatusColor(item)" variant="tonal">
              {{ getOrderStatusLabel(item) }}
            </v-chip>
          </template>

          <template #item.totalAmount="{ item }">
            <span class="font-weight-bold">{{ formatPrice(item.totalAmount) }}đ</span>
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex ga-2">
              <v-btn color="primary" variant="tonal" size="small" @click="openOrderDetail(item)">
                Chi tiết
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </div>
    </v-card>

    <v-dialog v-model="detailDialog" max-width="1200">
      <v-card rounded="xl">
        <v-card-title class="d-flex justify-space-between align-center">
          <div>
            <div class="text-h6 font-weight-bold">
              Quản lý đơn hàng / {{ getDisplayOrderCode(selectedOrder) }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ getDisplayCustomer(selectedOrder) }}
            </div>
          </div>

          <v-btn icon="mdi-close" variant="text" @click="detailDialog = false" />
        </v-card-title>

        <v-card-text>
          <v-card variant="tonal" color="grey-lighten-4" class="mb-4">
            <v-card-title class="text-subtitle-1">Lịch sử đơn hàng</v-card-title>

            <v-card-text>
              <div class="order-track-scroll">
                <div class="order-track" :style="trackWidthStyle(orderTimelineSteps)">
                  <div v-for="(step, index) in orderTimelineSteps" :key="`${step.code}-${index}`" class="track-step"
                    :class="{ 'track-step--visible': isStepVisible(index) }">
                    <div class="track-icon" :class="`track-icon--${step.state}`">
                      <v-icon size="22">{{ step.icon }}</v-icon>
                    </div>

                    <div v-if="index < orderTimelineSteps.length - 1" class="track-connector"
                      :class="connectorClass(orderTimelineSteps[index + 1])" :style="connectorDelayStyle(index)" />

                    <div class="track-label text-subtitle-2">{{ step.label }}</div>
                    <div class="track-time text-caption text-medium-emphasis">{{ step.time }}</div>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <v-row>
            <v-col cols="12" md="7">
              <v-card variant="outlined" class="h-100">
                <v-card-title>Thông tin đơn hàng</v-card-title>
                <v-card-text>
                  <div class="detail-row">
                    <span>Mã vận đơn:</span>
                    <strong>{{ getDisplayOrderCode(selectedOrder) }}</strong>
                  </div>
                  <div class="detail-row">
                    <span>Loại đơn:</span>
                    <strong>{{ getOrderTypeLabel(selectedOrder) }}</strong>
                  </div>
                  <div class="detail-row">
                    <span>Ngày tạo:</span>
                    <strong>{{ formatDate(selectedOrder?.orderDate) }}</strong>
                  </div>
                  <div class="detail-row">
                    <span>Khách hàng:</span>
                    <strong>{{ getDisplayCustomer(selectedOrder) }}</strong>
                  </div>
                  <div class="detail-row" v-if="isOfflineGuestOrder(selectedOrder)">
                    <span>Số điện thoại:</span>
                    <strong>{{ selectedOrder?.customerPhone || '-' }}</strong>
                  </div>
                  <div class="detail-row" v-if="isOfflineGuestOrder(selectedOrder)">
                    <span>Nhân viên tạo đơn:</span>
                    <strong>{{ selectedOrder?.employeeName || selectedOrder?.employeeID || '-' }}</strong>
                  </div>
                  <div class="detail-row">
                    <span>Địa chỉ:</span>
                    <strong>{{ selectedOrder?.shippingAddress || '-' }}</strong>
                  </div>
                  <div class="detail-row">
                    <span>Mã giảm giá:</span>
                    <strong>{{ selectedOrder?.couponCode || '-' }}</strong>
                  </div>
                  <div class="detail-row">
                    <span>Tổng tiền:</span>
                    <strong class="text-red-darken-1">{{ formatPrice(selectedOrder?.totalAmount) }}đ</strong>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="5">
              <v-card variant="outlined" class="h-100">
                <v-card-title>Trạng thái</v-card-title>
                <v-card-text>
                  <div class="mb-3 d-flex ga-2 flex-wrap">
                    <v-chip size="small" :color="getOrderStatusColor(selectedOrder)" variant="flat">
                      {{ getOrderStatusLabel(selectedOrder) }}
                    </v-chip>

                    <v-chip size="small" :color="getPaymentStatusColor(selectedOrder?.paymentStatus)" variant="flat">
                      {{ getPaymentStatusLabel(selectedOrder?.paymentStatus) }}
                    </v-chip>

                    <v-chip size="small" color="orange" variant="tonal">
                      {{ selectedOrder?.paymentMethod || 'UNKNOWN' }}
                    </v-chip>

                    <v-chip size="small" :color="isOnlineOrder(selectedOrder) ? 'primary' : 'deep-orange'"
                      variant="tonal">
                      {{ getOrderTypeLabel(selectedOrder) }}
                    </v-chip>
                  </div>

                  <div class="d-flex ga-2 flex-wrap">
                    <v-btn color="info" variant="tonal" :disabled="!canStartShipping(selectedOrder)"
                      :loading="startingShippingOrderId === selectedOrder?.orderId"
                      @click="startShipping(selectedOrder)">
                      Bắt đầu giao hàng
                    </v-btn>

                    <v-btn color="success" variant="tonal" :disabled="!canCompleteDelivery(selectedOrder)"
                      :loading="completingDeliveryOrderId === selectedOrder?.orderId"
                      @click="completeDelivery(selectedOrder)">
                      Đã giao hàng
                    </v-btn>

                    <v-btn color="success" :variant="isUiDeliveredOrder(selectedOrder) ? 'tonal' : 'flat'"
                      :disabled="!canConfirmOrder(selectedOrder)"
                      :loading="confirmingOrderId === selectedOrder?.orderId" @click="confirmPayment(selectedOrder)">
                      Xác nhận thanh toán
                    </v-btn>

                    <v-btn color="success" variant="tonal" :disabled="!canCompleteOrder(selectedOrder)"
                      :loading="completingOrderId === selectedOrder?.orderId" @click="completeOrder(selectedOrder)">
                      Hoàn thành
                    </v-btn>

                    <v-btn color="warning" variant="tonal" prepend-icon="mdi-undo"
                      :disabled="!canRevertOrder(selectedOrder)" :loading="revertingOrderId === selectedOrder?.orderId"
                      @click="openRevertReasonDialog(selectedOrder)">
                      Quay lại trạng thái trước
                    </v-btn>

                    <v-btn color="error" variant="outlined" :disabled="!canCancelOrder(selectedOrder)"
                      :loading="cancellingOrderId === selectedOrder?.orderId" @click="cancelOrder(selectedOrder)">
                      Hủy đơn
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="showSnackbar" :color="snackbarColor" timeout="3000" top>
      {{ snackbarMessage }}
    </v-snackbar>

    <v-dialog v-model="revertReasonDialog" max-width="560">
      <v-card rounded="lg">
        <v-card-title>Lý do quay lại trạng thái</v-card-title>
        <v-card-text>
          <v-textarea v-model="revertReason" label="Nhập lý do"
            placeholder="Ví dụ: khách xin đổi lại lịch giao / thao tác nhầm trạng thái" variant="outlined" rows="4"
            auto-grow :error="revertReasonError" :error-messages="revertReasonError ? 'Vui lòng nhập lý do' : ''" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeRevertReasonDialog">Hủy</v-btn>
          <v-btn color="warning" variant="flat" :loading="revertingOrderId === revertTargetOrder?.orderId"
            @click="submitRevertOrder">
            Xác nhận quay lại
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import paymentApi from '@/api/paymentApi'

const orders = ref([])
const searchKeyword = ref('')
const paymentTab = ref('online')
const isLoading = ref(false)
const confirmingOrderId = ref(null)
const cancellingOrderId = ref(null)
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')
const revertingOrderId = ref(null)
const startingShippingOrderId = ref(null)
const completingDeliveryOrderId = ref(null)
const completingOrderId = ref(null)
const uiShippingStartedOrderIds = ref(new Set())
const uiDeliveredOrderIds = ref(new Set())
const revertReasonDialog = ref(false)
const revertReason = ref('')
const revertReasonError = ref(false)
const revertTargetOrder = ref(null)
const detailDialog = ref(false)
const selectedOrder = ref(null)
const timelineRevealCount = ref(0)
const timelineTimer = ref(null)

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

const persistIdSet = (key, setValue) => {
  localStorage.setItem(key, JSON.stringify(Array.from(setValue)))
}

uiShippingStartedOrderIds.value = loadIdSet(ONLINE_SHIPPING_STARTED_KEY)
uiDeliveredOrderIds.value = loadIdSet(UI_DELIVERED_ORDER_IDS_KEY)

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

const isOnlinePaymentMethod = (order) => {
  const method = String(order?.paymentMethod || '').toUpperCase()
  return method === 'BANK_TRANSFER' || method === 'E_WALLET' || method === 'BANKING' || method === 'VNPAY' || method === 'MOMO'
}

const isCodPaymentMethod = (order) => {
  const method = String(order?.paymentMethod || '').toUpperCase()
  return method === 'COD'
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

const isCancelledOrder = (order) => {
  const paymentStatus = String(order?.paymentStatus || '').toUpperCase()
  const orderStatus = String(order?.orderStatus || '').toUpperCase()
  return paymentStatus === 'CANCELLED' || orderStatus === 'CANCELLED'
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

const markUiDelivered = (orderId) => {
  if (!orderId) return
  const next = new Set(uiDeliveredOrderIds.value)
  next.add(orderId)
  uiDeliveredOrderIds.value = next
  persistIdSet(UI_DELIVERED_ORDER_IDS_KEY, next)
}

const clearUiDelivered = (orderId) => {
  if (!orderId) return
  if (!uiDeliveredOrderIds.value.has(orderId)) return
  const next = new Set(uiDeliveredOrderIds.value)
  next.delete(orderId)
  uiDeliveredOrderIds.value = next
  persistIdSet(UI_DELIVERED_ORDER_IDS_KEY, next)
}

const markUiShippingStarted = (orderId) => {
  if (!orderId) return
  const next = new Set(uiShippingStartedOrderIds.value)
  next.add(orderId)
  uiShippingStartedOrderIds.value = next
  persistIdSet(ONLINE_SHIPPING_STARTED_KEY, next)
}

const clearUiShippingStarted = (orderId) => {
  if (!orderId) return
  if (!uiShippingStartedOrderIds.value.has(orderId)) return
  const next = new Set(uiShippingStartedOrderIds.value)
  next.delete(orderId)
  uiShippingStartedOrderIds.value = next
  persistIdSet(ONLINE_SHIPPING_STARTED_KEY, next)
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
  if (stage === 'WAIT_SHIP') return 'Chờ giao hàng'
  if (stage === 'IN_TRANSIT') return 'Đang giao hàng'
  if (stage === 'DELIVERED') return 'Đã giao hàng'
  if (stage === 'COMPLETED') return 'Hoàn thành'
  if (stage === 'CANCELLED') return 'Đã hủy'
  return 'Không xác định'
}

const getPaymentStatusColor = (status) => {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'PAID') return 'success'
  if (normalized === 'UNPAID') return 'warning'
  if (normalized === 'CANCELLED') return 'error'
  return 'info'
}

const getOrderStatusColor = (order) => {
  const stage = getOrderVisualStage(order)
  if (stage === 'COMPLETED') return 'success'
  if (stage === 'DELIVERED') return 'warning'
  if (stage === 'WAIT_CONFIRM' || stage === 'WAIT_SHIP') return 'warning'
  if (stage === 'IN_TRANSIT') return 'primary'
  if (stage === 'CANCELLED') return 'error'
  return 'grey'
}

const buildTimelineSteps = (order) => {
  if (!order) return []

  const createdTime = formatDate(order.orderDate)

  if (isOfflineGuestOrder(order)) {
    const offlineSteps = [
      { code: 'WAIT_CONFIRM', label: 'Chờ xác nhận', icon: 'mdi-text-box-check-outline', time: '-' },
      { code: 'TRANSFER_CONFIRM', label: 'Xác nhận thanh toán', icon: 'mdi-bank-check', time: '-' },
      { code: 'COMPLETED', label: 'Hoàn thành', icon: 'mdi-check-decagram-outline', time: '-' },
    ]

    if (isCancelledOrder(order)) {
      return [
        { ...offlineSteps[0], state: 'done', time: createdTime },
        {
          code: 'CANCELLED',
          label: 'Đã hủy',
          icon: 'mdi-close-octagon-outline',
          state: 'cancelled',
          time: createdTime,
        },
      ]
    }

    const paymentStatus = String(order?.paymentStatus || '').toUpperCase()
    const orderStatus = String(order?.orderStatus || '').toUpperCase()

    let activeIndex = 0
    if (paymentStatus === 'PAID' || orderStatus === 'PAID') {
      activeIndex = 2
    }

    return offlineSteps.map((step, index) => {
      let state = 'pending'
      if (index < activeIndex) state = 'done'
      if (index === activeIndex) state = activeIndex === offlineSteps.length - 1 ? 'done' : 'current'

      const showTime = index === 0 || state === 'done' || state === 'current'

      return {
        ...step,
        state,
        time: showTime ? createdTime : '-',
      }
    })
  }

  const onlinePrepaidSteps = [
    { code: 'WAIT_CONFIRM', label: 'Chờ xác nhận', icon: 'mdi-text-box-check-outline', time: '-' },
    { code: 'TRANSFER_CONFIRM', label: 'Xác nhận thanh toán', icon: 'mdi-bank-check', time: '-' },
    { code: 'WAIT_SHIP', label: 'Chờ giao hàng', icon: 'mdi-package-variant-closed-check', time: '-' },
    { code: 'SHIPPING', label: 'Đang giao hàng', icon: 'mdi-truck-delivery-outline', time: '-' },
    { code: 'DELIVERED', label: 'Đã giao hàng', icon: 'mdi-truck-check-outline', time: '-' },
    { code: 'COMPLETED', label: 'Hoàn thành', icon: 'mdi-check-decagram-outline', time: '-' },
  ]

  const onlineCodSteps = [
    { code: 'WAIT_CONFIRM', label: 'Chờ xác nhận', icon: 'mdi-text-box-check-outline', time: '-' },
    { code: 'WAIT_SHIP', label: 'Chờ giao hàng', icon: 'mdi-package-variant-closed-check', time: '-' },
    { code: 'SHIPPING', label: 'Đang giao hàng', icon: 'mdi-truck-delivery-outline', time: '-' },
    { code: 'DELIVERED', label: 'Đã giao hàng', icon: 'mdi-truck-check-outline', time: '-' },
    { code: 'TRANSFER_CONFIRM', label: 'Xác nhận thanh toán', icon: 'mdi-bank-check', time: '-' },
    { code: 'COMPLETED', label: 'Hoàn thành', icon: 'mdi-check-decagram-outline', time: '-' },
  ]

  const baseSteps = isOnlinePaymentMethod(order) ? onlinePrepaidSteps : onlineCodSteps

  if (isCancelledOrder(order)) {
    return [
      { ...baseSteps[0], state: 'done', time: createdTime },
      {
        code: 'CANCELLED',
        label: 'Đã hủy',
        icon: 'mdi-close-octagon-outline',
        state: 'cancelled',
        time: createdTime,
      },
    ]
  }

  const paymentStatus = String(order?.paymentStatus || '').toUpperCase()
  const orderStatus = String(order?.orderStatus || '').toUpperCase()
  const uiShippingStarted = isUiShippingStartedOrder(order)
  const uiDelivered = isUiDeliveredOrder(order)
  const codFinalActionPending =
    isCodPaymentMethod(order) &&
    paymentStatus === 'PAID' &&
    uiDelivered &&
    orderStatus !== 'PAID'

  let activeIndex = 0

  if (isOnlinePaymentMethod(order)) {
    if (orderStatus === 'PAID') {
      activeIndex = 5
    } else if (paymentStatus === 'UNPAID' && (orderStatus === 'PENDING_PAYMENT' || orderStatus === 'PENDING')) {
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
    } else if (paymentStatus === 'UNPAID' && (orderStatus === 'PENDING_PAYMENT' || orderStatus === 'PENDING')) {
      activeIndex = 0
    } else if (orderStatus === 'SHIPPING' && uiShippingStarted && !uiDelivered) {
      activeIndex = 2
    } else if (orderStatus === 'SHIPPING' && uiDelivered && paymentStatus === 'UNPAID') {
      activeIndex = 3
    } else if (uiDelivered && paymentStatus === 'PAID') {
      activeIndex = 4
    }
  }

  return baseSteps.map((step, index) => {
    let state = 'pending'
    if (index < activeIndex) state = 'done'
    if (index === activeIndex) {
      state = codFinalActionPending
        ? 'current'
        : activeIndex === baseSteps.length - 1
          ? 'done'
          : 'current'
    }

    const showTime = index === 0 || state === 'done' || state === 'current'

    return {
      ...step,
      state,
      time: showTime ? createdTime : '-',
    }
  })
}

const orderTimelineSteps = computed(() => buildTimelineSteps(selectedOrder.value))

const connectorClass = (nextStep) => {
  if (!nextStep) return 'track-connector--pending'
  if (nextStep.state === 'done') return 'track-connector--done'
  if (nextStep.state === 'cancelled') return 'track-connector--cancelled'
  if (nextStep.state === 'current') return 'track-connector--current'
  return 'track-connector--pending'
}

const trackWidthStyle = (steps) => {
  const count = Math.max((steps || []).length, 1)
  return { minWidth: `${count * 190}px` }
}

const isStepVisible = (index) => index < timelineRevealCount.value

const connectorDelayStyle = (index) => ({
  transitionDelay: `${index * 0.18}s`,
})

const clearTimelineTimer = () => {
  if (timelineTimer.value) {
    clearInterval(timelineTimer.value)
    timelineTimer.value = null
  }
}

const startTimelineReveal = () => {
  clearTimelineTimer()
  timelineRevealCount.value = 0

  if (!orderTimelineSteps.value.length) return

  timelineTimer.value = setInterval(() => {
    timelineRevealCount.value += 1

    if (timelineRevealCount.value >= orderTimelineSteps.value.length) {
      clearTimelineTimer()
    }
  }, 180)
}

const canConfirmOrder = (order) => {
  const paymentStatus = String(order?.paymentStatus || '').toUpperCase()
  const orderStatus = String(order?.orderStatus || '').toUpperCase()

  if (paymentStatus !== 'UNPAID') return false

  if (isOfflineGuestOrder(order)) {
    return orderStatus === 'PENDING_PAYMENT' || orderStatus === 'PENDING'
  }

  if (isOnlineOrder(order)) {
    if (isOnlinePaymentMethod(order)) {
      return orderStatus === 'PENDING_PAYMENT'
    }

    if (isCodPaymentMethod(order)) {
      return isUiDeliveredOrder(order)
    }
  }

  return false
}

const canCancelOrder = (order) => {
  const paymentStatus = String(order?.paymentStatus || '').toUpperCase()
  const orderStatus = String(order?.orderStatus || '').toUpperCase()
  return paymentStatus === 'UNPAID' && (orderStatus === 'PENDING_PAYMENT' || orderStatus === 'PENDING')
}

const canRevertOrder = (order) => {
  if (!order) return false

  const paymentStatus = String(order?.paymentStatus || '').toUpperCase()
  const orderStatus = String(order?.orderStatus || '').toUpperCase()

  if (paymentStatus === 'PAID' || orderStatus === 'PAID') return true
  if (paymentStatus === 'CANCELLED' || orderStatus === 'CANCELLED') return true
  if (orderStatus === 'SHIPPING') return true
  if (isUiDeliveredOrder(order)) return true

  return false
}

const canStartShipping = (order) => {
  if (!order || !isOnlineOrder(order)) return false

  const orderStatus = String(order?.orderStatus || '').toUpperCase()
  const paymentStatus = String(order?.paymentStatus || '').toUpperCase()

  if (paymentStatus === 'CANCELLED') return false
  if (isUiShippingStartedOrder(order)) return false

  if (isOnlinePaymentMethod(order)) {
    return paymentStatus === 'PAID' && orderStatus === 'SHIPPING'
  }

  return paymentStatus === 'UNPAID' && (orderStatus === 'PENDING_PAYMENT' || orderStatus === 'PENDING')
}

const canCompleteDelivery = (order) => {
  if (!order || !isOnlineOrder(order)) return false

  const orderStatus = String(order?.orderStatus || '').toUpperCase()
  const paymentStatus = String(order?.paymentStatus || '').toUpperCase()

  if (orderStatus !== 'SHIPPING') return false
  if (paymentStatus === 'CANCELLED') return false
  if (isUiDeliveredOrder(order)) return false
  return true
}

const canCompleteOrder = (order) => {
  if (!order || !isOnlineOrder(order)) return false

  const orderStatus = String(order?.orderStatus || '').toUpperCase()
  const paymentStatus = String(order?.paymentStatus || '').toUpperCase()

  if (orderStatus !== 'SHIPPING') return false
  if (paymentStatus !== 'PAID') return false
  if (!isUiDeliveredOrder(order)) return false

  return true
}

const openOrderDetail = (order) => {
  selectedOrder.value = { ...order }
  detailDialog.value = true
  startTimelineReveal()
}

const applyOrderPatch = (order, patch) => {
  if (!order?.orderId) return

  Object.assign(order, patch)

  const matched = orders.value.find((x) => x.orderId === order.orderId)
  if (matched) {
    Object.assign(matched, patch)
  }

  if (selectedOrder.value?.orderId === order.orderId) {
    selectedOrder.value = {
      ...selectedOrder.value,
      ...patch,
    }
    startTimelineReveal()
  }

  if (
    patch?.orderStatus === 'PENDING_PAYMENT' ||
    patch?.orderStatus === 'CANCELLED' ||
    patch?.orderStatus === 'PENDING'
  ) {
    clearUiDelivered(order.orderId)
    clearUiShippingStarted(order.orderId)
  }
}

const loadOrders = async () => {
  searchKeyword.value = ''
  isLoading.value = true
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

const confirmPayment = async (order) => {
  if (!canConfirmOrder(order)) return

  confirmingOrderId.value = order.orderId
  try {
    const token = localStorage.getItem('token')
    await paymentApi.confirmPayment(order.orderId, token)

    if (isOfflineGuestOrder(order)) {
      applyOrderPatch(order, {
        paymentStatus: 'PAID',
        orderStatus: 'PAID',
      })
    } else {
      applyOrderPatch(order, {
        paymentStatus: 'PAID',
        orderStatus: 'SHIPPING',
      })
      clearUiShippingStarted(order.orderId)
    }

    snackbarMessage.value = `Đã xác nhận thanh toán đơn ${getDisplayOrderCode(order)}`
    snackbarColor.value = 'success'
    showSnackbar.value = true
  } catch (error) {
    console.error('Lỗi xác nhận thanh toán:', error)
    snackbarMessage.value = 'Xác nhận thanh toán thất bại'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  } finally {
    confirmingOrderId.value = null
  }
}

const cancelOrder = async (order) => {
  if (!canCancelOrder(order)) return

  const confirmed = window.confirm(`Bạn có chắc muốn hủy đơn ${getDisplayOrderCode(order)}?`)
  if (!confirmed) return

  cancellingOrderId.value = order.orderId
  try {
    const token = localStorage.getItem('token')
    await paymentApi.cancelOrderByAdmin(order.orderId, token)
    applyOrderPatch(order, {
      paymentStatus: 'CANCELLED',
      orderStatus: 'CANCELLED',
    })

    snackbarMessage.value = `Đã hủy đơn ${getDisplayOrderCode(order)}`
    snackbarColor.value = 'success'
    showSnackbar.value = true
  } catch (error) {
    console.error('Lỗi hủy đơn hàng:', error)
    snackbarMessage.value = 'Hủy đơn thất bại'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  } finally {
    cancellingOrderId.value = null
  }
}

const openRevertReasonDialog = (order) => {
  if (!canRevertOrder(order)) return
  revertTargetOrder.value = order
  revertReason.value = ''
  revertReasonError.value = false
  revertReasonDialog.value = true
}

const closeRevertReasonDialog = () => {
  revertReasonDialog.value = false
  revertReason.value = ''
  revertReasonError.value = false
  revertTargetOrder.value = null
}

const revertOrderStatus = async (order, reason) => {
  if (!canRevertOrder(order)) return

  const normalizedReason = String(reason || '').trim()
  if (!normalizedReason) {
    throw new Error('Vui lòng nhập lý do')
  }

  const paymentStatus = String(order?.paymentStatus || '').toUpperCase()

  if (isUiDeliveredOrder(order) && paymentStatus === 'UNPAID') {
    clearUiDelivered(order.orderId)
    startTimelineReveal()
    snackbarMessage.value = `Đơn ${getDisplayOrderCode(order)} đã quay lại bước Đang vận chuyển (UI)`
    snackbarColor.value = 'success'
    showSnackbar.value = true
    return
  }

  if (isOnlineOrder(order) && isOnlinePaymentMethod(order) && isUiDeliveredOrder(order)) {
    revertingOrderId.value = order.orderId
    try {
      const token = localStorage.getItem('token')
      const response = await paymentApi.revertOrderStatusByAdmin(order.orderId, normalizedReason, token)

      const responseOrderStatus = String(
        response?.data?.orderStatus ||
        response?.data?.status ||
        'SHIPPING'
      ).toUpperCase()

      const responsePaymentStatus = String(
        response?.data?.paymentStatus ||
        'PAID'
      ).toUpperCase()

      clearUiDelivered(order.orderId)
      applyOrderPatch(order, {
        orderStatus: responseOrderStatus || 'SHIPPING',
        paymentStatus: responsePaymentStatus || 'PAID',
      })
      startTimelineReveal()
      snackbarMessage.value = `Đơn ${getDisplayOrderCode(order)} đã quay lại bước Đang giao hàng (UI)`
      snackbarColor.value = 'success'
      showSnackbar.value = true
      return
    } catch (error) {
      console.error('Lỗi quay lại trạng thái online (đã giao hàng):', error)
      snackbarMessage.value = error?.response?.data?.message || 'Quay lại trạng thái thất bại'
      snackbarColor.value = 'error'
      showSnackbar.value = true
      throw error
    } finally {
      revertingOrderId.value = null
    }
  }

  if (isOnlineOrder(order) && isOnlinePaymentMethod(order) && isUiShippingStartedOrder(order)) {
    revertingOrderId.value = order.orderId
    try {
      const token = localStorage.getItem('token')
      const response = await paymentApi.revertOrderStatusByAdmin(order.orderId, normalizedReason, token)

      const responseOrderStatus = String(
        response?.data?.orderStatus ||
        response?.data?.status ||
        'SHIPPING'
      ).toUpperCase()

      const responsePaymentStatus = String(
        response?.data?.paymentStatus ||
        'PAID'
      ).toUpperCase()

      clearUiShippingStarted(order.orderId)
      applyOrderPatch(order, {
        orderStatus: responseOrderStatus || 'SHIPPING',
        paymentStatus: responsePaymentStatus || 'PAID',
      })
      startTimelineReveal()
      snackbarMessage.value = `Đơn ${getDisplayOrderCode(order)} đã quay lại bước Chờ giao hàng (UI)`
      snackbarColor.value = 'success'
      showSnackbar.value = true
      return
    } catch (error) {
      console.error('Lỗi quay lại trạng thái online (đang giao hàng):', error)
      snackbarMessage.value = error?.response?.data?.message || 'Quay lại trạng thái thất bại'
      snackbarColor.value = 'error'
      showSnackbar.value = true
      throw error
    } finally {
      revertingOrderId.value = null
    }
  }

  revertingOrderId.value = order.orderId
  try {
    const token = localStorage.getItem('token')
    const response = await paymentApi.revertOrderStatusByAdmin(order.orderId, normalizedReason, token)

    const responseOrderStatus = String(
      response?.data?.orderStatus ||
      response?.data?.status ||
      order?.orderStatus ||
      ''
    ).toUpperCase()

    const responsePaymentStatus = String(
      response?.data?.paymentStatus ||
      order?.paymentStatus ||
      ''
    ).toUpperCase()

    applyOrderPatch(order, {
      paymentStatus: responsePaymentStatus || 'UNPAID',
      orderStatus: responseOrderStatus || 'PENDING_PAYMENT',
    })

    if (
      isOnlineOrder(order) &&
      isCodPaymentMethod(order) &&
      (responseOrderStatus || '').toUpperCase() === 'SHIPPING' &&
      (responsePaymentStatus || '').toUpperCase() === 'UNPAID'
    ) {
      markUiDelivered(order.orderId)
    }

    snackbarMessage.value = `Đã quay lại trạng thái trước cho đơn ${getDisplayOrderCode(order)}`
    snackbarColor.value = 'success'
    showSnackbar.value = true
  } catch (error) {
    console.error('Lỗi quay lại trạng thái đơn hàng:', error)
    snackbarMessage.value = error?.response?.data?.message || 'Quay lại trạng thái thất bại'
    snackbarColor.value = 'error'
    showSnackbar.value = true
    throw error
  } finally {
    revertingOrderId.value = null
  }
}

const submitRevertOrder = async () => {
  const order = revertTargetOrder.value
  if (!order) return

  const reason = String(revertReason.value || '').trim()
  if (!reason) {
    revertReasonError.value = true
    return
  }

  revertReasonError.value = false
  try {
    await revertOrderStatus(order, reason)
    closeRevertReasonDialog()
  } catch (error) {
    snackbarMessage.value = error?.response?.data?.message || error?.message || 'Quay lại trạng thái thất bại'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  }
}

const startShipping = async (order) => {
  if (!canStartShipping(order)) return

  const confirmed = window.confirm(`Bắt đầu giao hàng cho đơn ${getDisplayOrderCode(order)}?`)
  if (!confirmed) return

  startingShippingOrderId.value = order.orderId
  try {
    const token = localStorage.getItem('token')
    await paymentApi.startShippingByAdmin(order.orderId, token)

    applyOrderPatch(order, {
      orderStatus: 'SHIPPING',
    })
    markUiShippingStarted(order.orderId)
    clearUiDelivered(order.orderId)

    snackbarMessage.value = `Đơn ${getDisplayOrderCode(order)} đã chuyển sang Đang vận chuyển`
    snackbarColor.value = 'success'
    showSnackbar.value = true
  } catch (error) {
    console.error('Lỗi bắt đầu giao hàng:', error)
    snackbarMessage.value = error?.response?.data?.message || 'Không thể bắt đầu giao hàng'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  } finally {
    startingShippingOrderId.value = null
  }
}

const completeDelivery = async (order) => {
  if (!canCompleteDelivery(order)) return

  const confirmed = window.confirm(`Xác nhận đã giao hàng đơn ${getDisplayOrderCode(order)}?`)
  if (!confirmed) return

  completingDeliveryOrderId.value = order.orderId
  try {
    markUiDelivered(order.orderId)
    startTimelineReveal()
    snackbarMessage.value = `Đơn ${getDisplayOrderCode(order)} đã giao hàng (UI)`
    snackbarColor.value = 'success'
    showSnackbar.value = true
  } catch (error) {
    console.error('Lỗi hoàn tất giao hàng:', error)
    snackbarMessage.value = error?.response?.data?.message || 'Không thể hoàn tất giao hàng'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  } finally {
    completingDeliveryOrderId.value = null
  }
}

const completeOrder = async (order) => {
  if (!canCompleteOrder(order)) return

  const confirmed = window.confirm(`Xác nhận hoàn thành đơn ${getDisplayOrderCode(order)}?`)
  if (!confirmed) return

  completingOrderId.value = order.orderId
  try {
    const token = localStorage.getItem('token')
    await paymentApi.completeDeliveryByAdmin(order.orderId, token)

    applyOrderPatch(order, {
      orderStatus: 'PAID',
      paymentStatus: 'PAID',
    })

    snackbarMessage.value = `Đơn ${getDisplayOrderCode(order)} đã hoàn thành`
    snackbarColor.value = 'success'
    showSnackbar.value = true
  } catch (error) {
    console.error('Lỗi hoàn thành đơn hàng:', error)
    snackbarMessage.value = error?.response?.data?.message || 'Không thể hoàn thành đơn hàng'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  } finally {
    completingOrderId.value = null
  }
}

onMounted(loadOrders)

onBeforeUnmount(() => {
  clearTimelineTimer()
})
</script>

<style scoped>
.payment-manage-card {
  padding: 20px;
}

.payment-card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.custom-payment-tabs {
  display: flex;
  gap: 24px;
  border-bottom: 1px solid #e5e7eb;
  margin-top: 8px;
}

.custom-payment-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 15px;
  color: #555;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.custom-payment-tab.active {
  color: #111;
  font-weight: 600;
  border-bottom-color: #111;
}

.order-track-scroll {
  overflow-x: auto;
  padding-bottom: 8px;
}

.order-track {
  display: flex;
  gap: 12px;
  padding-top: 6px;
}

.track-step {
  position: relative;
  flex: 1;
  min-width: 170px;
  text-align: center;
  opacity: 0;
  transform: translateY(10px) scale(0.97);
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.track-step--visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.track-icon {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  margin: 0 auto;
  display: grid;
  place-items: center;
  color: #fff;
  border: 3px solid transparent;
}

.track-icon--done {
  background: #22a745;
}

.track-icon--current {
  background: #f7b500;
}

.track-icon--pending {
  background: #cfd8dc;
  color: #607d8b;
}

.track-icon--cancelled {
  background: #ff5722;
}

.track-connector {
  position: absolute;
  top: 26px;
  left: calc(50% + 34px);
  width: calc(100% - 24px);
  height: 10px;
  border-radius: 999px;
  opacity: 0;
  transform: scaleX(0.5);
  transform-origin: left center;
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.track-step--visible .track-connector {
  opacity: 1;
  transform: scaleX(1);
}

.track-connector--done {
  background: #22a745;
}

.track-connector--current {
  background: #f7b500;
}

.track-connector--pending {
  background: #d9dee3;
}

.track-connector--cancelled {
  background: #ff5722;
}

.track-label {
  margin-top: 10px;
  min-height: 24px;
}

.track-time {
  margin-top: 2px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 0;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.08);
}

.detail-row:last-child {
  border-bottom: 0;
}
</style>