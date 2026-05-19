<template>
  <div class="admin-container">
    <v-card elevation="0">
      <v-card-title class="text-h5 font-weight-bold mb-4">
        Quản Lý Thương Hiệu
      </v-card-title>

      <v-card-text>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          class="mb-4"
          @click="openBrandDialog()"
        >
          Thêm Thương Hiệu
        </v-btn>

        <v-data-table
          :headers="brandHeaders"
          :items="brands"
          :loading="loadingBrand"
          class="elevation-1"
        >
          <template #item.status="{ item }">
            <v-chip
              :color="item.status === 'ACTIVE' ? 'success' : 'grey'"
              size="small"
              variant="tonal"
            >
              {{ item.status }}
            </v-chip>
          </template>

          <template #item.actions="{ item }">
            <v-btn
              size="small"
              variant="tonal"
              color="warning"
              prepend-icon="mdi-pencil"
              class="me-2"
              @click="openBrandDialog(item)"
            >
              Sửa
            </v-btn>

            <v-btn
              size="small"
              variant="tonal"
              color="error"
              prepend-icon="mdi-delete"
              @click="deleteBrand(item.brandID)"
            >
              Xóa
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Dialog -->
    <v-dialog v-model="brandDialog" max-width="500">
      <v-card>
        <v-card-title>
          {{ editingBrand.brandID ? 'Sửa Thương Hiệu' : 'Thêm Thương Hiệu' }}
        </v-card-title>

        <v-card-text>
          <v-text-field
            v-model="editingBrand.name"
            label="Tên Thương Hiệu"
            placeholder="Nhập tên thương hiệu"
          />

          <v-select
            v-model="editingBrand.status"
            :items="statusOptions"
            label="Trạng thái"
            class="mt-3"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="brandDialog = false">Hủy</v-btn>
          <v-btn color="primary" @click="saveBrand">
            Lưu
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      timeout="3000"
    >
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import brandApi from '@/api/brandApi'

const statusOptions = ['ACTIVE', 'INACTIVE']

const brands = ref([])
const loadingBrand = ref(false)

const brandDialog = ref(false)

const editingBrand = ref({
  brandID: 0,
  name: '',
  status: 'ACTIVE'
})

const brandHeaders = [
  {
    title: 'ID',
    key: 'brandID',
    width: '100px'
  },
  {
    title: 'Tên Thương Hiệu',
    key: 'name'
  },
  {
    title: 'Trạng Thái',
    key: 'status',
    width: '150px'
  },
  {
    title: 'Hành Động',
    key: 'actions',
    width: '220px',
    sortable: false
  }
]

const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

const showSnackbar = (message, color = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  snackbar.value = true
}

const loadBrands = async () => {
  loadingBrand.value = true

  try {
    const response = await brandApi.getAll()
    brands.value = response.data
  } catch (error) {
    console.error(error)
    showSnackbar('Lỗi khi tải danh sách thương hiệu', 'error')
  } finally {
    loadingBrand.value = false
  }
}

const openBrandDialog = (item = null) => {
  if (item && item.brandID) {
    editingBrand.value = {
      brandID: item.brandID,
      name: item.name ?? '',
      status: item.status ?? 'ACTIVE'
    }
  } else {
    editingBrand.value = {
      brandID: 0,
      name: '',
      status: 'ACTIVE'
    }
  }

  brandDialog.value = true
}

const saveBrand = async () => {
  if (!editingBrand.value.name?.trim()) {
    showSnackbar('Vui lòng nhập tên thương hiệu', 'warning')
    return
  }

  try {
    const payload = {
      name: editingBrand.value.name.trim(),
      status: editingBrand.value.status
    }

    if (editingBrand.value.brandID) {
      await brandApi.update(
        editingBrand.value.brandID,
        payload
      )

      showSnackbar('Cập nhật thương hiệu thành công')
    } else {
      await brandApi.create(payload)

      showSnackbar('Thêm thương hiệu thành công')
    }

    brandDialog.value = false

    await loadBrands()
  } catch (error) {
    console.error(error)

    showSnackbar(
      error?.response?.data ||
      'Lỗi khi lưu thương hiệu',
      'error'
    )
  }
}

const deleteBrand = async (brandID) => {
  if (!brandID) {
    showSnackbar('Không tìm thấy Brand ID', 'error')
    return
  }

  if (!confirm('Bạn có chắc chắn muốn xóa thương hiệu này?')) {
    return
  }

  try {
    const response = await brandApi.delete(brandID)

    showSnackbar(
      response.data || 'Xóa thương hiệu thành công'
    )

    await loadBrands()
  } catch (error) {
    console.error(error)

    showSnackbar(
      error?.response?.data ||
      'Lỗi khi xóa thương hiệu',
      'error'
    )
  }
}

onMounted(() => {
  loadBrands()
})
</script>

<style scoped>
.admin-container {
  padding: 20px;
  background: #f1f1f1;
  min-height: 100%;
}
</style>