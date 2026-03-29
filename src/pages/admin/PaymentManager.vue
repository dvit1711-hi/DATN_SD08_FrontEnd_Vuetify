<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Xác nhận thanh toán</h1>
        <p class="text-body-2 text-grey">Admin xác nhận các đơn chưa thanh toán</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-refresh" @click="loadOrders" :loading="isLoading">
        Làm mới
      </v-btn>
    </div>

    <v-card rounded="xl" elevation="0" class="pa-2">
      <v-data-table
        :headers="headers"
        :items="orders"
        :loading="isLoading"
        item-key="orderId"
        class="elevation-0"
      >
        <template #item.orderInfo="{ item }">
          <div>
            <div class="font-weight-bold">#{{ item.orderId }}</div>
            <div class="text-caption text-grey">{{ item.accountUsername }} | {{ formatDate(item.orderDate) }}</div>
          </div>
        </template>

        <template #item.paymentStatus="{ item }">
          <v-chip size="small" :color="getPaymentStatusColor(item.paymentStatus)" variant="tonal">
            {{ getPaymentStatusLabel(item.paymentStatus) }}
          </v-chip>
        </template>

        <template #item.paymentMethod="{ item }">
          <v-chip size="small" color="secondary" variant="tonal">
            {{ item.paymentMethod || 'UNKNOWN' }}
          </v-chip>
        </template>

        <template #item.orderStatus="{ item }">
          <v-chip size="small" :color="getOrderStatusColor(item.orderStatus)" variant="tonal">
            {{ getOrderStatusLabel(item.orderStatus) }}
          </v-chip>
        </template>

        <template #item.totalAmount="{ item }">
          <span class="font-weight-bold">{{ formatPrice(item.totalAmount) }}đ</span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex ga-2">
            <v-btn
              color="success"
              variant="flat"
              size="small"
              :disabled="!canConfirmOrder(item)"
              :loading="confirmingOrderId === item.orderId"
              @click="confirmPayment(item)"
            >
              Xác nhận đã thanh toán
            </v-btn>

            <v-btn
              color="error"
              variant="outlined"
              size="small"
              :disabled="!canCancelOrder(item)"
              :loading="cancellingOrderId === item.orderId"
              @click="cancelOrder(item)"
            >
              Hủy đơn
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <v-snackbar v-model="showSnackbar" :color="snackbarColor" timeout="3000" top>
      {{ snackbarMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import paymentApi from '@/api/paymentApi'

const orders = ref([])
const isLoading = ref(false)
const confirmingOrderId = ref(null)
const cancellingOrderId = ref(null)
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

const headers = [
  { title: 'Đơn hàng', key: 'orderInfo', sortable: false },
  { title: 'Phương thức', key: 'paymentMethod' },
  { title: 'Thanh toán', key: 'paymentStatus' },
  { title: 'Trạng thái đơn', key: 'orderStatus' },
  { title: 'Tổng tiền', key: 'totalAmount' },
  { title: 'Thao tác', key: 'actions', sortable: false },
]

const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(value || 0)
const formatDate = (value) => {
  if (!value) return 'N/A'
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
  if (normalized === 'PAID') return 'Đã thanh toán'
  if (normalized === 'PENDING_PAYMENT') return 'Chờ thanh toán'
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

const getOrderStatusColor = (status) => {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'PAID') return 'success'
  if (normalized === 'PENDING_PAYMENT') return 'info'
  if (normalized === 'CANCELLED') return 'error'
  return 'grey'
}

const canConfirmOrder = (order) => {
  const paymentStatus = String(order?.paymentStatus || '').toUpperCase()
  const orderStatus = String(order?.orderStatus || '').toUpperCase()
  return paymentStatus === 'UNPAID' && orderStatus === 'PENDING_PAYMENT'
}

const canCancelOrder = (order) => {
  const paymentStatus = String(order?.paymentStatus || '').toUpperCase()
  const orderStatus = String(order?.orderStatus || '').toUpperCase()
  return paymentStatus === 'UNPAID' && orderStatus === 'PENDING_PAYMENT'
}

const loadOrders = async () => {
  isLoading.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await paymentApi.getAllOrders(token)
    orders.value = (res.data || []).sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
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
    order.paymentStatus = 'PAID'
    order.orderStatus = 'PAID'
    snackbarMessage.value = `Đã xác nhận thanh toán đơn #${order.orderId}`
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

  const confirmed = window.confirm(`Bạn có chắc muốn hủy đơn #${order.orderId}?`)
  if (!confirmed) return

  cancellingOrderId.value = order.orderId
  try {
    const token = localStorage.getItem('token')
    await paymentApi.cancelOrderByAdmin(order.orderId, token)
    order.paymentStatus = 'CANCELLED'
    order.orderStatus = 'CANCELLED'
    snackbarMessage.value = `Đã hủy đơn #${order.orderId}`
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

onMounted(loadOrders)
</script>
