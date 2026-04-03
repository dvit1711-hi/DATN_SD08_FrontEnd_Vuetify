<template>
  <div class="admin-container">
    <v-card class="mx-auto" elevation="0">
      <v-card-title class="text-h5 font-weight-bold mb-4">Quản Lý Color & Size</v-card-title>
      
      <!-- Tabs -->
      <v-tabs v-model="tab" class="mb-4">
        <v-tab value="colors">
          <v-icon start>mdi-palette</v-icon>
          Color
        </v-tab>
        <v-tab value="sizes">
          <v-icon start>mdi-resize</v-icon>
          Size
        </v-tab>
      </v-tabs>

      <!-- Color Tab -->
      <v-window v-model="tab" class="pt-4">
        <v-window-item value="colors">
          <v-card-text>
            <!-- Add Color Button -->
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              class="mb-4"
              @click="openColorDialog()"
            >
              Thêm Color
            </v-btn>

            <!-- Color Table -->
            <v-data-table
              :headers="colorHeaders"
              :items="colors"
              :loading="loadingColor"
              class="elevation-1"
            >
              <template v-slot:item.colorCode="{ item }">
                <div class="d-flex align-center gap-2">
                  <div
                    :style="{ backgroundColor: item.colorCode }"
                    style="width: 30px; height: 30px; border: 1px solid #ccc; border-radius: 4px;"
                  />
                  <span>{{ item.colorCode }}</span>
                </div>
              </template>
              <template v-slot:item.actions="{ item }">
                <v-btn
                  size="small"
                  variant="tonal"
                  color="warning"
                  prepend-icon="mdi-pencil"
                  class="me-2"
                  @click="openColorDialog(item)"
                >
                  Sửa
                </v-btn>
                <v-btn
                  size="small"
                  variant="tonal"
                  color="error"
                  prepend-icon="mdi-delete"
                  @click="deleteColor(item.id)"
                >
                  Xóa
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-window-item>

        <!-- Size Tab -->
        <v-window-item value="sizes">
          <v-card-text>
            <!-- Add Size Button -->
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              class="mb-4"
              @click="openSizeDialog()"
            >
              Thêm Size
            </v-btn>

            <!-- Size Table -->
            <v-data-table
              :headers="sizeHeaders"
              :items="sizes"
              :loading="loadingSize"
              class="elevation-1"
            >
              <template v-slot:item.actions="{ item }">
                <v-btn
                  size="small"
                  variant="tonal"
                  color="warning"
                  prepend-icon="mdi-pencil"
                  class="me-2"
                  @click="openSizeDialog(item)"
                >
                  Sửa
                </v-btn>
                <v-btn
                  size="small"
                  variant="tonal"
                  color="error"
                  prepend-icon="mdi-delete"
                  @click="deleteSize(item.id)"
                >
                  Xóa
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-window-item>
      </v-window>
    </v-card>

    <!-- Color Dialog -->
    <v-dialog v-model="colorDialog" max-width="500px">
      <v-card>
        <v-card-title>{{ editingColor.id ? 'Sửa Color' : 'Thêm Color Mới' }}</v-card-title>
        <v-card-text class="pt-4">
          <v-text-field
            v-model="editingColor.colorName"
            label="Tên Color"
            required
            placeholder="Nhập tên màu"
          />
          <div class="d-flex align-center gap-2 mt-4">
            <v-color-picker
              v-model="editingColor.colorCode"
              width="240"
              show-swatches
            />
            <div class="d-flex flex-column gap-2">
              <div
                :style="{ backgroundColor: editingColor.colorCode }"
                style="width: 80px; height: 80px; border: 1px solid #ccc; border-radius: 4px;"
              />
              <span class="text-caption">{{ editingColor.colorCode }}</span>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="colorDialog = false">Hủy</v-btn>
          <v-btn color="primary" @click="saveColor">Lưu</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Size Dialog -->
    <v-dialog v-model="sizeDialog" max-width="500px">
      <v-card>
        <v-card-title>{{ editingSize.id ? 'Sửa Size' : 'Thêm Size Mới' }}</v-card-title>
        <v-card-text class="pt-4">
          <v-text-field
            v-model="editingSize.sizeName"
            label="Tên Size"
            required
            placeholder="Nhập tên kích thước"
          />
          <v-textarea
            v-model="editingSize.sizeDescription"
            label="Mô Tả"
            placeholder="Nhập mô tả (tùy chọn)"
            rows="3"
            class="mt-4"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="sizeDialog = false">Hủy</v-btn>
          <v-btn color="primary" @click="saveSize">Lưu</v-btn>
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
import colorApi from '@/api/colorApi'   
import sizeApi from '@/api/sizeApi'

// Tabs
const tab = ref('colors')

// Color States
const colors = ref([])
const loadingColor = ref(false)
const colorDialog = ref(false)
const editingColor = ref({ id: 0, colorName: '', colorCode: '#000000' })
const colorHeaders = [
  { title: 'ID', key: 'colorID', width: '100px' },
  { title: 'Tên Color', key: 'colorName' },
  { title: 'Mã Màu', key: 'colorCode', width: '200px' },
  { title: 'Hành Động', key: 'actions', width: '200px', sortable: false }
]

// Size States
const sizes = ref([])
const loadingSize = ref(false)
const sizeDialog = ref(false)
const editingSize = ref({ id: 0, sizeName: '', sizeDescription: '' })
const sizeHeaders = [
  { title: 'ID', key: 'sizeID', width: '100px' },
  { title: 'Tên Size', key: 'sizeName' },
  { title: 'Mô Tả', key: 'sizeDescription' },
  { title: 'Hành Động', key: 'actions', width: '200px', sortable: false }
]

// Snackbar States
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// Load Colors
const loadColors = async () => {
  loadingColor.value = true
  try {
    const response = await colorApi.getAll()
    colors.value = response.data
  } catch (error) {
    console.error('Error loading colors:', error)
    showSnackbar('Lỗi khi tải danh sách color', 'error')
  } finally {
    loadingColor.value = false
  }
}

// Load Sizes
const loadSizes = async () => {
  loadingSize.value = true
  try {
    const response = await sizeApi.getAll()
    sizes.value = response.data
  } catch (error) {
    console.error('Error loading sizes:', error)
    showSnackbar('Lỗi khi tải danh sách size', 'error')
  } finally {
    loadingSize.value = false
  }
}

// Color Dialogs
const openColorDialog = (item = null) => {
  if (item && item.colorID) {
    editingColor.value = { ...item }
  } else {
    editingColor.value = { colorID: 0, colorName: '', colorCode: '#000000' }
  }
  colorDialog.value = true
}

const saveColor = async () => {
  if (!editingColor.value.colorName || !editingColor.value.colorName.trim()) {
    showSnackbar('Vui lòng nhập tên color', 'warning')
    return
  }

  try {
    const payload = {
      colorName: editingColor.value.colorName.trim(),
      colorCode: editingColor.value.colorCode
    }

    if (editingColor.value.id) {
      await colorApi.update(editingColor.value.colorID, payload)
      showSnackbar('Cập nhật color thành công', 'success')
    } else {
      await colorApi.create(payload)
      showSnackbar('Thêm color thành công', 'success')
    }

    colorDialog.value = false
    await loadColors()
  } catch (error) {
    console.error('Error saving color:', error)
    showSnackbar('Lỗi khi lưu color', 'error')
  }
}

const deleteColor = async (id) => {
  if (confirm('Bạn chắc chắn muốn xóa color này?')) {
    try {
      await colorApi.delete(id)
      showSnackbar('Xóa color thành công', 'success')
      await loadColors()
    } catch (error) {
      console.error('Error deleting color:', error)
      showSnackbar('Lỗi khi xóa color', 'error')
    }
  }
}

// Size Dialogs
const openSizeDialog = (item = null) => {
  if (item && item.sizeID) {
    editingSize.value = { ...item }
  } else {
    editingSize.value = { sizeID: 0, sizeName: '', sizeDescription: '' }
  }
  sizeDialog.value = true
}

const saveSize = async () => {
  if (!editingSize.value.sizeName || !editingSize.value.sizeName.trim()) {
    showSnackbar('Vui lòng nhập tên size', 'warning')
    return
  }

  try {
    const payload = {
      sizeName: editingSize.value.sizeName.trim(),
      sizeDescription: editingSize.value.sizeDescription
    }

    if (editingSize.value.sizeID) {
      await sizeApi.update(editingSize.value.sizeID, payload)
      showSnackbar('Cập nhật size thành công', 'success')
    } else {
      await sizeApi.create(payload)
      showSnackbar('Thêm size thành công', 'success')
    }

    sizeDialog.value = false
    await loadSizes()
  } catch (error) {
    console.error('Error saving size:', error)
    showSnackbar('Lỗi khi lưu size', 'error')
  }
}

const deleteSize = async (sizeID) => {
  if (confirm('Bạn chắc chắn muốn xóa size này?')) {
    try {
      await sizeApi.delete(sizeID)
      showSnackbar('Xóa size thành công', 'success')
      await loadSizes()
    } catch (error) {
      console.error('Error deleting size:', error)
      showSnackbar('Lỗi khi xóa size', 'error')
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
  loadColors()
  loadSizes()
})
</script>

<style scoped>
.admin-container {
  padding: 20px;
}
</style>
