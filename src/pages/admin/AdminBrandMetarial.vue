<template>
  <div class="admin-container">
    <v-card class="mx-auto" elevation="0">
      <v-card-title class="text-h5 font-weight-bold mb-4">Quản Lý Brand & Material</v-card-title>
      
      <!-- Tabs -->
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

      <!-- Brand Tab -->
      <v-window v-model="tab" class="pt-4">
        <v-window-item value="brands">
          <v-card-text>
            <!-- Add Brand Button -->
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              class="mb-4"
              @click="openBrandDialog()"
            >
              Thêm Brand
            </v-btn>

            <!-- Brand Table -->
            <v-data-table
              :headers="brandHeaders"
              :items="brands"
              :loading="loadingBrand"
              class="elevation-1"
            >
              <template v-slot:item.actions="{ item }">
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
                  @click="deleteBrand(item.id)"
                >
                  Xóa
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-window-item>

        <!-- Material Tab -->
        <v-window-item value="materials">
          <v-card-text>
            <!-- Add Material Button -->
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              class="mb-4"
              @click="openMaterialDialog()"
            >
              Thêm Material
            </v-btn>

            <!-- Material Table -->
            <v-data-table
              :headers="materialHeaders"
              :items="materials"
              :loading="loadingMaterial"
              class="elevation-1"
            >
              <template v-slot:item.actions="{ item }">
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
                  @click="deleteMaterial(item.id)"
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
        <v-card-title>{{ editingBrand.id ? 'Sửa Brand' : 'Thêm Brand Mới' }}</v-card-title>
        <v-card-text class="pt-4">
          <v-text-field
            v-model="editingBrand.name"
            label="Tên Brand"
            required
            placeholder="Nhập tên brand"
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
        <v-card-title>{{ editingMaterial.id ? 'Sửa Material' : 'Thêm Material Mới' }}</v-card-title>
        <v-card-text class="pt-4">
          <v-text-field
            v-model="editingMaterial.materialName"
            label="Tên Material"
            required
            placeholder="Nhập tên chất liệu"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="materialDialog = false">Hủy</v-btn>
          <v-btn color="primary" @click="saveMaterial">Lưu</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import brandApi from '@/api/brandApi'
import materialApi from '@/api/materialApi'

// Tabs
const tab = ref('brands')

// Brand States
const brands = ref([])
const loadingBrand = ref(false)
const brandDialog = ref(false)
const editingBrand = ref({ id: 0, name: '' })
const brandHeaders = [
  { title: 'ID', key: 'brandID', width: '100px' },
  { title: 'Tên Brand', key: 'name' },
  { title: 'Hành Động', key: 'actions', width: '200px', sortable: false }
]

// Material States
const materials = ref([])
const loadingMaterial = ref(false)
const materialDialog = ref(false)
const editingMaterial = ref({ id: 0, materialName: '' })
const materialHeaders = [
  { title: 'ID', key: 'materialID', width: '100px' },
  { title: 'Tên Material', key: 'materialName' },
  { title: 'Hành Động', key: 'actions', width: '200px', sortable: false }
]

// Snackbar States
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// Load Brands
const loadBrands = async () => {
  loadingBrand.value = true
  try {
    const response = await brandApi.getAll()
    brands.value = response.data
  } catch (error) {
    console.error('Error loading brands:', error)
    showSnackbar('Lỗi khi tải danh sách brand', 'error')
  } finally {
    loadingBrand.value = false
  }
}

// Load Materials
const loadMaterials = async () => {
  loadingMaterial.value = true
  try {
    const response = await materialApi.getAll()
    materials.value = response.data
  } catch (error) {
    console.error('Error loading materials:', error)
    showSnackbar('Lỗi khi tải danh sách material', 'error')
  } finally {
    loadingMaterial.value = false
  }
}

// Brand Dialogs
const openBrandDialog = (item = null) => {
  if (item && item.brandID) {
    editingBrand.value = { ...item }
  } else {
    editingBrand.value = { brandID: 0, name: '' }
  }
  brandDialog.value = true
}

const saveBrand = async () => {
  if (!editingBrand.value.name || !editingBrand.value.name.trim()) {
    showSnackbar('Vui lòng nhập tên brand', 'warning')
    return
  }

  try {
    const payload = {
      name: editingBrand.value.name.trim()
    }

    if (editingBrand.value.brandID) {
      await brandApi.update(editingBrand.value.brandID, payload)
      showSnackbar('Cập nhật brand thành công', 'success')
    } else {
      await brandApi.create(payload)
      showSnackbar('Thêm brand thành công', 'success')
    }

    brandDialog.value = false
    await loadBrands()
  } catch (error) {
    console.error('Error saving brand:', error)
    showSnackbar('Lỗi khi lưu brand', 'error')
  }
}

const deleteBrand = async (id) => {
  if (confirm('Bạn chắc chắn muốn xóa brand này?')) {
    try {
      await brandApi.delete(id)
      showSnackbar('Xóa brand thành công', 'success')
      await loadBrands()
    } catch (error) {
      console.error('Error deleting brand:', error)
      showSnackbar('Lỗi khi xóa brand', 'error')
    }
  }
}

// Material Dialogs
const openMaterialDialog = (item = null) => {
  if (item && item.materialID) {
    editingMaterial.value = { ...item }
  } else {
    editingMaterial.value = { materialID: 0, materialName: '' }
  }
  materialDialog.value = true
}

const saveMaterial = async () => {
  if (!editingMaterial.value.materialName || !editingMaterial.value.materialName.trim()) {
    showSnackbar('Vui lòng nhập tên chất liệu', 'warning')
    return
  }

  try {
    const payload = {
      materialName: editingMaterial.value.materialName.trim()
    }

    if (editingMaterial.value.materialID) {
      await materialApi.update(editingMaterial.value.materialID, payload)
      showSnackbar('Cập nhật material thành công', 'success')
    } else {
      await materialApi.create(payload)
      showSnackbar('Thêm material thành công', 'success')
    }

    materialDialog.value = false
    await loadMaterials()
  } catch (error) {
    console.error('Error saving material:', error)
    showSnackbar('Lỗi khi lưu material', 'error')
  }
}

const deleteMaterial = async (id) => {
  if (confirm('Bạn chắc chắn muốn xóa material này?')) {
    try {
      await materialApi.delete(id)
      showSnackbar('Xóa material thành công', 'success')
      await loadMaterials()
    } catch (error) {
      console.error('Error deleting material:', error)
      showSnackbar('Lỗi khi xóa material', 'error')
    }
  }
}

// Snackbar
const showSnackbar = (message, color = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  snackbar.value = true
}

// Load data on mount
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
