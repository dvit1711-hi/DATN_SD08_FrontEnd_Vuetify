<template>
  <v-container fluid class="py-8">
    <v-card class="rounded-lg" elevation="0" border>
      <!-- Header -->
      <v-card-title class="d-flex flex-wrap align-center justify-space-between gap-4 pa-6 bg-background">
        <div>
          <div class="text-h5 font-weight-bold">Quản lý mã giảm giá</div>
          <div class="text-body-2 text-grey">Tạo, chỉnh sửa và theo dõi mã khuyến mãi</div>
        </div>

        <v-btn color="primary" size="large" prepend-icon="mdi-plus" @click="openCreateDialog">
          Thêm mã giảm giá
        </v-btn>
      </v-card-title>

      <v-divider />

      <!-- Error Message -->
      <v-alert
        v-if="errorMessage"
        type="error"
        closable
        class="ma-4"
      >
        {{ errorMessage }}
      </v-alert>

      <!-- Filter Section -->
      <v-card-text class="pa-6">
        <v-row class="mb-6">
          <v-col cols="12" md="5">
            <v-text-field
              v-model="search"
              label="Tìm theo mã hoặc tên chương trình"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
            />
          </v-col>

          <v-col cols="12" md="3">
            <v-select
              v-model="statusFilter"
              :items="statusOptions"
              label="Lọc trạng thái"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
        </v-row>

        <!-- Table -->
        <v-data-table
          :headers="headers"
          :items="filteredDiscounts"
          :items-per-page="5"
          class="table-modern"
          border
        >
          <template #item.couponCode="{ item }">
            <div class="font-weight-bold text-primary">{{ item.couponCode }}</div>
          </template>

          <template #item.discountType="{ item }">
            <v-chip 
              size="small" 
              variant="tonal"
              :color="item.discountType === 'percent' ? 'secondary' : 'accent'"
            >
              {{ item.discountType === 'percent' ? 'Phần trăm' : 'Số tiền' }}
            </v-chip>
          </template>

          <template #item.discountValue="{ item }">
            <span class="font-weight-bold">
              <span v-if="item.discountType === 'percent'">{{ item.discountValue }}%</span>
              <span v-else>{{ formatCurrency(item.discountValue) }}</span>
            </span>
          </template>

          <template #item.minOrderValue="{ item }">
            {{ formatCurrency(item.minOrderValue) }}
          </template>

          <template #item.maxDiscountValue="{ item }">
            <span v-if="item.discountType === 'percent'">
              {{ formatCurrency(item.maxDiscountValue) }}
            </span>
            <span v-else class="text-grey">-</span>
          </template>

          <template #item.dateRange="{ item }">
            <div class="text-body-2">{{ formatDate(item.startDate) }}</div>
            <div class="text-caption text-grey">đến {{ formatDate(item.endDate) }}</div>
          </template>

          <template #item.status="{ item }">
            <v-chip
              size="small"
              :color="getStatusColor(item)"
              variant="flat"
            >
              {{ getStatusText(item) }}
            </v-chip>
          </template>

          <template #item.active="{ item }">
            <v-switch
              v-model="item.active"
              color="success"
              hide-details
              inset
            />
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex gap-2">
              <v-btn 
                icon 
                size="small" 
                variant="text" 
                color="primary" 
                @click="openEditDialog(item)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>

              <v-btn 
                icon 
                size="small" 
                variant="text" 
                color="error" 
                @click="removeDiscount(item.id)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Dialog create/update -->
    <v-dialog v-model="dialog" max-width="720">
      <v-card class="rounded-lg">
        <v-card-title class="text-h6 font-weight-bold bg-background pa-6">
          {{ isEdit ? 'Cập nhật mã giảm giá' : 'Thêm mã giảm giá' }}
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.couponCode"
                label="Mã giảm giá"
                variant="outlined"
                hide-details
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.name"
                label="Tên chương trình"
                variant="outlined"
                hide-details
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="form.discountType"
                :items="discountTypeOptions"
                item-title="label"
                item-value="value"
                label="Loại giảm giá"
                variant="outlined"
                hide-details
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="form.discountValue"
                type="number"
                label="Giá trị giảm"
                variant="outlined"
                hide-details
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="form.minOrderValue"
                type="number"
                label="Đơn tối thiểu"
                variant="outlined"
                hide-details
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="form.maxDiscountValue"
                type="number"
                label="Giảm tối đa"
                variant="outlined"
                :disabled="form.discountType === 'fixed'"
                hide-details
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="form.quantity"
                type="number"
                label="Số lượng"
                variant="outlined"
                hide-details
              />
            </v-col>

            <v-col cols="12" md="6" class="d-flex align-center">
              <v-switch
                v-model="form.active"
                label="Kích hoạt"
                color="success"
                hide-details
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.startDate"
                label="Ngày bắt đầu"
                type="date"
                variant="outlined"
                hide-details
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.endDate"
                label="Ngày kết thúc"
                type="date"
                variant="outlined"
                hide-details
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="form.description"
                label="Mô tả"
                variant="outlined"
                rows="3"
                hide-details
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-6 justify-end gap-3">
          <v-btn variant="outlined" @click="closeDialog">Hủy</v-btn>
          <v-btn color="primary" @click="saveDiscount">
            {{ isEdit ? 'Cập nhật' : 'Lưu' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Loading Overlay -->
    <v-overlay v-model="isLoading" contained class="align-center justify-center">
      <v-progress-circular color="primary" indeterminate size="64"></v-progress-circular>
    </v-overlay>
  </v-container>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import {
  getAllDiscountCoupons,
  createDiscountCoupon,
  updateDiscountCoupon,
  deleteDiscountCoupon,
} from '../../api/discountApi'

const search = ref('')
const statusFilter = ref('all')
const dialog = ref(false)
const isEdit = ref(false)
const editingId = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

const statusOptions = [
  { title: 'Tất cả', value: 'all' },
  { title: 'Đang hoạt động', value: 'running' },
  { title: 'Sắp diễn ra', value: 'upcoming' },
  { title: 'Hết hạn', value: 'expired' },
  { title: 'Đã tắt', value: 'inactive' },
]

const discountTypeOptions = [
  { label: 'Phần trăm', value: 'percent' },
  { label: 'Số tiền', value: 'fixed' },
]

const headers = [
  { title: 'Mã', key: 'couponCode' },
  { title: 'Tên chương trình', key: 'name' },
  { title: 'Loại', key: 'discountType' },
  { title: 'Giá trị', key: 'discountValue' },
  { title: 'Đơn tối thiểu', key: 'minOrderValue' },
  { title: 'Giảm tối đa', key: 'maxDiscountValue' },
  { title: 'Thời gian', key: 'dateRange', sortable: false },
  { title: 'Số lượng', key: 'quantity' },
  { title: 'Trạng thái', key: 'status', sortable: false },
  { title: 'Bật/Tắt', key: 'active', sortable: false },
  { title: 'Thao tác', key: 'actions', sortable: false },
]

const discounts = ref([])

const defaultForm = () => ({
  couponCode: '',
  name: '',
  discountType: 'percent',
  discountValue: 0,
  minOrderValue: 0,
  maxDiscountValue: 0,
  quantity: 0,
  startDate: '',
  endDate: '',
  active: true,
  description: '',
})

const form = ref(defaultForm())

// Load all discount coupons on component mount
onMounted(async () => {
  await loadDiscounts()
})

const loadDiscounts = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    const response = await getAllDiscountCoupons()
    discounts.value = response.data || []
  } catch (error) {
    errorMessage.value = 'Tải dữ liệu thất bại. Vui lòng thử lại'
    console.error('Error loading discounts:', error)
  } finally {
    isLoading.value = false
  }
}

const today = () => {
  return new Date().toISOString().split('T')[0]
}

const getStatusText = (item) => {
  const now = today()

  if (!item.active) return 'Đã tắt'
  if (item.endDate < now) return 'Hết hạn'
  if (item.startDate > now) return 'Sắp diễn ra'
  return 'Đang hoạt động'
}

const getStatusColor = (item) => {
  const status = getStatusText(item)
  if (status === 'Đang hoạt động') return 'success'
  if (status === 'Sắp diễn ra') return 'info'
  if (status === 'Hết hạn') return 'error'
  return 'grey'
}

const filteredDiscounts = computed(() => {
  return discounts.value.filter((item) => {
    const keyword = search.value.toLowerCase()
    const matchKeyword =
      item.couponCode.toLowerCase().includes(keyword) ||
      item.name.toLowerCase().includes(keyword)

    let matchStatus = true
    const status = getStatusText(item)

    if (statusFilter.value === 'running') matchStatus = status === 'Đang hoạt động'
    else if (statusFilter.value === 'upcoming') matchStatus = status === 'Sắp diễn ra'
    else if (statusFilter.value === 'expired') matchStatus = status === 'Hết hạn'
    else if (statusFilter.value === 'inactive') matchStatus = status === 'Đã tắt'

    return matchKeyword && matchStatus
  })
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ'
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('vi-VN')
}

const openCreateDialog = () => {
  isEdit.value = false
  editingId.value = null
  form.value = defaultForm()
  dialog.value = true
}

const openEditDialog = (item) => {
  isEdit.value = true
  editingId.value = item.id
  form.value = { ...item }
  dialog.value = true
}

const closeDialog = () => {
  dialog.value = false
}

const saveDiscount = async () => {
  if (!form.value.couponCode || !form.value.name) {
    errorMessage.value = 'Vui lòng nhập mã và tên chương trình'
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''

    if (isEdit.value) {
      // Update existing coupon
      await updateDiscountCoupon(editingId.value, form.value)
      // Reload data after update
      await loadDiscounts()
    } else {
      // Create new coupon
      await createDiscountCoupon(form.value)
      // Reload data after create
      await loadDiscounts()
    }

    closeDialog()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Lưu dữ liệu thất bại. Vui lòng thử lại'
    console.error('Error saving discount:', error)
  } finally {
    isLoading.value = false
  }
}

const removeDiscount = async (id) => {
  const confirmDelete = confirm('Bạn có chắc muốn xóa mã giảm giá này không?')
  if (!confirmDelete) return

  try {
    isLoading.value = true
    errorMessage.value = ''
    await deleteDiscountCoupon(id)
    // Reload data after delete
    await loadDiscounts()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Xóa dữ liệu thất bại. Vui lòng thử lại'
    console.error('Error deleting discount:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
:deep(.v-data-table) {
  border-radius: 8px;
}

:deep(.bg-background) {
  background-color: #F5DEB3;
}

.table-modern :deep(.v-table__wrapper) {
  border-radius: 8px;
  border: 1px solid rgba(205, 186, 150, 0.1);
}

:deep(.v-table__wrapper tbody tr) {
  border-bottom: 1px solid rgba(205, 186, 150, 0.08);
  transition: background-color 0.2s ease;
}

:deep(.v-table__wrapper tbody tr:hover) {
  background-color: rgba(245, 222, 179, 0.5);
}

:deep(.v-chip) {
  font-weight: 500;
}

:deep(.v-card) {
  border-radius: 8px !important;
}
</style>
