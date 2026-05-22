<template>
    <div class="discount-product-page">
        <!-- Header -->
        <div class="page-header">
            <div class="header-content">
                <h1>Quản Lý Giảm Giá Biến Thể Màu</h1>
                <p class="subtitle">Cập nhật giảm giá cho những biến thể màu sản phẩm bán ế</p>
            </div>
            <v-btn color="primary" @click="openCreateDialog" prepend-icon="mdi-plus">
                Thêm Giảm Giá
            </v-btn>
        </div>

        <!-- Loading State -->
        <v-overlay v-if="isLoading" class="d-flex align-center justify-center">
            <v-progress-circular indeterminate color="primary" size="60"></v-progress-circular>
        </v-overlay>

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

        <!-- Filter Section -->
        <v-card class="mb-6">
            <v-card-text>
                <div class="d-flex gap-4 flex-wrap">
                    <v-select
                        v-model="filterReason"
                        :items="reasons"
                        label="Lọc theo lý do"
                        clearable
                        @update:modelValue="loadDiscounts"
                        class="filter-select"
                    ></v-select>

                    <v-select
                        v-model="filterStatus"
                        :items="statusOptions"
                        label="Lọc theo trạng thái"
                        clearable
                        @update:modelValue="loadDiscounts"
                        class="filter-select"
                    ></v-select>
                </div>
            </v-card-text>
        </v-card>

        <!-- Discounts Table -->
        <v-card>
            <v-table class="discount-table">
                <thead>
                    <tr>
                        <th class="text-left">Hình ảnh</th>
                        <th class="text-left">Sản phẩm</th>
                        <th class="text-left">Biến thể</th>
                        <th class="text-left">Loại giảm</th>
                        <th class="text-right">Giá trị</th>
                        <th class="text-right">Số lượng</th>
                        <th class="text-right">Đã dùng</th>
                        <th class="text-left">Ngày bắt đầu</th>
                        <th class="text-left">Ngày kết thúc</th>
                        <th class="text-center">Trạng thái</th>
                        <th class="text-center">Hành động</th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="discount in filteredDiscounts" :key="discount.id">
                        <td class="image-cell">
                            <v-img
                                v-if="getProductImage(discount)"
                                :src="getProductImage(discount)"
                                :alt="discount.productName"
                                width="60"
                                height="60"
                                class="product-thumbnail"
                                cover
                            />
                            <div v-else class="placeholder-image">
                                <v-icon color="grey">mdi-image-off</v-icon>
                            </div>
                        </td>

                        <td class="product-cell">
                            <div class="font-weight-bold">{{ discount.productName }}</div>
                            <div class="text-caption text-grey">- {{ discount.colorName }}</div>
                            <div class="text-caption text-grey">({{ discount.colorCode }})</div>
                            <div v-if="discount.reason" class="text-caption text-warning">
                                {{ discount.reason }}
                            </div>
                        </td>

                        <td class="variant-cell">
                            <div v-if="discount.sizeName" class="size-badge">
                                <v-chip size="small" variant="outlined" color="primary">
                                    {{ discount.sizeName }}
                                </v-chip>
                            </div>
                            <div v-else class="text-caption text-grey">-</div>
                        </td>

                        <td>
                            <v-chip :color="discount.discountType === 'percent' ? 'blue' : 'green'">
                                {{ discount.discountType === 'percent' ? 'Theo phần trăm' : 'Cố định' }}
                            </v-chip>
                        </td>

                        <td class="text-right font-weight-bold">
                            <span v-if="discount.discountType === 'percent'">
                                {{ discount.discountValue }}%
                            </span>
                            <span v-else>
                                {{ formatCurrency(discount.discountValue) }}
                            </span>
                            <div v-if="discount.maxDiscountValue" class="text-caption">
                                Tối đa: {{ formatCurrency(discount.maxDiscountValue) }}
                            </div>
                        </td>

                        <td class="text-right">{{ discount.quantity }}</td>

                        <td class="text-right">
                            <span class="font-weight-bold">{{ discount.quantityUsed }}</span>
                            <div class="text-caption">
                                {{ discount.quantity > 0 ? Math.round((discount.quantityUsed / discount.quantity) * 100) : 0 }}%
                            </div>
                        </td>

                        <td class="text-left">{{ formatDate(discount.startDate) }}</td>
                        <td class="text-left">{{ formatDate(discount.endDate) }}</td>

                        <td class="text-center">
                            <v-chip :color="discount.active ? 'success' : 'error'">
                                {{ discount.active ? 'Hoạt động' : 'Tắt' }}
                            </v-chip>
                        </td>

                        <td class="text-center">
                            <v-btn
                                icon="mdi-pencil"
                                size="small"
                                variant="text"
                                @click="openEditDialog(discount)"
                                title="Sửa"
                            ></v-btn>
                            <v-btn
                                icon="mdi-delete"
                                size="small"
                                variant="text"
                                color="error"
                                @click="confirmDelete(discount)"
                                title="Xóa"
                            ></v-btn>
                        </td>
                    </tr>
                </tbody>
            </v-table>

            <div v-if="filteredDiscounts.length === 0" class="no-data">
                <v-icon size="48" color="grey">mdi-inbox-outline</v-icon>
                <p class="mt-2">Không có dữ liệu giảm giá biến thể màu</p>
            </div>
        </v-card>

        <!-- Create/Edit Dialog -->
        <v-dialog v-model="showDialog" max-width="800px">
            <v-card>
                <v-card-title class="pa-6 pb-2">
                    {{ isEditing ? 'Cập nhật giảm giá' : 'Thêm giảm giá biến thể màu' }}
                </v-card-title>

                <v-card-text class="pt-4 px-6">
                    <v-form ref="form" validate-on="submit" @submit.prevent="saveDiscount">
                        <!-- Product Color Selection -->
                        <v-autocomplete
                            v-model="formData.productColorId"
                            :items="productColorsForSelect"
                            item-value="_normalizedId"
                            item-title="displayName"
                            label="Chọn biến thể màu sản phẩm"
                            :disabled="isEditing"
                            :rules="[rules.required]"
                            class="mb-4"
                            return-object
                            @update:modelValue="onColorSelected"
                        >
                            <template #item="{ props, item }">
                                <v-list-item
                                    v-bind="props"
                                    :disabled="item.raw?.disabled"
                                    :class="{ 'item-disabled': item.raw?.disabled }"
                                    :subtitle="getItemSubtitle(item.raw)"
                                >
                                    <template #prepend>
                                        <!-- FIX: Dùng normalizeColorCode để đảm bảo luôn có màu hợp lệ -->
                                        <span
                                            class="color-swatch-small"
                                            :style="getSwatchStyle(item.raw?.colorCode)"
                                        />
                                    </template>
                                    <template #append>
                                        <v-chip
                                            v-if="item.raw?.outOfStock"
                                            size="x-small"
                                            color="error"
                                            variant="tonal"
                                            class="ml-2"
                                        >Hết hàng</v-chip>
                                        <v-chip
                                            v-else-if="item.raw?.alreadyHasDiscount"
                                            size="x-small"
                                            color="warning"
                                            variant="tonal"
                                            class="ml-2"
                                        >Đã có giảm giá</v-chip>
                                    </template>
                                </v-list-item>
                            </template>

                            <template #selection="{ item }">
                                <div class="selected-variant">
                                    <!-- FIX: Dùng getSwatchStyle thay vì check colorCode trực tiếp -->
                                    <span
                                        class="color-swatch-small"
                                        :style="getSwatchStyle(item.raw?.colorCode)"
                                    />
                                    <span>{{ item.raw?.displayName || item.raw?.productName }}</span>
                                </div>
                            </template>
                        </v-autocomplete>

                        <!-- Warning: selected item has discount already -->
                        <div v-if="selectedVariantAlreadyHasDiscount" class="duplicate-warning mb-4">
                            <v-icon size="18" color="warning">mdi-alert-circle-outline</v-icon>
                            <span>
                                Biến thể <strong>{{ selectedVariantPreview?.productName }} – {{ selectedVariantPreview?.colorName }}</strong>
                                đã có chương trình giảm giá. Vui lòng chọn biến thể khác hoặc
                                <span class="warning-link" @click="goEditExistingDiscount">chỉnh sửa giảm giá hiện tại</span>.
                            </span>
                        </div>

                        <!-- Selected Variant Preview -->
                        <div v-if="selectedVariantPreview && !selectedVariantAlreadyHasDiscount" class="variant-preview-card mb-4">
                            <div class="variant-preview-header">
                                <v-icon size="20" color="primary">mdi-palette</v-icon>
                                <span class="font-weight-bold">Thông tin biến thể đã chọn</span>
                            </div>
                            <div class="variant-preview-grid">
                                <div class="preview-item">
                                    <span class="preview-label">Sản phẩm:</span>
                                    <span class="preview-value">{{ selectedVariantPreview.productName }}</span>
                                </div>
                                <div class="preview-item">
                                    <span class="preview-label">Màu:</span>
                                    <div class="preview-value-color">
                                        <!-- FIX: Dùng getSwatchStyle cho preview card -->
                                        <span
                                            class="color-swatch-preview"
                                            :style="getSwatchStyle(selectedVariantPreview.colorCode, true)"
                                        />
                                        <span>{{ selectedVariantPreview.colorName }}</span>
                                    </div>
                                </div>
                                <div class="preview-item">
                                    <span class="preview-label">Size:</span>
                                    <v-chip size="small" variant="tonal" color="primary">
                                        {{ selectedVariantPreview.sizeName || '-' }}
                                    </v-chip>
                                </div>
                            </div>
                        </div>

                        <!-- Row: Discount Type + Discount Value -->
                        <div class="form-row-2col mb-4">
                            <v-select
                                v-model="formData.discountType"
                                :items="discountTypeItems"
                                item-value="value"
                                item-title="title"
                                label="Loại giảm giá"
                                :rules="[rules.required]"
                            ></v-select>

                            <v-text-field
                                v-model="formData.discountValue"
                                inputmode="numeric"
                                :label="`Giá trị giảm ${formData.discountType === 'percent' ? '(%)' : '(đ)'}`"
                                :rules="discountValueRules"
                                :hint="formData.discountType === 'percent' ? 'Nhập từ 1 đến 99' : 'Nhập số tiền giảm (VNĐ)'"
                                persistent-hint
                                @keypress="onlyPositiveInt"
                            ></v-text-field>
                        </div>

                        <!-- Max Discount (percent only) + Quantity -->
                        <div class="form-row-2col mb-4">
                            <v-text-field
                                v-if="formData.discountType === 'percent'"
                                v-model="formData.maxDiscountValue"
                                inputmode="numeric"
                                label="Giảm tối đa (đ)"
                                :rules="[rules.required, rules.positiveNumber]"
                                hint="Số tiền giảm tối đa (VNĐ)"
                                persistent-hint
                                @keypress="onlyPositiveInt"
                            ></v-text-field>
                            <div v-else></div>

                            <v-text-field
                                v-model="formData.quantity"
                                inputmode="numeric"
                                label="Số lượng"
                                :rules="[rules.required, rules.positiveNumber]"
                                hint="Phải lớn hơn 0"
                                persistent-hint
                                @keypress="onlyPositiveInt"
                            ></v-text-field>
                        </div>

                        <!-- Row: Start Date + End Date -->
                        <div class="form-row-2col mb-4">
                            <v-text-field
                                v-model="formData.startDate"
                                type="date"
                                label="Ngày bắt đầu"
                                :rules="[rules.required]"
                            ></v-text-field>

                            <v-text-field
                                v-model="formData.endDate"
                                type="date"
                                label="Ngày kết thúc"
                                :rules="[rules.required, rules.endDateAfterStart]"
                            ></v-text-field>
                        </div>

                        <!-- Row: Reason + Active -->
                        <div class="form-row-2col mb-4">
                            <v-select
                                v-model="formData.reason"
                                :items="reasons"
                                label="Lý do giảm giá"
                                :rules="[rules.required]"
                            ></v-select>

                            <div class="d-flex align-center">
                                <v-switch
                                    v-model="formData.active"
                                    label="Kích hoạt"
                                    color="primary"
                                ></v-switch>
                            </div>
                        </div>

                        <!-- Description -->
                        <v-textarea
                            v-model="formData.description"
                            label="Mô tả"
                            counter
                            maxlength="500"
                            :rules="[rules.required]"
                            rows="3"
                            class="mb-4"
                        ></v-textarea>
                    </v-form>
                </v-card-text>

                <v-card-actions class="justify-end px-6 pb-6">
                    <v-btn @click="closeDialog" variant="outlined">Hủy</v-btn>
                    <v-btn
                        @click="saveDiscount"
                        color="primary"
                        :loading="isSaving"
                        :disabled="selectedVariantAlreadyHasDiscount && !isEditing"
                    >
                        {{ isEditing ? 'Cập nhật' : 'Thêm' }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

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
                    <template v-if="deleteWillDeactivate">
                        <v-alert type="warning" variant="tonal" density="compact" class="mb-3">
                            Giảm giá này đã được
                            <strong>{{ discountToDelete?.quantityUsed }} lượt</strong> sử dụng.
                            Không thể xóa vì ràng buộc dữ liệu.
                        </v-alert>
                        <p class="text-body-2 text-grey-darken-1">
                            Hệ thống sẽ <strong>tắt kích hoạt</strong> giảm giá cho biến thể
                            <strong>{{ discountToDelete?.productName }} – {{ discountToDelete?.colorName }}</strong>
                            thay vì xóa, để giữ toàn vẹn dữ liệu đơn hàng cũ.
                        </p>
                    </template>

                    <template v-else>
                        <p class="text-body-2">
                            Bạn chắc chắn muốn xóa giảm giá cho biến thể màu
                            <strong>{{ discountToDelete?.productName }} – {{ discountToDelete?.colorName }}</strong>?
                        </p>
                        <p class="text-caption text-grey mt-1">Hành động này không thể hoàn tác.</p>
                    </template>
                </v-card-text>

                <v-card-actions class="justify-end pa-4 pt-0">
                    <v-btn @click="showDeleteDialog = false" variant="outlined">Hủy</v-btn>
                    <v-btn
                        @click="deleteDiscount"
                        :color="deleteWillDeactivate ? 'warning' : 'error'"
                        :loading="isDeleting"
                        :prepend-icon="deleteWillDeactivate ? 'mdi-toggle-switch-off-outline' : 'mdi-trash-can-outline'"
                    >
                        {{ deleteWillDeactivate ? 'Tắt kích hoạt' : 'Xóa' }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
    getAllProductDiscounts,
    createProductDiscount,
    updateProductDiscount,
    deleteProductDiscount
} from '@/api/productDiscountApi'
import productColorApi from '@/api/productColorApi'

// ─── Refs ────────────────────────────────────────────────────────────────────
const discounts         = ref([])
const productColors     = ref([])
const productColorMap   = ref(new Map())
const isLoading         = ref(false)
const isSaving          = ref(false)
const isDeleting        = ref(false)
const showDialog        = ref(false)
const showDeleteDialog  = ref(false)
const isEditing         = ref(false)
const filterReason      = ref(null)
const filterStatus      = ref(null)
const discountToDelete  = ref(null)
const editingDiscountId = ref(null)
const form              = ref(null)

// ─── Toast Notification ───────────────────────────────────────────────────────
const snackbar      = ref(false)
const toastMessage  = ref('')
const snackbarColor = ref('success')
const snackbarIcon  = ref('mdi-check-circle')

const showMessage = (text, type = 'success') => {
    toastMessage.value = text
    snackbarColor.value =
        type === 'error'   ? 'error'   :
        type === 'warning' ? 'warning' : 'success'
    snackbarIcon.value =
        type === 'error'   ? 'mdi-close-circle'  :
        type === 'warning' ? 'mdi-alert-circle'  : 'mdi-check-circle'
    snackbar.value = true
}

// ─── Constants ────────────────────────────────────────────────────────────────
const reasons = ['Bán chậm', 'Theo mùa', 'Hàng tồn kho quá nhiều', 'Thanh lý', 'Khác']

const statusOptions = [
    { title: 'Hoạt động', value: 'active'   },
    { title: 'Tắt',       value: 'inactive' }
]

const discountTypeItems = [
    { title: 'Giảm giá theo phần trăm', value: 'percent' },
    { title: 'Giảm giá cố định',        value: 'fixed'   }
]

const getDefaultFormData = () => ({
    productColorId:   null,
    discountType:     null,
    discountValue:    null,
    maxDiscountValue: null,
    quantity:         null,
    startDate:        '',
    endDate:          '',
    reason:           null,
    description:      '',
    active:           true
})

const formData = ref(getDefaultFormData())

// ─── Validation Rules ─────────────────────────────────────────────────────────
const isEmpty = (v) => v === null || v === undefined || v === ''

const rules = {
    required: v => !isEmpty(v) || 'Không được để trống',
    positiveNumber: v => {
        if (isEmpty(v)) return true
        return Number(v) > 0 || 'Phải lớn hơn 0'
    },
    endDateAfterStart: v => {
        if (!formData.value.startDate || !v) return true
        return v >= formData.value.startDate || 'Ngày kết thúc phải sau ngày bắt đầu'
    }
}

const discountValueRules = computed(() => {
    const base = [rules.required, rules.positiveNumber]
    if (formData.value.discountType === 'percent') {
        base.push(v => Number(v) < 100 || 'Phần trăm giảm phải nhỏ hơn 100%')
    }
    return base
})

// ─── FIX: Helper normalize colorCode → luôn trả về CSS color hợp lệ ──────────
/**
 * Chuẩn hóa colorCode từ API thành CSS color hợp lệ.
 * Xử lý các trường hợp:
 *   - null / undefined      → fallback '#e0e0e0'
 *   - '#FF0000'             → giữ nguyên
 *   - 'FF0000' (không có #) → thêm '#'
 *   - 'red', 'blue'...      → CSS named color, dùng trực tiếp
 *   - 'rgb(255,0,0)'        → CSS rgb(), dùng trực tiếp
 */
const normalizeColorCode = (raw) => {
    if (!raw) return null
    const str = String(raw).trim()
    if (!str) return null
    // Đã có # hoặc là tên màu CSS / rgb() / hsl() → dùng thẳng
    if (str.startsWith('#') || str.startsWith('rgb') || str.startsWith('hsl')) return str
    // Là chuỗi hex 3 hoặc 6 ký tự không có #
    if (/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(str)) return '#' + str
    // Tên màu CSS hoặc giá trị khác → trả về nguyên để browser tự xử lý
    return str
}

/**
 * Trả về inline style object cho color swatch.
 * isPreview = true → dùng cho preview card (border-radius 50%)
 */
const getSwatchStyle = (rawColorCode, isPreview = false) => {
    const color = normalizeColorCode(rawColorCode)
    return {
        backgroundColor: color || '#e0e0e0',
        border: color ? '1.5px solid rgba(0,0,0,0.18)' : '1.5px dashed #bbb',
        ...(isPreview ? {} : {})
    }
}

// ─── Computed ─────────────────────────────────────────────────────────────────
const discountedColorIds = computed(() => new Set(
    discounts.value
        .filter(d => !isEditing.value || d.id !== editingDiscountId.value)
        .map(d => Number(d.productColorId))
))

const productColorsForSelect = computed(() =>
    productColors.value.map(pc => {
        const outOfStock         = pc._stockQty <= 0
        const alreadyHasDiscount = discountedColorIds.value.has(pc._normalizedId)
        return {
            ...pc,
            outOfStock,
            alreadyHasDiscount,
            disabled: outOfStock || alreadyHasDiscount
        }
    })
)

const filteredDiscounts = computed(() =>
    discounts.value.filter(d => {
        const reasonMatch = !filterReason.value || d.reason === filterReason.value
        const statusMatch = !filterStatus.value ||
            (filterStatus.value === 'active' ? d.active : !d.active)
        return reasonMatch && statusMatch
    })
)

const selectedVariantPreview = computed(() => {
    const v = formData.value.productColorId
    if (!v) return null
    if (typeof v === 'object') return v
    return productColors.value.find(pc => pc._normalizedId === Number(v)) || null
})

const selectedVariantAlreadyHasDiscount = computed(() => {
    if (isEditing.value) return false
    const preview = selectedVariantPreview.value
    if (!preview) return false
    return discountedColorIds.value.has(preview._normalizedId)
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
const resolveColorId = () => {
    const v = formData.value.productColorId
    if (!v) return null
    return typeof v === 'object' ? v._normalizedId : Number(v)
}

const onColorSelected = (val) => {
    formData.value.productColorId = val
}

const onlyPositiveInt = (e) => {
    if (!/^\d$/.test(e.key)) e.preventDefault()
}

const getItemSubtitle = (raw) => {
    if (!raw) return ''
    const parts = []
    if (raw.colorName) parts.push(`Màu: ${raw.colorName}`)
    if (raw.sizeName)  parts.push(`Size: ${raw.sizeName}`)
    return parts.join(' | ') || ''
}

const goEditExistingDiscount = () => {
    const preview = selectedVariantPreview.value
    if (!preview) return
    const existing = discounts.value.find(d => Number(d.productColorId) === preview._normalizedId)
    if (existing) {
        closeDialog()
        openEditDialog(existing)
    }
}

// ─── Data Loading ─────────────────────────────────────────────────────────────
const loadDiscounts = async () => {
    isLoading.value = true
    try {
        const response = await getAllProductDiscounts()
        discounts.value = response.data || []
    } catch (error) {
        showMessage('Lỗi khi tải dữ liệu giảm giá', 'error')
        console.error('Error loading discounts:', error)
    } finally {
        isLoading.value = false
    }
}

const loadProductColors = async () => {
    try {
        const response = await productColorApi.getAll()
        const raw = response.data || []

        if (raw.length > 0) {
            console.log('[ProductColor] Sample keys:', Object.keys(raw[0]))
            console.log('[ProductColor] Sample item:', JSON.stringify(raw[0], null, 2))
        }

        productColors.value = raw.map(pc => {
            // ── ID ────────────────────────────────────────────────────────────
            const nid = Number.parseInt(
                pc.id ?? pc.productColorId ?? pc.productColorID ?? pc.variantId ?? pc.colorVariantId,
                10
            )

            // ── Tên sản phẩm ─────────────────────────────────────────────────
            const productName =
                pc.productName   ??
                pc.product?.name ??
                pc.name          ??
                pc.productTitle  ??
                '(Không có tên)'

            // ── Tên màu ──────────────────────────────────────────────────────
            const colorName =
                pc.colorName     ??
                pc.color?.name   ??
                pc.colour        ??
                pc.colorLabel    ??
                '(Không có màu)'

            // ── FIX: Mã màu hex — normalize ngay tại đây ─────────────────────
            // Thử nhiều field tên có thể từ API, sau đó chuẩn hóa về CSS hợp lệ
            const rawCode =
                pc.colorCode        ??
                pc.color?.code      ??
                pc.color?.hex       ??
                pc.color?.colorCode ??
                pc.hexCode          ??
                pc.colorHex         ??
                pc.hex              ??
                null
            const colorCode = normalizeColorCode(rawCode)

            // ── Tên size ─────────────────────────────────────────────────────
            const sizeName =
                pc.sizeName      ??
                pc.size?.name    ??
                pc.sizeLabel     ??
                null

            // ── Tồn kho ──────────────────────────────────────────────────────
            const stockQty =
                pc.stock             ??
                pc.stockQuantity     ??
                pc.quantity          ??
                pc.inventoryQuantity ??
                pc.remainingQuantity ??
                pc.available         ??
                1

            // ── Ảnh ──────────────────────────────────────────────────────────
            const mainImage =
                pc.mainImage     ??
                pc.imageUrl      ??
                pc.image         ??
                pc.thumbnail     ??
                (pc.images && pc.images[0]) ??
                null

            return {
                ...pc,
                _normalizedId: nid,
                productName,
                colorName,
                colorCode,   // đã được normalize, luôn là CSS hợp lệ hoặc null
                sizeName,
                _stockQty: Number(stockQty),
                mainImage,
                displayName: `${productName} - ${colorName} [${sizeName || '-'}]`
            }
        })

        productColorMap.value = new Map()
        productColors.value.forEach(pc => {
            if (Number.isFinite(pc._normalizedId)) {
                productColorMap.value.set(pc._normalizedId, pc.mainImage || null)
            }
        })
    } catch (error) {
        console.error('Error loading product colors:', error)
    }
}

// ─── Dialog Handlers ──────────────────────────────────────────────────────────
const openCreateDialog = () => {
    isEditing.value         = false
    editingDiscountId.value = null
    formData.value          = getDefaultFormData()
    showDialog.value        = true
    setTimeout(() => form.value?.resetValidation?.(), 0)
}

const openEditDialog = (discount) => {
    isEditing.value         = true
    editingDiscountId.value = discount.id
    const colorObj = productColors.value.find(
        pc => pc._normalizedId === Number(discount.productColorId)
    ) || discount.productColorId
    formData.value = {
        productColorId:   colorObj,
        discountType:     discount.discountType,
        discountValue:    String(discount.discountValue),
        maxDiscountValue: discount.maxDiscountValue ? String(discount.maxDiscountValue) : '',
        quantity:         String(discount.quantity),
        startDate:        toInputDate(discount.startDate),
        endDate:          toInputDate(discount.endDate),
        reason:           discount.reason,
        description:      discount.description,
        active:           discount.active
    }
    showDialog.value = true
    setTimeout(() => form.value?.resetValidation?.(), 0)
}

const closeDialog = () => {
    showDialog.value        = false
    isEditing.value         = false
    editingDiscountId.value = null
    form.value?.resetValidation?.()
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────
const saveDiscount = async () => {
    if (!form.value) return

    if (selectedVariantAlreadyHasDiscount.value) {
        showMessage('Biến thể này đã có chương trình giảm giá. Vui lòng chọn biến thể khác.', 'warning')
        return
    }

    const result = await form.value.validate()
    if (!result.valid) return

    isSaving.value = true
    try {
        const payload = {
            ...formData.value,
            productColorId:   resolveColorId(),
            discountValue:    Number(formData.value.discountValue),
            maxDiscountValue: formData.value.maxDiscountValue ? Number(formData.value.maxDiscountValue) : null,
            quantity:         Number(formData.value.quantity)
        }

        if (isEditing.value) {
            await updateProductDiscount(editingDiscountId.value, payload)
            showMessage('Cập nhật giảm giá thành công', 'success')
        } else {
            await createProductDiscount(payload)
            showMessage('Thêm giảm giá thành công', 'success')
        }
        closeDialog()
        await loadDiscounts()
    } catch (error) {
        showMessage(error.response?.data?.message || 'Lỗi khi lưu giảm giá', 'error')
        console.error('Error saving discount:', error)
    } finally {
        isSaving.value = false
    }
}

const confirmDelete = (discount) => {
    discountToDelete.value = discount
    showDeleteDialog.value = true
}

const deleteWillDeactivate = computed(() =>
    Number(discountToDelete.value?.quantityUsed ?? 0) > 0
)

const deleteDiscount = async () => {
    if (!discountToDelete.value) return
    isDeleting.value = true
    try {
        if (deleteWillDeactivate.value) {
            await updateProductDiscount(discountToDelete.value.id, {
                ...discountToDelete.value,
                active: false
            })
            showMessage(
                `Đã tắt kích hoạt giảm giá "${discountToDelete.value.productName} – ${discountToDelete.value.colorName}" do đã có lượt sử dụng`,
                'warning'
            )
        } else {
            await deleteProductDiscount(discountToDelete.value.id)
            showMessage('Xóa giảm giá thành công', 'success')
        }
        showDeleteDialog.value = false
        await loadDiscounts()
    } catch (error) {
        showMessage(
            error.response?.data?.message || 'Lỗi khi thực hiện thao tác',
            'error'
        )
        console.error('Error deleting/deactivating discount:', error)
    } finally {
        isDeleting.value = false
    }
}

// ─── Utility ──────────────────────────────────────────────────────────────────
const toInputDate = (date) => (!date ? '' : String(date).split('T')[0])

const formatDate = (date) => (!date ? '-' : new Date(date).toLocaleDateString('vi-VN'))

const formatCurrency = (value) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency', currency: 'VND', maximumFractionDigits: 0
    }).format(value || 0)

const getProductImage = (discount) => {
    if (!discount?.productColorId) return null
    return productColorMap.value.get(Number.parseInt(discount.productColorId, 10)) || null
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
    loadDiscounts()
    loadProductColors()
})
</script>

<style scoped>
.discount-product-page {
    padding: 24px;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
}

.header-content h1 {
    font-size: 28px;
    font-weight: bold;
    margin: 0 0 8px 0;
    color: #333;
}

.subtitle {
    color: #666;
    margin: 0;
    font-size: 14px;
}

.filter-select {
    min-width: 200px;
    max-width: 300px;
}

.discount-table { width: 100%; }
.discount-table thead { background-color: #f5f5f5; }
.discount-table th { font-weight: 600; color: #333; padding: 12px; }
.discount-table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
.discount-table tbody tr:hover { background-color: #fafafa; }

.product-cell  { font-size: 14px; }
.image-cell    { text-align: center; vertical-align: middle; }

.product-thumbnail {
    border-radius: 6px;
    border: 1px solid #ddd;
    box-shadow: 0 2px 4px rgba(0,0,0,.1);
}

.placeholder-image {
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
    border-radius: 6px;
    border: 1px dashed #ddd;
}

.no-data {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #999;
    text-align: center;
}
.no-data p { margin: 0; font-size: 14px; }

.gap-4 { gap: 1rem; }
.text-grey    { color: #999; }
.text-warning { color: #ff9800; }

.variant-cell { font-size: 14px; vertical-align: middle; }
.size-badge   { display: flex; align-items: center; gap: 4px; }

/* ── FIX: color-swatch-small không còn dùng class riêng cho empty/filled
   Màu nền được set hoàn toàn qua inline style từ getSwatchStyle() ─────────── */
.color-swatch-small {
    display: inline-block;
    width: 18px;
    height: 18px;
    border-radius: 4px;
    flex-shrink: 0;
    /* border và backgroundColor được set qua getSwatchStyle() */
}

.selected-variant { display: flex; align-items: center; gap: 8px; }

.variant-preview-card {
    padding: 16px;
    background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
    border-radius: 12px;
    border-left: 4px solid #1976d2;
}

.variant-preview-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 14px;
    color: #1976d2;
}

.variant-preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
}

.preview-item   { display: flex; flex-direction: column; gap: 4px; }
.preview-label  { font-size: 12px; color: #666; font-weight: 500; text-transform: uppercase; }
.preview-value  { font-size: 13px; font-weight: 500; color: #333; }

.preview-value-color {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 500;
}

/* ── FIX: color-swatch-preview — border và backgroundColor set qua getSwatchStyle() */
.color-swatch-preview {
    display: inline-block;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    flex-shrink: 0;
}

.form-row-2col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    align-items: start;
}

:deep(.v-list-item--disabled),
:deep(.item-disabled) {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
}

.duplicate-warning {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 14px;
    background-color: #fff8e1;
    border: 1px solid #ffe082;
    border-radius: 8px;
    font-size: 13px;
    color: #5d4037;
    line-height: 1.5;
}

.warning-link {
    color: #e65100;
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
}

.warning-link:hover { color: #bf360c; }

/* ── Toast Notification ──────────────────────────────────────────────────── */
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

.toast-progress.success { background: #1db954; }
.toast-progress.error   { background: #ef5350; }
.toast-progress.warning { background: #ff9800; }

@keyframes progress-animation {
    from { width: 100%; }
    to   { width: 0%;   }
}

:deep(.v-snackbar__wrapper) {
    animation: slideIn 0.25s ease;
}

@keyframes slideIn {
    from { opacity: 0; transform: translateY(-20px); }
    to   { opacity: 1; transform: translateY(0);     }
}
</style>