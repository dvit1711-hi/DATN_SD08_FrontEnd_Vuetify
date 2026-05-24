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

      <!-- Filter Section -->
      <v-card-text class="pa-6">
        <v-row class="mb-6">
          <v-col cols="12" md="5">
            <v-text-field v-model="search" label="Tìm theo mã hoặc tên chương trình" variant="outlined"
              density="comfortable" prepend-inner-icon="mdi-magnify" clearable hide-details />
          </v-col>

          <v-col cols="12" md="3">
            <v-select v-model="statusFilter" :items="statusOptions" label="Lọc trạng thái" variant="outlined"
              density="comfortable" hide-details />
          </v-col>
        </v-row>

        <!-- Table -->
        <v-data-table :headers="headers" :items="filteredDiscounts" :items-per-page="5" class="table-modern" border>
          <template #item.couponCode="{ item }">
            <div class="font-weight-bold text-primary">{{ item.couponCode }}</div>
          </template>

          <template #item.discountType="{ item }">
            <v-chip size="small" variant="tonal" :color="item.discountType === 'percent' ? 'secondary' : 'accent'">
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
            <v-chip size="small" :color="getStatusColor(item)" variant="flat">
              {{ getStatusText(item) }}
            </v-chip>
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex gap-2">
              <v-btn icon size="small" variant="text" color="primary" @click="openEditDialog(item)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>

              <v-btn icon size="small" variant="text" color="error" @click="removeDiscount(item.id)">
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
          <v-form ref="formRef" validate-on="submit" @submit.prevent="saveDiscount">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.couponCode" label="Mã giảm giá" variant="outlined"
                  :rules="validationRules.required" />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="form.name" label="Tên chương trình" variant="outlined"
                  :rules="validationRules.required" />
              </v-col>

              <v-col cols="12" md="6">
                <v-select v-model="form.discountType" :items="discountTypeOptions" item-title="label" item-value="value"
                  label="Loại giảm giá" variant="outlined" :rules="validationRules.required" />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model.number="form.discountValue" type="number" label="Giá trị giảm" variant="outlined"
                  :rules="validationRules.discountValue" />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model.number="form.minOrderValue" type="number" label="Đơn tối thiểu" variant="outlined"
                  :rules="validationRules.minOrderValue" />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model.number="form.maxDiscountValue" type="number" label="Giảm tối đa"
                  variant="outlined" :disabled="form.discountType === 'fixed'"
                  :rules="validationRules.maxDiscountValue" />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model.number="form.quantity" type="number" label="Số lượng" variant="outlined"
                  :rules="validationRules.minQuantity" />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="form.startDate" label="Ngày bắt đầu" type="date" variant="outlined"
                  :rules="validationRules.startDate" />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="form.endDate" label="Ngày kết thúc" type="date" variant="outlined"
                  :rules="validationRules.endDate" />
              </v-col>

              <v-col cols="12">
                <v-textarea v-model="form.description" label="Mô tả (tùy chọn)" variant="outlined" rows="3"
                  hide-details="auto" />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-6 justify-end gap-3">
          <v-btn variant="outlined" @click="closeDialog">Hủy</v-btn>
          <v-btn color="primary" @click="saveDiscount" :loading="isSaving">
            {{ isEdit ? 'Cập nhật' : 'Lưu' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Toast Notification -->
    <v-snackbar v-model="snackbar" location="top right" :timeout="3000" content-class="custom-snackbar">
      <div class="toast-wrapper">
        <div class="toast-content">
          <v-icon :color="snackbarColor" size="22">{{ snackbarIcon }}</v-icon>
          <span class="toast-text">{{ toastMessage }}</span>
        </div>
        <v-btn icon="mdi-close" size="x-small" variant="text" @click="snackbar = false" />
      </div>
      <div class="toast-progress" :class="snackbarColor"></div>
    </v-snackbar>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="440px">
      <v-card>
        <v-card-title class="pa-5 pb-2 d-flex align-center gap-2">
          <v-icon :color="deleteWillDeactivate ? 'warning' : 'error'" size="22">
            {{ deleteWillDeactivate ? 'mdi-alert-circle-outline' : 'mdi-trash-can-outline' }}
          </v-icon>
          {{ deleteWillDeactivate ? 'Không thể xóa' : 'Xác nhận xóa' }}
        </v-card-title>

        <v-card-text class="pa-5 pt-2">
          <!-- Trường hợp đã được dùng: chỉ tắt trạng thái -->
          <template v-if="deleteWillDeactivate">
            <v-alert type="warning" variant="tonal" density="compact" class="mb-3">
              Mã giảm giá này đã được sử dụng trong đơn hàng nên không thể xóa.
            </v-alert>
            <p class="text-body-2 text-grey-darken-1">
              Hệ thống sẽ tắt kích hoạt mã này thay vì xóa để bảo vệ tính toàn vẹn dữ liệu đơn hàng.
            </p>
          </template>

          <!-- Trường hợp chưa ai dùng: xóa bình thường -->
          <template v-else>
            <p class="text-body-2">
              Bạn có chắc muốn xóa mã giảm giá "<strong>{{ discountToDelete?.couponCode }}</strong>" không?
            </p>
            <p class="text-caption text-grey mt-1">Hành động này không thể hoàn tác.</p>
          </template>
        </v-card-text>

        <v-card-actions class="justify-end pa-4 pt-0">
          <v-btn @click="showDeleteDialog = false" variant="outlined">Hủy</v-btn>
          <v-btn @click="deleteDiscount" :color="deleteWillDeactivate ? 'warning' : 'error'" :loading="isDeleting"
            :prepend-icon="deleteWillDeactivate ? 'mdi-toggle-switch-off-outline' : 'mdi-trash-can-outline'">
            {{ deleteWillDeactivate ? 'Tắt kích hoạt' : 'Xóa' }}
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
import { computed, ref, onMounted, watch } from 'vue'
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
const formRef = ref(null)
const isSaving = ref(false)
const isDeleting = ref(false)
const showDeleteDialog = ref(false)
const discountToDelete = ref(null)

// Toast Notification
const snackbar = ref(false)
const toastMessage = ref('')
const snackbarColor = ref('success')
const snackbarIcon = ref('mdi-check-circle')

const showMessage = (text, type = 'success') => {
  toastMessage.value = text

  snackbarColor.value =
    type === 'error' ? 'error' :
      type === 'warning' ? 'warning' : 'success'

  snackbarIcon.value =
    type === 'error' ? 'mdi-close-circle' :
      type === 'warning' ? 'mdi-alert-circle' : 'mdi-check-circle'

  snackbar.value = true
}

const statusOptions = [
  { title: 'Tất cả', value: 'all' },
  { title: 'Đang hoạt động', value: 'running' },
  { title: 'Sắp diễn ra', value: 'upcoming' },
  { title: 'Hết hạn', value: 'expired' },
  { title: 'Đã tắt', value: 'inactive' },
]

const validationRules = {
  required: [
    (v) => {
      if (v === null || v === undefined || v === '') return 'Không được để trống'
      return true
    },
  ],
  couponCode: [
    (v) => {
      if (v === null || v === undefined || v === '') return 'Mã giảm giá không được để trống'
      return true
    },
  ],
  discountValue: [
    (v) => {
      if (v === null || v === undefined || v === '') return 'Giá trị giảm không được để trống'
      const numVal = Number(v)
      if (numVal <= 0) return 'Giá trị giảm phải lớn hơn 0'
      if (form.value.discountType === 'percent' && numVal > 100) return 'Phần trăm giảm không được vượt quá 100%'
      return true
    },
  ],
  minValue: [
    (v) => {
      if (v === null || v === undefined || v === '') return true
      if (Number(v) < 0) return 'Phải lớn hơn hoặc bằng 0'
      return true
    },
  ],
  minQuantity: [
    (v) => {
      if (v === null || v === undefined || v === '') return 'Số lượng không được để trống'
      if (Number(v) <= 0) return 'Số lượng phải lớn hơn 0'
      return true
    },
  ],
  minOrderValue: [
    (v) => {
      if (v === null || v === undefined || v === '') return true
      const val = Number(v)
      if (val < 0) return 'Đơn tối thiểu phải >= 0'
      return true
    },
  ],
  maxDiscountValue: [
    (v) => {
      if (v === null || v === undefined || v === '') return true
      const val = Number(v)
      if (val < 0) return 'Giảm tối đa phải >= 0'
      return true
    },
  ],
  startDate: [
    (v) => {
      if (!v) return 'Ngày bắt đầu không được để trống'
      const startDate = new Date(v)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (startDate < today) return 'Ngày bắt đầu không được trong quá khứ'
      return true
    },
  ],
  endDate: [
    (v) => {
      if (!v) return 'Ngày kết thúc không được để trống'
      const endDate = new Date(v)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (endDate < today) return 'Ngày kết thúc không được trong quá khứ'
      return true
    },
  ],
}

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
    const response = await getAllDiscountCoupons()
    discounts.value = (response.data || []).map(item => ({
      ...item,
      // Ensure numeric fields have proper defaults
      discountValue: item.discountValue ?? 0,
      minOrderValue: item.minOrderValue ?? 0,
      maxDiscountValue: item.maxDiscountValue ?? 0,
      quantity: item.quantity ?? 0,
      // Ensure boolean field
      active: item.active ?? true,
    }))
  } catch (error) {
    showMessage('Không thể tải dữ liệu mã giảm giá', 'error')
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
  setTimeout(() => formRef.value?.resetValidation?.(), 0)
}

const openEditDialog = (item) => {
  isEdit.value = true
  editingId.value = item.id
  form.value = {
    couponCode: item.couponCode || '',
    name: item.name || '',
    discountType: item.discountType || 'percent',
    discountValue: item.discountValue ?? 0,
    minOrderValue: item.minOrderValue ?? 0,
    maxDiscountValue: item.maxDiscountValue ?? 0,
    quantity: item.quantity ?? 0,
    startDate: item.startDate || '',
    endDate: item.endDate || '',
    active: item.active ?? true,
    description: item.description || '',
  }
  dialog.value = true
  setTimeout(() => formRef.value?.resetValidation?.(), 0)
}

const closeDialog = () => {
  dialog.value = false
  formRef.value?.resetValidation?.()
}

// Sanitize form data before sending to API
const sanitizeFormData = (data) => {
  return {
    couponCode: (data.couponCode || '').trim(),
    name: (data.name || '').trim(),
    discountType: data.discountType || 'percent',
    discountValue: Number(data.discountValue ?? 0) > 0 ? Number(data.discountValue) : 0,
    minOrderValue: Math.max(0, Number(data.minOrderValue ?? 0)),
    maxDiscountValue: Math.max(0, Number(data.maxDiscountValue ?? 0)),
    quantity: Math.max(0, Number(data.quantity ?? 0)),
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    active: Boolean(data.active),
    description: (data.description || '').trim(),
  }
}

const saveDiscount = async () => {
  if (!formRef.value) return

  const result = await formRef.value.validate()
  if (!result.valid) return

  // Validate additional business logic
  if (form.value.startDate > form.value.endDate) {
    showMessage('Ngày bắt đầu phải trước ngày kết thúc', 'warning')
    return
  }

  const startDate = new Date(form.value.startDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (startDate < today) {
    showMessage('Ngày bắt đầu không được trong quá khứ', 'warning')
    return
  }

  // Validate maxDiscountValue for percent type
  if (form.value.discountType === 'percent') {
    if (Number(form.value.discountValue) > 100) {
      showMessage('Phần trăm giảm không được vượt quá 100%', 'warning')
      return
    }
    if (Number(form.value.maxDiscountValue) < Number(form.value.discountValue)) {
      showMessage('Giảm tối đa phải >= giá trị giảm cho loại phần trăm', 'warning')
      return
    }
  }

  // Check for duplicate coupon code (only when creating new)
  if (!isEdit.value) {
    const isDuplicate = discounts.value.some(
      (d) => d.couponCode.toLowerCase() === form.value.couponCode.toLowerCase()
    )
    if (isDuplicate) {
      showMessage('Mã giảm giá này đã tồn tại', 'warning')
      return
    }
  }

  try {
    isSaving.value = true

    // Sanitize data before sending
    const sanitizedData = sanitizeFormData(form.value)

    if (isEdit.value) {
      // Update existing coupon
      await updateDiscountCoupon(editingId.value, sanitizedData)
      showMessage('Cập nhật mã giảm giá thành công', 'success')
    } else {
      // Create new coupon
      await createDiscountCoupon(sanitizedData)
      showMessage('Thêm mã giảm giá thành công', 'success')
    }

    closeDialog()
    await loadDiscounts()
  } catch (error) {
    const errorMsg = error.response?.data?.message || 'Không thể lưu dữ liệu. Vui lòng thử lại'
    showMessage(errorMsg, 'error')
    console.error('Error saving discount:', error)
  } finally {
    isSaving.value = false
  }
}

const deleteWillDeactivate = computed(() => {
  if (!discountToDelete.value) return false
  // Nếu giảm giá đã được dùng, chỉ có thể tắt trạng thái
  return Number(discountToDelete.value.quantityUsed ?? discountToDelete.value.quantity ?? 0) > 0
})

const openDeleteDialog = (item) => {
  discountToDelete.value = item
  showDeleteDialog.value = true
}

const removeDiscount = async (id) => {
  const discount = discounts.value.find(d => d.id === id)
  if (discount) {
    openDeleteDialog(discount)
  }
}

const deleteDiscount = async () => {
  if (!discountToDelete.value) return

  isDeleting.value = true
  try {
    if (deleteWillDeactivate.value) {
      // Đã được sử dụng → chỉ tắt active, không xóa (tránh lỗi FK)
      await updateDiscountCoupon(discountToDelete.value.id, {
        ...discountToDelete.value,
        active: false
      })
      showMessage(
        `Đã tắt kích hoạt mã giảm giá "${discountToDelete.value.couponCode}" do đã có lượt sử dụng`,
        'warning'
      )
    } else {
      // Chưa ai dùng → xóa hẳn
      await deleteDiscountCoupon(discountToDelete.value.id)
      showMessage('Xóa mã giảm giá thành công', 'success')
    }
    showDeleteDialog.value = false
    await loadDiscounts()
  } catch (error) {
    const errorMsg = error.response?.data?.message || 'Không thể thực hiện thao tác. Vui lòng thử lại'
    showMessage(errorMsg, 'error')
    console.error('Error deleting/deactivating discount:', error)
  } finally {
    isDeleting.value = false
  }
}


</script>

<style scoped>
:deep(.v-data-table) {
  border-radius: 8px;
}

:deep(.bg-background) {
  background-color: #f1f1f1;
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

/* ── Toast Notification ─────────────────────────────────────────── */
:deep(.custom-snackbar) {
  padding: 0 !important;
  overflow: hidden;
  border-radius: 12px !important;
  background: white !important;
  min-width: 320px;
}

.toast-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 14px 12px;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toast-text {
  color: #444;
  font-size: 15px;
  font-weight: 500;
}

.toast-progress {
  height: 4px;
  width: 100%;
  animation: progress-animation 3s linear forwards;
}

.toast-progress.success {
  background: #1db954;
}

.toast-progress.error {
  background: #ef5350;
}

.toast-progress.warning {
  background: #ff9800;
}

@keyframes progress-animation {
  from {
    width: 100%;
  }

  to {
    width: 0%;
  }
}

:deep(.v-snackbar__wrapper) {
  animation: slideIn 0.25s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
