<template>
  <div class="admin-container">
    <v-card elevation="0">
      <v-card-title class="text-h5 font-weight-bold mb-4">
        Quản Lý Màu Sắc
      </v-card-title>

      <v-card-text>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          class="mb-4"
          @click="openColorDialog()"
        >
          Thêm Màu
        </v-btn>

        <v-data-table
          :headers="colorHeaders"
          :items="colors"
          :loading="loadingColor"
          class="elevation-1"
        >
          <template #item.colorCode="{ item }">
            <div class="d-flex align-center gap-2">
              <div
                :style="{ backgroundColor: item.colorCode }"
                class="color-preview"
              />
              <span>{{ item.colorCode }}</span>
            </div>
          </template>

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
              @click="openColorDialog(item)"
            >
              Sửa
            </v-btn>

            <v-btn
              size="small"
              variant="tonal"
              color="error"
              prepend-icon="mdi-delete"
              @click="deleteColor(item.colorID)"
            >
              Xóa
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Dialog -->
    <v-dialog v-model="colorDialog" max-width="650">
      <v-card>
        <v-card-title>
          {{ editingColor.colorID ? 'Sửa Màu' : 'Thêm Màu Mới' }}
        </v-card-title>

        <v-card-text class="pt-4">
          <v-text-field
            v-model="editingColor.colorName"
            label="Tên Màu"
            placeholder="Nhập tên màu"
          />

          <div class="d-flex align-center gap-4 mt-4">
            <v-color-picker
              v-model="editingColor.colorCode"
              width="250"
              show-swatches
            />

            <div class="preview-container">
              <div
                :style="{ backgroundColor: editingColor.colorCode }"
                class="preview-color"
              />

              <span class="text-caption">
                {{ editingColor.colorCode }}
              </span>
            </div>
          </div>

          <v-select
            v-model="editingColor.status"
            :items="statusOptions"
            label="Trạng Thái"
            class="mt-4"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />

          <v-btn @click="colorDialog = false">
            Hủy
          </v-btn>

          <v-btn
            color="primary"
            @click="saveColor"
          >
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
import colorApi from '@/api/colorApi'

const statusOptions = ['ACTIVE', 'INACTIVE']

const colors = ref([])
const loadingColor = ref(false)

const colorDialog = ref(false)

const editingColor = ref({
  colorID: 0,
  colorName: '',
  colorCode: '#000000',
  status: 'ACTIVE'
})

const colorHeaders = [
  {
    title: 'ID',
    key: 'colorID',
    width: '100px'
  },
  {
    title: 'Tên Màu',
    key: 'colorName'
  },
  {
    title: 'Mã Màu',
    key: 'colorCode',
    width: '220px'
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

const showSnackbar = (
  message,
  color = 'success'
) => {
  snackbarMessage.value = message
  snackbarColor.value = color
  snackbar.value = true
}

const loadColors = async () => {
  loadingColor.value = true

  try {
    const response = await colorApi.getAll()
    colors.value = response.data
  } catch (error) {
    console.error(error)

    showSnackbar(
      'Lỗi khi tải danh sách màu',
      'error'
    )
  } finally {
    loadingColor.value = false
  }
}

const openColorDialog = (item = null) => {
  if (item && item.colorID) {
    editingColor.value = {
      colorID: item.colorID,
      colorName: item.colorName ?? '',
      colorCode: item.colorCode ?? '#000000',
      status: item.status ?? 'ACTIVE'
    }
  } else {
    editingColor.value = {
      colorID: 0,
      colorName: '',
      colorCode: '#000000',
      status: 'ACTIVE'
    }
  }

  colorDialog.value = true
}

const saveColor = async () => {
  if (!editingColor.value.colorName?.trim()) {
    showSnackbar(
      'Vui lòng nhập tên màu',
      'warning'
    )
    return
  }

  try {
    const payload = {
      colorName:
        editingColor.value.colorName.trim(),
      colorCode:
        editingColor.value.colorCode,
      status:
        editingColor.value.status
    }

    if (editingColor.value.colorID) {
      await colorApi.update(
        editingColor.value.colorID,
        payload
      )

      showSnackbar(
        'Cập nhật màu thành công'
      )
    } else {
      await colorApi.create(payload)

      showSnackbar(
        'Thêm màu thành công'
      )
    }

    colorDialog.value = false

    await loadColors()
  } catch (error) {
    console.error(error)

    showSnackbar(
      error?.response?.data ||
      'Lỗi khi lưu màu',
      'error'
    )
  }
}

const deleteColor = async (colorID) => {
  if (!colorID) {
    showSnackbar(
      'Không tìm thấy Color ID',
      'error'
    )
    return
  }

  if (
    !confirm(
      'Bạn có chắc chắn muốn xóa màu này?'
    )
  ) {
    return
  }

  try {
    const response =
      await colorApi.delete(colorID)

    showSnackbar(
      response.data ||
      'Xóa màu thành công'
    )

    await loadColors()
  } catch (error) {
    console.error(error)

    showSnackbar(
      error?.response?.data ||
      'Lỗi khi xóa màu',
      'error'
    )
  }
}

onMounted(() => {
  loadColors()
})
</script>

<style scoped>
.admin-container {
  padding: 20px;
  background: #f1f1f1;
  min-height: 100%;
}

.color-preview {
  width: 30px;
  height: 30px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.preview-color {
  width: 100px;
  height: 100px;
  border: 1px solid #ccc;
  border-radius: 8px;
}
</style>