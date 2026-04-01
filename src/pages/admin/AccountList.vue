<template>
  <v-container fluid class="py-8">
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold mb-2">Danh sách tài khoản</h1>
      <p class="text-subtitle-1 text-grey">Quản lý tài khoản người dùng</p>
    </div>

    <v-card class="rounded-lg mb-6" elevation="0" border>
      <v-card-text class="pa-6">
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field v-model="search" label="Tìm kiếm theo tên hoặc email..." variant="outlined"
              prepend-inner-icon="mdi-magnify" density="comfortable" clearable hide-details />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card class="rounded-lg" elevation="0" border>
      <v-card-text class="pa-6">
        <v-data-table :headers="headers" :items="filteredAccounts" :items-per-page="10" class="table-modern">
          <template #item.user="{ item }">
            <div class="d-flex align-center gap-3">
              <v-avatar size="36" class="flex-shrink-0">
                <img :src="getImage(item.images)" @error="handleImgError" class="account-avatar" />
              </v-avatar>
              <div>
                <div class="font-weight-bold">{{ item.username || "—" }}</div>
              </div>
            </div>
          </template>

          <template #item.email="{ item }">
            {{ item.email || "—" }}
          </template>

          <template #item.phone="{ item }">
            {{ item.phoneNumber || "—" }}
          </template>

          <template #item.roles="{ item }">
            <div class="d-flex flex-wrap gap-1">
              <v-chip v-for="r in item.roles" :key="r" size="small" color="secondary" variant="tonal">
                {{ r }}
              </v-chip>
              <span v-if="!item.roles || item.roles.length === 0">—</span>
            </div>
          </template>

          <template #item.status="{ item }">
            <v-chip size="small" :color="statusColor(item.statusName)" variant="flat">
              {{ getStatusText(item.statusName) }}
            </v-chip>
          </template>

          <template #item.createDate="{ item }">
            {{ formatDate(item.createDate) }}
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex gap-2">
              <v-btn icon size="small" variant="text" color="primary" @click="goToDetail(item.id)">
                <v-icon>mdi-eye</v-icon>
              </v-btn>

              <v-btn icon size="small" variant="text" color="warning" @click="goToEdit(item.id)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import accountApi from "@/api/accountApi"

const router = useRouter()
const search = ref("")
const accounts = ref([])
const defaultAvatar = "/images/default-avatar.png"

const headers = [
  { title: "Tài khoản", key: "user" },
  { title: "Email", key: "email" },
  { title: "Điện thoại", key: "phone" },
  { title: "Vai trò", key: "roles" },
  { title: "Trạng thái", key: "status", width: "120px" },
  { title: "Ngày tạo", key: "createDate", width: "120px" },
  { title: "Thao tác", key: "actions", width: "100px", sortable: false },
]

onMounted(async () => {
  try {
    const res = await accountApi.getAll()

    accounts.value = (res.data || []).map(acc => ({
      id: acc.id || acc.accountId || acc.accountID || null,
      username: acc.username || "",
      email: acc.email || "",
      phoneNumber: acc.phoneNumber || "",
      images: acc.images || "",
      createDate: acc.createDate || "",
      statusId: acc.status?.id || acc.statusID || acc.statusId || null,
      statusName: acc.status?.statusName || acc.statusName || "UNKNOWN",
      roles: Array.isArray(acc.roles)
        ? acc.roles.map(r => r.roleName || r.role?.roleName || r)
        : [],
    }))
  } catch (err) {
    console.error("Lỗi tải account:", err)
  }
})

const goToDetail = id => {
  if (!id) return
  router.push({ name: "AccountDetail", params: { id } })
}

const goToEdit = id => {
  if (!id) return
  router.push({ name: "AccountEdit", params: { id } })
}

const getImage = img => {
  if (!img) return "/images/default.jpg"
  if (img.startsWith("http") || img.startsWith("data:image")) return img
  if (img.startsWith("/")) return `http://localhost:8080${img}`
  return img
}

const handleImgError = e => {
  e.target.src = defaultAvatar
}

const statusColor = st => {
  switch (st) {
    case "ACTIVE":
      return "success"
    case "INACTIVE":
      return "grey"
    case "LOCKED":
      return "warning"
    case "BANNED":
      return "error"
    default:
      return "primary"
  }
}

const getStatusText = st => {
  const statusMap = {
    ACTIVE: "Kích hoạt",
    INACTIVE: "Không kích hoạt",
    LOCKED: "Khóa",
    BANNED: "Cấm",
  }
  return statusMap[st] || st
}

const formatDate = date => {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("vi-VN")
}

const filteredAccounts = computed(() =>
  accounts.value.filter(acc =>
    acc.username?.toLowerCase().includes(search.value.toLowerCase()) ||
    acc.email?.toLowerCase().includes(search.value.toLowerCase())
  )
)
</script>

<style scoped>
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

:deep(.v-card) {
  border-radius: 8px !important;
}

.account-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
</style>