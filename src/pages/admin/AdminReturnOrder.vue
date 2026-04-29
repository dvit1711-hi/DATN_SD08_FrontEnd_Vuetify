<template>
  <v-container fluid class="pa-6 return-page">
    <h2 class="text-h6 font-weight-bold mb-4">Trả hàng</h2>

    <v-card rounded="lg" elevation="0" class="pa-5 mb-4">
      <div class="d-flex align-center justify-center ga-3 flex-wrap">
        <div class="font-weight-bold">Mã hóa đơn:</div>

        <v-text-field
          v-model="invoiceCode"
          placeholder="VD: HD13 hoặc mã vận đơn"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="comfortable"
          hide-details
          style="max-width: 420px"
          @keyup.enter="searchOrder"
        />

        <v-btn
          color="deep-orange"
          prepend-icon="mdi-magnify"
          :loading="searching"
          @click="searchOrder"
        >
          Tìm kiếm
        </v-btn>
      </div>
    </v-card>

    <v-alert
      v-if="message"
      :type="messageType"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="message = ''"
    >
      {{ message }}
    </v-alert>

    <template v-if="selectedOrder">
      <!-- BẢNG CHỌN SẢN PHẨM TRẢ -->
      <v-card rounded="lg" elevation="0" class="pa-4 mb-4">
        <v-table>
          <thead>
            <tr>
              <th style="width: 52px"></th>
              <th>Sản phẩm</th>
              <th class="text-center" style="width: 220px">Số lượng có thể trả</th>
              <th class="text-right" style="width: 140px">Đơn giá</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in returnRows" :key="item.orderDetailId">
              <td class="text-center">
                <v-checkbox
                  :model-value="item.checked"
                  density="compact"
                  hide-details
                  :disabled="item.maxReturnQuantity <= 0"
                  @update:modelValue="toggleItem(item, $event)"
                />
              </td>

              <td>
                <div class="d-flex align-center ga-3 py-2">
                  <v-avatar size="56" rounded="lg">
                    <v-img :src="resolveImage(item.imageUrl)" cover />
                  </v-avatar>

                  <div>
                    <div class="font-weight-bold">
                      {{ item.productName }}
                      <span v-if="item.sizeName">[{{ item.sizeName }}]</span>
                    </div>
                    <div class="text-caption text-grey-darken-1">
                      {{ item.colorName || '-' }}
                    </div>
                  </div>
                </div>
              </td>

              <td class="text-center">
                <div class="quantity-control">
                  <v-btn
                    icon="mdi-minus"
                    size="x-small"
                    variant="text"
                    :disabled="!item.checked || item.returnQuantity <= 0"
                    @click="decreaseQty(item)"
                  />
                  <div class="quantity-value">
                    {{ item.returnQuantity }} / {{ item.maxReturnQuantity }}
                  </div>
                  <v-btn
                    icon="mdi-plus"
                    size="x-small"
                    variant="text"
                    :disabled="!item.checked || item.returnQuantity >= item.maxReturnQuantity"
                    @click="increaseQty(item)"
                  />
                </div>
              </td>

              <td class="text-right price-text">
                {{ formatPrice(item.price) }}
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>

      <v-row>
        <!-- DANH SÁCH SP TRẢ -->
        <v-col cols="12" md="8">
          <v-card rounded="lg" elevation="0" class="pa-4 h-100">
            <div class="section-title mb-3">
              <v-icon size="18" class="mr-2">mdi-clipboard-list-outline</v-icon>
              Danh sách sản phẩm trả
            </div>

            <v-table>
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th class="text-center" style="width: 110px">Số lượng</th>
                  <th class="text-right" style="width: 120px">Đơn giá</th>
                  <th class="text-right" style="width: 130px">Tổng</th>
                </tr>
              </thead>

              <tbody>
                <tr v-if="selectedReturnRows.length === 0">
                  <td colspan="4" class="text-center text-grey py-8">
                    Chưa chọn sản phẩm trả
                  </td>
                </tr>

                <tr
                  v-for="item in selectedReturnRows"
                  :key="`selected-${item.orderDetailId}`"
                >
                  <td>
                    <div class="d-flex align-center ga-3 py-2">
                      <v-avatar size="46" rounded="lg">
                        <v-img :src="resolveImage(item.imageUrl)" cover />
                      </v-avatar>

                      <div>
                        <div class="font-weight-medium">{{ item.productName }}</div>
                        <div class="text-caption text-grey-darken-1">
                          {{ item.colorName || '-' }}
                          <span v-if="item.sizeName">[{{ item.sizeName }}]</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td class="text-center">
                    <v-chip size="small" variant="tonal">
                      {{ item.returnQuantity }}
                    </v-chip>
                  </td>

                  <td class="text-right">
                    {{ formatPrice(item.price) }}
                  </td>

                  <td class="text-right text-red font-weight-bold">
                    {{ formatPrice(getReturnLineTotal(item)) }}
                  </td>
                </tr>
              </tbody>
            </v-table>

            <div class="mt-4">
              <v-textarea
                v-model="returnNote"
                label="Ghi chú"
                variant="outlined"
                rows="3"
                auto-grow
                hide-details="auto"
                placeholder="Nhập lý do trả hàng..."
              />
            </div>
          </v-card>
        </v-col>

        <!-- THÔNG TIN HOÀN TRẢ -->
        <v-col cols="12" md="4">
          <v-card rounded="lg" elevation="0" class="pa-4 h-100">
            <div class="return-info-title mb-4">Thông tin hoàn trả</div>

            <div class="customer-info-box mb-4">
              <div class="info-row">
                <v-icon size="18">mdi-account</v-icon>
                <span><strong>Khách hàng:</strong> {{ displayCustomerName }}</span>
              </div>

              <div class="info-row">
                <v-icon size="18">mdi-phone</v-icon>
                <span><strong>SĐT:</strong> {{ displayCustomerPhone }}</span>
              </div>

              <div class="info-row align-start">
                <v-icon size="18">mdi-map-marker</v-icon>
                <span><strong>Địa chỉ:</strong> {{ displayAddress }}</span>
              </div>
            </div>

            <div class="summary-block">
              <div class="summary-row">
                <span>Tổng tiền</span>
                <strong>{{ formatPrice(selectedOrder.totalAmount) }}</strong>
              </div>

              <div class="summary-row">
                <span>Giảm giá</span>
                <strong>{{ formatPrice(selectedOrder.discountAmount || 0) }}</strong>
              </div>

              <div class="summary-row total-row">
                <span>Số tiền hoàn trả</span>
                <strong class="text-red">{{ formatPrice(returnTotal) }}</strong>
              </div>
            </div>

            <v-btn
              color="deep-orange"
              block
              class="mt-4"
              :loading="submitting"
              @click="submitReturn"
            >
              Trả hàng
            </v-btn>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup>
import { computed, ref } from 'vue'
import paymentApi from '@/api/paymentApi'

const API_BASE_IMAGE = ''

const invoiceCode = ref('')
const selectedOrder = ref(null)
const returnRows = ref([])
const returnNote = ref('')
const searching = ref(false)
const submitting = ref(false)
const message = ref('')
const messageType = ref('success')

const getToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken')

const formatPrice = (value) => {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} VND`
}

const resolveImage = (imageUrl) => {
  const value = String(imageUrl || '').trim()

  if (!value) return 'https://via.placeholder.com/80x80?text=No+Image'
  if (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:') ||
    value.startsWith('blob:')
  ) {
    return value
  }

  return value.startsWith('/')
    ? `${API_BASE_IMAGE}${value}`
    : `${API_BASE_IMAGE}/${value}`
}

const displayCustomerName = computed(() => {
  return (
    selectedOrder.value?.customerName ||
    selectedOrder.value?.accountUsername ||
    'Khách hàng'
  )
})

const displayCustomerPhone = computed(() => {
  return (
    selectedOrder.value?.customerPhone ||
    selectedOrder.value?.phone ||
    '-'
  )
})

const displayAddress = computed(() => {
  return selectedOrder.value?.shippingAddress || '-'
})

const selectedReturnRows = computed(() => {
  return returnRows.value.filter(
    (item) => item.checked && Number(item.returnQuantity || 0) > 0
  )
})

const returnTotal = computed(() => {
  return selectedReturnRows.value.reduce((sum, item) => {
    return sum + getReturnLineTotal(item)
  }, 0)
})

const getReturnLineTotal = (item) => {
  return Number(item.price || 0) * Number(item.returnQuantity || 0)
}

const showMessage = (text, type = 'success') => {
  message.value = text
  messageType.value = type
}

const buildRows = (order) => {
  const items = Array.isArray(order?.items) ? order.items : []

  return items.map((item) => {
    const quantity = Number(item.quantity || 0)
    const returnedQuantity = Number(item.returnedQuantity || 0)

    const maxReturnQuantity = Number(
      item.returnableQuantity ??
        item.remainingQuantity ??
        Math.max(0, quantity - returnedQuantity)
    )

    return {
      ...item,
      checked: false,
      returnQuantity: 0,
      maxReturnQuantity,
    }
  })
}

const toggleItem = (item, checked) => {
  item.checked = !!checked

  if (item.checked) {
    if (item.returnQuantity <= 0 && item.maxReturnQuantity > 0) {
      item.returnQuantity = 1
    }
  } else {
    item.returnQuantity = 0
  }
}

const increaseQty = (item) => {
  if (!item.checked) return

  const current = Number(item.returnQuantity || 0)
  const max = Number(item.maxReturnQuantity || 0)

  if (current < max) {
    item.returnQuantity = current + 1
  }
}

const decreaseQty = (item) => {
  if (!item.checked) return

  const current = Number(item.returnQuantity || 0)

  if (current > 0) {
    item.returnQuantity = current - 1
  }

  if (item.returnQuantity <= 0) {
    item.returnQuantity = 0
  }
}

const searchOrder = async () => {
  const code = String(invoiceCode.value || '').trim()

  if (!code) {
    showMessage('Vui lòng nhập mã hóa đơn', 'warning')
    return
  }

  searching.value = true
  try {
    const res = await paymentApi.searchReturnableOrder(code, getToken())
    selectedOrder.value = res.data
    returnRows.value = buildRows(res.data)
    returnNote.value = ''
    showMessage('Tìm thấy đơn hàng có thể trả', 'success')
  } catch (error) {
    selectedOrder.value = null
    returnRows.value = []
    showMessage(
      error?.response?.data?.message || 'Không tìm thấy đơn hàng hợp lệ để trả',
      'error'
    )
  } finally {
    searching.value = false
  }
}

const submitReturn = async () => {
  if (!selectedOrder.value) return

  const items = selectedReturnRows.value.map((item) => ({
    orderDetailId: item.orderDetailId,
    quantity: Number(item.returnQuantity),
    note: String(returnNote.value || '').trim() || 'Trả hàng tại quầy',
  }))

  if (!items.length) {
    showMessage('Vui lòng chọn sản phẩm cần trả', 'warning')
    return
  }

  for (const item of selectedReturnRows.value) {
    if (Number(item.returnQuantity || 0) <= 0) {
      showMessage(`Vui lòng chọn số lượng trả cho ${item.productName}`, 'warning')
      return
    }

    if (Number(item.returnQuantity || 0) > Number(item.maxReturnQuantity || 0)) {
      showMessage(
        `Số lượng trả của ${item.productName} vượt quá số lượng có thể trả`,
        'warning'
      )
      return
    }
  }

  submitting.value = true
  try {
    const res = await paymentApi.returnCompletedOrderByAdmin(
      selectedOrder.value.orderId,
      {
        note: String(returnNote.value || '').trim() || 'Trả hàng tại quầy',
        items,
      },
      getToken()
    )

    selectedOrder.value = res.data
    returnRows.value = buildRows(res.data)
    returnNote.value = ''
    showMessage('Trả hàng thành công', 'success')
  } catch (error) {
    showMessage(error?.response?.data?.message || 'Trả hàng thất bại', 'error')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.return-page {
  background: #f5f6f8;
  min-height: 100%;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 700;
}

.return-info-title {
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  color: #2f8f72;
}

.customer-info-box {
  background: #f3f3f3;
  border-radius: 10px;
  padding: 14px;
}

.info-row {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
  color: #333;
}

.info-row:last-child {
  margin-bottom: 0;
}

.quantity-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #d8d8d8;
  padding-bottom: 2px;
}

.quantity-value {
  min-width: 72px;
  text-align: center;
  font-weight: 600;
  color: #555;
}

.price-text {
  font-weight: 500;
  color: #8a8a8a;
}

.summary-block {
  margin-top: 10px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  font-size: 18px;
}

.total-row {
  font-weight: 700;
}

.text-red {
  color: #ef3d2f;
}
</style>