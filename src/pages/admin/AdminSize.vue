<template>
  <div class="admin-container">
    <v-card elevation="0">
      <v-card-title class="text-h5 font-weight-bold mb-4">
        Quản Lý Kích Thước
      </v-card-title>

      <v-card-text>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          class="mb-4"
          @click="openSizeDialog()"
        >
          Thêm Kích Thước
        </v-btn>

        <v-data-table
          :headers="sizeHeaders"
          :items="sizes"
          :loading="loadingSize"
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
              @click="openSizeDialog(item)"
            >
              Sửa
            </v-btn>

            <v-btn
              size="small"
              variant="tonal"
              color="error"
              prepend-icon="mdi-delete"
              @click="deleteSize(item.sizeID)"
            >
              Xóa
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Dialog -->
    <v-dialog v-model="sizeDialog" max-width="600">
      <v-card>
        <v-card-title>
          {{ editingSize.sizeID ? 'Sửa Kích Thước' : 'Thêm Kích Thước' }}
        </v-card-title>

        <v-card-text class="pt-4">
          <v-text-field
            v-model="editingSize.sizeName"
            label="Tên Kích Thước"
            placeholder="Ví dụ: S, M, L, XL..."
          />

          <v-textarea
            v-model="editingSize.description"
            label="Mô Tả"
            rows="3"
            class="mt-3"
          />

          <v-select
            v-model="editingSize.status"
            :items="statusOptions"
            label="Trạng Thái"
            class="mt-3"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />

          <v-btn @click="sizeDialog = false">
            Hủy
          </v-btn>

          <v-btn
            color="primary"
            @click="saveSize"
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
import sizeApi from '@/api/sizeApi'

const statusOptions = ['ACTIVE', 'INACTIVE']

const sizes = ref([])
const loadingSize = ref(false)

const sizeDialog = ref(false)

const editingSize = ref({
  sizeID: 0,
  sizeName: '',
  description: '',
  status: 'ACTIVE'
})

const sizeHeaders = [
  {
    title: 'ID',
    key: 'sizeID',
    width: '100px'
  },
  {
    title: 'Tên Kích Thước',
    key: 'sizeName'
  },
  {
    title: 'Mô Tả',
    key: 'description'
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

const loadSizes = async () => {
  loadingSize.value = true

  try {
    const response = await sizeApi.getAll()
    sizes.value = response.data
  } catch (error) {
    console.error(error)

    showSnackbar(
      'Lỗi khi tải danh sách kích thước',
      'error'
    )
  } finally {
    loadingSize.value = false
  }
}

const openSizeDialog = (item = null) => {
  if (item && item.sizeID) {
    editingSize.value = {
      sizeID: item.sizeID,
      sizeName: item.sizeName ?? '',
      description: item.description ?? '',
      status: item.status ?? 'ACTIVE'
    }
  } else {
    editingSize.value = {
      sizeID: 0,
      sizeName: '',
      description: '',
      status: 'ACTIVE'
    }
  }

  sizeDialog.value = true
}

const saveSize = async () => {
  if (!editingSize.value.sizeName?.trim()) {
    showSnackbar(
      'Vui lòng nhập tên kích thước',
      'warning'
    )
    return
  }

  try {
    const payload = {
      sizeName: editingSize.value.sizeName.trim(),
      description: editingSize.value.description,
      status: editingSize.value.status
    }

    if (editingSize.value.sizeID) {
      await sizeApi.update(
        editingSize.value.sizeID,
        payload
      )

      showSnackbar(
        'Cập nhật kích thước thành công'
      )
    } else {
      await sizeApi.create(payload)

      showSnackbar(
        'Thêm kích thước thành công'
      )
    }

    sizeDialog.value = false
    await loadSizes()

  } catch (error) {
    console.error(error)

    showSnackbar(
      error?.response?.data ||
      'Lỗi khi lưu kích thước',
      'error'
    )
  }
}

const deleteSize = async (sizeID) => {
  if (!sizeID) {
    showSnackbar(
      'Không tìm thấy Size ID',
      'error'
    )
    return
  }

  if (
    !confirm(
      'Bạn có chắc chắn muốn xóa kích thước này?'
    )
  ) {
    return
  }

  try {
    const response =
      await sizeApi.delete(sizeID)

    showSnackbar(
      response.data ||
      'Xóa kích thước thành công'
    )

    await loadSizes()

  } catch (error) {
    console.error(error)

    showSnackbar(
      error?.response?.data ||
      'Lỗi khi xóa kích thước',
      'error'
    )
  }
}

onMounted(() => {
  loadSizes()
})
</script>

<style scoped>
.admin-container {
  padding: 20px;
  background: #f1f1f1;
  min-height: 100%;
}
</style>