<template>
  <div class="admin-container">
    <v-card class="mx-auto" elevation="0">
      <v-card-title class="text-h5 font-weight-bold mb-4">
        Quản Lý Brand & Material
      </v-card-title>

      <v-tabs v-model="tab" class="mb-4">
        <v-tab value="brands">
          <v-icon start>mdi-tag</v-icon>
          Brand
        </v-tab>
        <v-tab value="materials">
          <v-icon start>mdi-texture</v-icon>
          Material
        </v-tab>
      </v-tabs>

      <v-window v-model="tab" class="pt-4">
        <!-- Brand -->
        <v-window-item value="brands">
          <v-card-text>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              class="mb-4"
              @click="openBrandDialog()"
            >
              Thêm Brand
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
        </v-window-item>

        <!-- Material -->
        <v-window-item value="materials">
          <v-card-text>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              class="mb-4"
              @click="openMaterialDialog()"
            >
              Thêm Material
            </v-btn>

            <v-data-table
              :headers="materialHeaders"
              :items="materials"
              :loading="loadingMaterial"
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
                  @click="openMaterialDialog(item)"
                >
                  Sửa
                </v-btn>

                <v-btn
                  size="small"
                  variant="tonal"
                  color="error"
                  prepend-icon="mdi-delete"
                  @click="deleteMaterial(item.materialID)"
                >
                  Xóa
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-window-item>
      </v-window>
    </v-card>

    <!-- Brand Dialog -->
    <v-dialog v-model="brandDialog" max-width="500px">
      <v-card>
        <v-card-title>
          {{ editingBrand.brandID ? 'Sửa Brand' : 'Thêm Brand Mới' }}
        </v-card-title>

        <v-card-text class="pt-4">
          <v-text-field
            v-model="editingBrand.name"
            label="Tên Brand"
            required
            placeholder="Nhập tên brand"
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
          <v-btn text @click="brandDialog = false">Hủy</v-btn>
          <v-btn color="primary" @click="saveBrand">Lưu</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Material Dialog -->
    <v-dialog v-model="materialDialog" max-width="500px">
      <v-card>
        <v-card-title>
          {{ editingMaterial.materialID ? 'Sửa Material' : 'Thêm Material Mới' }}
        </v-card-title>

        <v-card-text class="pt-4">
          <v-text-field
            v-model="editingMaterial.materialName"
            label="Tên Material"
            required
            placeholder="Nhập tên chất liệu"
          />

          <v-select
            v-model="editingMaterial.status"
            :items="statusOptions"
            label="Trạng thái"
            class="mt-3"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn text @click="materialDialog = false">Hủy</v-btn>
          <v-btn color="primary" @click="saveMaterial">Lưu</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import brandApi from '@/api/brandApi'
import materialApi from '@/api/materialApi'

const tab = ref('brands')
const statusOptions = ['ACTIVE', 'INACTIVE']

const brands = ref([])
const loadingBrand = ref(false)
const brandDialog = ref(false)
const editingBrand = ref({
  brandID: 0,
  name: '',
  status: 'ACTIVE',
})

const brandHeaders = [
  { title: 'ID', key: 'brandID', width: '100px' },
  { title: 'Tên Brand', key: 'name' },
  { title: 'Trạng thái', key: 'status', width: '150px' },
  { title: 'Hành Động', key: 'actions', width: '220px', sortable: false },
]

const materials = ref([])
const loadingMaterial = ref(false)
const materialDialog = ref(false)
const editingMaterial = ref({
  materialID: 0,
  materialName: '',
  status: 'ACTIVE',
})

const materialHeaders = [
  { title: 'ID', key: 'materialID', width: '100px' },
  { title: 'Tên Material', key: 'materialName' },
  { title: 'Trạng thái', key: 'status', width: '150px' },
  { title: 'Hành Động', key: 'actions', width: '220px', sortable: false },
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
    showSnackbar('Lỗi khi tải danh sách brand', 'error')
  } finally {
    loadingBrand.value = false
  }
}

const loadMaterials = async () => {
  loadingMaterial.value = true
  try {
    const response = await materialApi.getAll()
    materials.value = response.data
  } catch (error) {
    console.error(error)
    showSnackbar('Lỗi khi tải danh sách material', 'error')
  } finally {
    loadingMaterial.value = false
  }
}

const openBrandDialog = (item = null) => {
  if (item && item.brandID) {
    editingBrand.value = {
      brandID: item.brandID,
      name: item.name ?? '',
      status: item.status ?? 'ACTIVE',
    }
  } else {
    editingBrand.value = {
      brandID: 0,
      name: '',
      status: 'ACTIVE',
    }
  }
  brandDialog.value = true
}

const saveBrand = async () => {
  if (!editingBrand.value.name?.trim()) {
    showSnackbar('Vui lòng nhập tên brand', 'warning')
    return
  }

  try {
    const payload = {
      name: editingBrand.value.name.trim(),
      status: editingBrand.value.status,
    }

    if (editingBrand.value.brandID) {
      await brandApi.update(editingBrand.value.brandID, payload)
      showSnackbar('Cập nhật brand thành công')
    } else {
      await brandApi.create(payload)
      showSnackbar('Thêm brand thành công')
    }

    brandDialog.value = false
    await loadBrands()
  } catch (error) {
    console.error(error)
    showSnackbar(
      error?.response?.data || 'Lỗi khi lưu brand',
      'error'
    )
  }
}

const deleteBrand = async (brandID) => {
  if (!brandID) {
    showSnackbar('Không tìm thấy brandID', 'error')
    return
  }

  if (!confirm('Bạn chắc chắn muốn xóa brand này?')) return

  try {
    const response = await brandApi.delete(brandID)
    showSnackbar(response.data || 'Xóa brand thành công')
    await loadBrands()
  } catch (error) {
    console.error(error)
    showSnackbar(
      error?.response?.data || 'Lỗi khi xóa brand',
      'error'
    )
  }
}

const openMaterialDialog = (item = null) => {
  if (item && item.materialID) {
    editingMaterial.value = {
      materialID: item.materialID,
      materialName: item.materialName ?? '',
      status: item.status ?? 'ACTIVE',
    }
  } else {
    editingMaterial.value = {
      materialID: 0,
      materialName: '',
      status: 'ACTIVE',
    }
  }
  materialDialog.value = true
}

const saveMaterial = async () => {
  if (!editingMaterial.value.materialName?.trim()) {
    showSnackbar('Vui lòng nhập tên chất liệu', 'warning')
    return
  }

  try {
    const payload = {
      materialName: editingMaterial.value.materialName.trim(),
      status: editingMaterial.value.status,
    }

    if (editingMaterial.value.materialID) {
      await materialApi.update(editingMaterial.value.materialID, payload)
      showSnackbar('Cập nhật material thành công')
    } else {
      await materialApi.create(payload)
      showSnackbar('Thêm material thành công')
    }

    materialDialog.value = false
    await loadMaterials()
  } catch (error) {
    console.error(error)
    showSnackbar(
      error?.response?.data || 'Lỗi khi lưu material',
      'error'
    )
  }
}

const deleteMaterial = async (materialID) => {
  if (!materialID) {
    showSnackbar('Không tìm thấy materialID', 'error')
    return
  }

  if (!confirm('Bạn chắc chắn muốn xóa material này?')) return

  try {
    const response = await materialApi.delete(materialID)
    showSnackbar(response.data || 'Xóa material thành công')
    await loadMaterials()
  } catch (error) {
    console.error(error)
    showSnackbar(
      error?.response?.data || 'Lỗi khi xóa material',
      'error'
    )
  }
}

onMounted(() => {
  loadBrands()
  loadMaterials()
})
</script>

<style scoped>
.admin-container {
  padding: 20px;
}
</style>