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

        <!-- Loading & Error States -->
        <v-overlay v-if="isLoading" class="d-flex align-center justify-center">
            <v-progress-circular indeterminate color="primary" size="60"></v-progress-circular>
        </v-overlay>

        <v-alert v-if="errorMessage" type="error" closable @click:close="errorMessage = ''">
            {{ errorMessage }}
        </v-alert>

        <v-alert v-if="successMessage" type="success" closable @click:close="successMessage = ''">
            {{ successMessage }}
        </v-alert>

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
                        <td>
                            <v-chip :color="discount.discountType === 'percent' ? 'blue' : 'green'">
                                {{ discount.discountType === 'percent' ? 'Theo phần trăm' : 'Cố định' }}
                            </v-chip>
                        </td>
                        <td class="text-right font-weight-bold">
                            <span v-if="discount.discountType === 'percent'">{{ discount.discountValue }}%</span>
                            <span v-else>{{ formatCurrency(discount.discountValue) }}</span>
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
        <v-dialog v-model="showDialog" max-width="600px">
            <v-card>
                <v-card-title>
                    {{ isEditing ? 'Cập nhật giảm giá' : 'Thêm giảm giá biến thể màu' }}
                </v-card-title>

                <v-card-text class="pt-4">
                    <v-form ref="form" @submit.prevent="saveDiscount">
                        <!-- Product Color Selection -->
                        <v-autocomplete
                            v-model="formData.productColorId"
                            :items="productColors"
                            item-value="id"
                            item-title="displayName"
                            label="Chọn biến thể màu sản phẩm"
                            :disabled="isEditing"
                            :rules="[rules.required]"
                            class="mb-4"
                        ></v-autocomplete>

                        <!-- Discount Type -->
                        <v-select
                            v-model="formData.discountType"
                            :items="['percent', 'fixed']"
                            label="Loại giảm giá"
                            :rules="[rules.required]"
                            class="mb-4"
                        >
                            <template v-slot:item="{ props, item }">
                                <v-list-item v-bind="props">
                                    <template v-slot:title>
                                        {{ item.value === 'percent' ? 'Giảm giá theo phần trăm' : 'Giảm giá cố định' }}
                                    </template>
                                </v-list-item>
                            </template>
                            <template v-slot:selection="{ item }">
                                {{ item.value === 'percent' ? 'Giảm giá theo phần trăm' : 'Giảm giá cố định' }}
                            </template>
                        </v-select>

                        <!-- Discount Value -->
                        <v-text-field
                            v-model.number="formData.discountValue"
                            type="number"
                            :label="`Giá trị giảm ${formData.discountType === 'percent' ? '(%)' : '(đ)'}`"
                            :rules="[rules.required, rules.minValue]"
                            step="0.01"
                            class="mb-4"
                        ></v-text-field>

                        <!-- Max Discount (for percent type) -->
                        <v-text-field
                            v-if="formData.discountType === 'percent'"
                            v-model.number="formData.maxDiscountValue"
                            type="number"
                            label="Giảm tối đa (đ)"
                            step="1000"
                            class="mb-4"
                        ></v-text-field>

                        <!-- Quantity -->
                        <v-text-field
                            v-model.number="formData.quantity"
                            type="number"
                            label="Số lượng"
                            :rules="[rules.required, rules.minQuantity]"
                            class="mb-4"
                        ></v-text-field>

                        <!-- Start Date -->
                        <v-text-field
                            v-model="formData.startDate"
                            type="date"
                            label="Ngày bắt đầu"
                            :rules="[rules.required]"
                            class="mb-4"
                        ></v-text-field>

                        <!-- End Date -->
                        <v-text-field
                            v-model="formData.endDate"
                            type="date"
                            label="Ngày kết thúc"
                            :rules="[rules.required]"
                            class="mb-4"
                        ></v-text-field>

                        <!-- Reason -->
                        <v-select
                            v-model="formData.reason"
                            :items="reasons"
                            label="Lý do giảm giá"
                            class="mb-4"
                        ></v-select>

                        <!-- Description -->
                        <v-textarea
                            v-model="formData.description"
                            label="Mô tả"
                            counter
                            maxlength="500"
                            class="mb-4"
                        ></v-textarea>

                        <!-- Active Status -->
                        <v-switch
                            v-model="formData.active"
                            label="Kích hoạt"
                            class="mb-4"
                        ></v-switch>
                    </v-form>
                </v-card-text>

                <v-card-actions class="justify-end px-6 pb-6">
                    <v-btn @click="closeDialog" variant="outlined">Hủy</v-btn>
                    <v-btn @click="saveDiscount" color="primary" :loading="isSaving">
                        {{ isEditing ? 'Cập nhật' : 'Thêm' }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Delete Confirmation Dialog -->
        <v-dialog v-model="showDeleteDialog" max-width="400px">
            <v-card>
                <v-card-title>Xác nhận xóa</v-card-title>
                <v-card-text>
                    Bạn chắc chắn muốn xóa giảm giá cho biến thể màu
                    <strong>{{ discountToDelete?.productName }} - {{ discountToDelete?.colorName }}</strong>?
                </v-card-text>
                <v-card-actions class="justify-end">
                    <v-btn @click="showDeleteDialog = false" variant="outlined">Hủy</v-btn>
                    <v-btn @click="deleteDiscount" color="error" :loading="isDeleting">
                        Xóa
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
    getDiscountsByReason,
    createProductDiscount,
    updateProductDiscount,
    deleteProductDiscount
} from '@/api/productDiscountApi'
import productColorApi from '@/api/productColorApi'

// Refs
const discounts = ref([])
const productColors = ref([])
const productColorMap = ref(new Map())
const isLoading = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const isEditing = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const filterReason = ref(null)
const filterStatus = ref(null)
const discountToDelete = ref(null)
const editingDiscountId = ref(null)
const form = ref(null)

const reasons = ['slow-selling', 'seasonal', 'overstocked', 'clearance', 'other']
const statusOptions = [
    { title: 'Hoạt động', value: 'active' },
    { title: 'Tắt', value: 'inactive' }
]

// Form Data
const formData = ref({
    productColorId: null,
    discountType: 'percent',
    discountValue: 10,
    maxDiscountValue: null,
    quantity: 100,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reason: 'slow-selling',
    description: '',
    active: true
})

// Validation Rules
const rules = {
    required: v => !!v || 'Không được để trống',
    minValue: v => v > 0 || 'Phải lớn hơn 0',
    minQuantity: v => v >= 1 || 'Số lượng phải >= 1'
}

// Computed Properties
const filteredDiscounts = computed(() => {
    return discounts.value.filter(d => {
        const reasonMatch = !filterReason.value || d.reason === filterReason.value
        const statusMatch = !filterStatus.value || (filterStatus.value === 'active' ? d.active : !d.active)
        return reasonMatch && statusMatch
    })
})

// Methods
const loadDiscounts = async () => {
    isLoading.value = true
    try {
        const response = await getAllProductDiscounts()
        discounts.value = response.data || []
    } catch (error) {
        errorMessage.value = 'Lỗi khi tải dữ liệu giảm giá'
        console.error('Error loading discounts:', error)
    } finally {
        isLoading.value = false
    }
}

const loadProductColors = async () => {
    try {
        const response = await productColorApi.getAll()
        productColors.value = (response.data || []).map(pc => ({
            ...pc,
            displayName: `${pc.productName || 'N/A'} - ${pc.colorName || 'N/A'} (${pc.colorCode || ''})`
        }))
        // Build map for quick image lookup
        productColorMap.value = new Map()
        productColors.value.forEach(pc => {
            const id = Number.parseInt(pc.id ?? pc.productColorID, 10)
            if (Number.isFinite(id)) {
                productColorMap.value.set(id, pc.mainImage || null)
            }
        })
    } catch (error) {
        console.error('Error loading product colors:', error)
    }
}

const openCreateDialog = () => {
    isEditing.value = false
    editingDiscountId.value = null
    formData.value = {
        productColorId: null,
        discountType: 'percent',
        discountValue: 10,
        maxDiscountValue: null,
        quantity: 100,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason: 'slow-selling',
        description: '',
        active: true
    }
    showDialog.value = true
}

const openEditDialog = (discount) => {
    isEditing.value = true
    editingDiscountId.value = discount.id
    formData.value = {
        productColorId: discount.productColorId,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        maxDiscountValue: discount.maxDiscountValue,
        quantity: discount.quantity,
        startDate: discount.startDate,
        endDate: discount.endDate,
        reason: discount.reason,
        description: discount.description,
        active: discount.active
    }
    showDialog.value = true
}

const closeDialog = () => {
    showDialog.value = false
    isEditing.value = false
    editingDiscountId.value = null
    form.value?.reset()
}

const saveDiscount = async () => {
    if (!form.value || !await form.value.validate()) return

    isSaving.value = true
    try {
        if (isEditing.value) {
            await updateProductDiscount(editingDiscountId.value, formData.value)
            successMessage.value = 'Cập nhật giảm giá thành công'
        } else {
            await createProductDiscount(formData.value)
            successMessage.value = 'Thêm giảm giá thành công'
        }
        closeDialog()
        await loadDiscounts()
    } catch (error) {
        errorMessage.value = error.response?.data?.message || 'Lỗi khi lưu giảm giá'
        console.error('Error saving discount:', error)
    } finally {
        isSaving.value = false
    }
}

const confirmDelete = (discount) => {
    discountToDelete.value = discount
    showDeleteDialog.value = true
}

const deleteDiscount = async () => {
    if (!discountToDelete.value) return

    isDeleting.value = true
    try {
        await deleteProductDiscount(discountToDelete.value.id)
        successMessage.value = 'Xóa giảm giá thành công'
        showDeleteDialog.value = false
        await loadDiscounts()
    } catch (error) {
        errorMessage.value = 'Lỗi khi xóa giảm giá'
        console.error('Error deleting discount:', error)
    } finally {
        isDeleting.value = false
    }
}

// Utility Functions
const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('vi-VN')
}

const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(value)
}

const getProductImage = (discount) => {
    if (!discount || !discount.productColorId) return null
    return productColorMap.value.get(Number.parseInt(discount.productColorId, 10)) || null
}

// Lifecycle
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

.discount-table {
    width: 100%;
}

.discount-table thead {
    background-color: #f5f5f5;
}

.discount-table th {
    font-weight: 600;
    color: #333;
    padding: 12px;
}

.discount-table td {
    padding: 12px;
    border-bottom: 1px solid #e0e0e0;
}

.discount-table tbody tr:hover {
    background-color: #fafafa;
}

.product-cell {
    font-size: 14px;
}

.image-cell {
    text-align: center;
    vertical-align: middle;
}

.product-thumbnail {
    border-radius: 6px;
    border: 1px solid #ddd;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.no-data p {
    margin: 0;
    font-size: 14px;
}

.gap-4 {
    gap: 1rem;
}

.gap-2 {
    gap: 0.5rem;
}

.text-grey {
    color: #999;
}

.text-warning {
    color: #ff9800;
}
</style>
