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
            <div class="w-100 d-flex align-center justify-space-between flex-wrap ga-2">
              <div>
                <div class="font-weight-bold">Đơn #{{ order.orderId }}</div>
                <div class="text-caption text-grey">{{ formatDate(order.orderDate) }}</div>
              </div>

              <div class="d-flex align-center ga-2">
                <v-chip size="small" :color="getDisplayStatus(order).color" variant="tonal">
                  {{ getDisplayStatus(order).label }}
                </v-chip>
                <v-chip v-if="order.couponCode" size="small" color="orange" variant="tonal">
                  Mã: {{ order.couponCode }}
                </v-chip>
                <v-chip size="small" color="orange" variant="tonal">
                  {{ getPaymentMethodLabel(order.paymentMethod) }}
                </v-chip>
                <div class="font-weight-bold text-black">{{ formatPrice(order.totalAmount) }}đ</div>
              </div>
            </div>
          </v-expansion-panel-title>

          <v-expansion-panel-text>
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
const fallbackImage = 'https://via.placeholder.com/64x64?text=No+Image'
const ONLINE_CONFIRMED_ORDERS_KEY = 'onlineTransferConfirmedOrderIds'
const HIDDEN_CANCELLED_ONLINE_ORDERS_KEY = 'hiddenCancelledOnlineOrderIds'

const isLoggedIn = computed(() => userStore.isLoggedIn)

const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(value || 0)
const formatOrderAddress = (shippingAddress) => {
  const value = String(shippingAddress || '').trim()
  return value.length > 0 ? value : 'Không có địa chỉ cho đơn này'
}

const formatDate = (value) => {
  if (!value) return 'Không có dữ liệu'
  return new Date(value).toLocaleString('vi-VN')
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
  if (normalized === 'PENDING_PAYMENT') return 'Chờ thanh toán'
  if (normalized === 'PAID') return 'Đã thanh toán'
  if (normalized === 'CANCELLED') return 'Đã hủy'
  return 'Không xác định'
}

const getDisplayStatus = (order) => {
  const payment = getPaymentStatusLabel(order?.paymentStatus)
  const orderStatus = getOrderStatusLabel(order?.orderStatus)

  if (payment === 'Đã thanh toán' || orderStatus === 'Đã thanh toán') {
    return { label: 'Đã thanh toán', color: 'success' }
  }
  if (orderStatus === 'Đã hủy') {
    return { label: 'Đã hủy', color: 'error' }
  }
  if (payment === 'Chưa thanh toán' || orderStatus === 'Chờ thanh toán') {
    return { label: 'Chờ thanh toán', color: 'warning' }
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
      .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
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
