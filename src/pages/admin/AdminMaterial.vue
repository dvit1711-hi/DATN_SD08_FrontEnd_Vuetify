<template>
  <div class="admin-container">
    <v-card elevation="0">
      <v-card-title class="text-h5 font-weight-bold mb-4">
        Quản Lý Chất Liệu
      </v-card-title>

      <v-card-text>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          class="mb-4"
          @click="openMaterialDialog()"
        >
          Thêm Chất Liệu
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
    </v-card>

    <!-- Dialog Material -->
    <v-dialog v-model="materialDialog" max-width="500">
      <v-card>
        <v-card-title>
          {{
            editingMaterial.materialID
              ? 'Sửa Chất Liệu'
              : 'Thêm Chất Liệu'
          }}
        </v-card-title>

        <v-card-text class="pt-4">
          <v-text-field
            v-model="editingMaterial.materialName"
            label="Tên Chất Liệu"
            placeholder="Nhập tên chất liệu"
          />

          <v-select
            v-model="editingMaterial.status"
            :items="statusOptions"
            label="Trạng Thái"
            class="mt-3"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />

          <v-btn @click="materialDialog = false">
            Hủy
          </v-btn>

          <v-btn
            color="primary"
            @click="saveMaterial"
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
import materialApi from '@/api/materialApi'

const statusOptions = ['ACTIVE', 'INACTIVE']

const materials = ref([])
const loadingMaterial = ref(false)

const materialDialog = ref(false)

const editingMaterial = ref({
  materialID: 0,
  materialName: '',
  status: 'ACTIVE'
})

const materialHeaders = [
  {
    title: 'ID',
    key: 'materialID',
    width: '100px'
  },
  {
    title: 'Tên Chất Liệu',
    key: 'materialName'
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

const loadMaterials = async () => {
  loadingMaterial.value = true

  try {
    const response = await materialApi.getAll()
    materials.value = response.data
  } catch (error) {
    console.error(error)
    showSnackbar(
      'Lỗi khi tải danh sách chất liệu',
      'error'
    )
  } finally {
    loadingMaterial.value = false
  }
}

const openMaterialDialog = (item = null) => {
  if (item && item.materialID) {
    editingMaterial.value = {
      materialID: item.materialID,
      materialName: item.materialName ?? '',
      status: item.status ?? 'ACTIVE'
    }
  } else {
    editingMaterial.value = {
      materialID: 0,
      materialName: '',
      status: 'ACTIVE'
    }
  }

  materialDialog.value = true
}

const saveMaterial = async () => {
  if (!editingMaterial.value.materialName?.trim()) {
    showSnackbar(
      'Vui lòng nhập tên chất liệu',
      'warning'
    )
    return
  }

  try {
    const payload = {
      materialName:
        editingMaterial.value.materialName.trim(),
      status: editingMaterial.value.status
    }

    if (editingMaterial.value.materialID) {
      await materialApi.update(
        editingMaterial.value.materialID,
        payload
      )

      showSnackbar(
        'Cập nhật chất liệu thành công'
      )
    } else {
      await materialApi.create(payload)

      showSnackbar(
        'Thêm chất liệu thành công'
      )
    }

    materialDialog.value = false

    await loadMaterials()
  } catch (error) {
    console.error(error)

    showSnackbar(
      error?.response?.data ||
        'Lỗi khi lưu chất liệu',
      'error'
    )
  }
}

const deleteMaterial = async (materialID) => {
  if (!materialID) {
    showSnackbar(
      'Không tìm thấy Material ID',
      'error'
    )
    return
  }

  if (
    !confirm(
      'Bạn có chắc chắn muốn xóa chất liệu này?'
    )
  ) {
    return
  }

  try {
    const response =
      await materialApi.delete(materialID)

    showSnackbar(
      response.data ||
        'Xóa chất liệu thành công'
    )

    await loadMaterials()
  } catch (error) {
    console.error(error)

    showSnackbar(
      error?.response?.data ||
        'Lỗi khi xóa chất liệu',
      'error'
    )
  }
}

onMounted(() => {
  loadMaterials()
})
</script>

<style scoped>
.admin-container {
  padding: 20px;
  background: #f1f1f1;
  min-height: 100%;
}
</style>