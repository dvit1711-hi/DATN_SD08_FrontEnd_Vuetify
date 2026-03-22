<template>
  <v-container class="py-8" fluid>
    <div class="mb-6 d-flex align-center justify-space-between flex-wrap ga-3">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Lịch sử mua hàng</h1>
        <p class="text-subtitle-1 text-grey">Theo dõi trạng thái đơn và thanh toán của bạn</p>
      </div>
      <v-btn color="primary" variant="outlined" prepend-icon="mdi-refresh" @click="loadOrders">
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
                <v-chip size="small" :color="order.paymentStatus === 'PAID' ? 'success' : 'warning'" variant="tonal">
                  {{ order.paymentStatus }}
                </v-chip>
                <v-chip size="small" color="secondary" variant="tonal">
                  {{ order.paymentMethod || 'UNKNOWN' }}
                </v-chip>
                <v-chip size="small" :color="order.orderStatus === 'PAID' ? 'success' : 'info'" variant="tonal">
                  {{ order.orderStatus }}
                </v-chip>
                <div class="font-weight-bold text-primary">{{ formatPrice(order.totalAmount) }}đ</div>
              </div>
            </div>
          </v-expansion-panel-title>

          <v-expansion-panel-text>
            <v-list lines="two" class="bg-grey-lighten-5 rounded-lg">
              <v-list-item v-for="item in order.items" :key="item.orderDetailId" class="py-2">
                <template #prepend>
                  <v-avatar size="52" rounded="lg" class="mr-3">
                    <v-img :src="item.imageUrl || fallbackImage" cover />
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-medium">{{ item.productName }}</v-list-item-title>
                <v-list-item-subtitle>
                  Màu: {{ item.colorName || 'N/A' }} | Số lượng: {{ item.quantity }} | Giá: {{ formatPrice(item.price) }}đ
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
const fallbackImage = 'https://via.placeholder.com/64x64?text=No+Image'

const isLoggedIn = computed(() => userStore.isLoggedIn)

const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(value || 0)
const formatDate = (value) => {
  if (!value) return 'N/A'
  return new Date(value).toLocaleString('vi-VN')
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
    orders.value = (res.data || []).sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
  } catch (error) {
    console.error('Lỗi tải lịch sử mua hàng:', error)
    orders.value = []
  } finally {
    isLoading.value = false
  }
}

const goLogin = () => router.push({ name: 'Login' })
const goProducts = () => router.push({ name: 'ProductList' })

onMounted(loadOrders)
</script>
