<template>
  <v-container fluid class="account-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Danh sách tài khoản</h1>
        <p class="page-subtitle">Quản lý tài khoản người dùng</p>
      </div>

      <v-btn color="primary" class="add-staff-btn" prepend-icon="mdi-account-plus"
        @click="$router.push({ name: 'AddStaffAccount' })">
        Thêm nhân viên
      </v-btn>
    </div>

    <v-card class="filter-card" elevation="0" border>
      <v-card-text class="pa-6">
        <v-row align="center">
          <v-col cols="12" md="6">
            <v-text-field v-model="search" label="Tìm kiếm theo tên hoặc email..." variant="outlined"
              prepend-inner-icon="mdi-magnify" density="comfortable" clearable hide-details class="search-field" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card class="table-card" elevation="0" border>
      <v-card-text class="pa-6">
        <v-data-table :headers="headers" :items="filteredAccounts" :items-per-page="10" class="table-modern">
          <template #item.user="{ item }">
            <div class="d-flex align-center user-cell">
              <v-avatar size="42" class="user-avatar-wrap">
                <img :src="getImage(item.images)" @error="handleImgError" class="account-avatar" />
              </v-avatar>

              <div class="user-info">
                <div class="user-name">{{ item.username || "—" }}</div>
              </div>
            </div>
          </template>

          <template #item.email="{ item }">
            <span class="cell-text">{{ item.email || "—" }}</span>
          </template>

          <template #item.phone="{ item }">
            <span class="cell-text">{{ item.phoneNumber || "—" }}</span>
          </template>

          <template #item.roles="{ item }">
            <div class="d-flex flex-wrap role-wrap">
              <v-chip v-for="r in item.roles" :key="r" size="small" :color="roleColor(r)" variant="tonal"
                class="role-chip">
                {{ roleText(r) }}
              </v-chip>

              <span v-if="!item.roles || item.roles.length === 0">—</span>
            </div>
          </template>

          <template #item.status="{ item }">
            <v-chip size="small" :color="statusColor(item.statusName)" variant="flat" class="status-chip">
              {{ getStatusText(item.statusName) }}
            </v-chip>
          </template>

          <template #item.createDate="{ item }">
            <span class="cell-text">{{ formatDate(item.createDate) }}</span>
          </template>

          <template #item.actions="{ item }">
            <div class="action-wrap">
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
  { title: "Vai trò", key: "role" },
  { title: "Trạng thái", key: "status", width: "140px" },
  { title: "Ngày tạo", key: "createDate", width: "140px" },
  { title: "Thao tác", key: "actions", width: "110px", sortable: false },
]

const normalizeStatusName = value => {
  if (!value) return "UNKNOWN"
  return String(value).trim().toUpperCase()
}

const normalizeRoles = acc => {
  const rawRoles =
    acc.roles ??
    acc.roleName ??
    acc.accountRoles ??
    acc.accountRoleList ??
    []

  const roleArray = Array.isArray(rawRoles) ? rawRoles : [rawRoles]

  return [...new Set(
    roleArray
      .map(role => {
        if (!role) return null
        if (typeof role === "string") return role
        if (role.roleName) return role.roleName
        if (role.name) return role.name
        if (role.role?.roleName) return role.role.roleName
        if (role.role?.name) return role.role.name
        return null
      })
      .filter(Boolean)
  )]
}

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
      statusName: normalizeStatusName(acc.status?.statusName || acc.statusName),
      role: normalizeRoles(acc),
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

const roleColor = role => {
  switch (role) {
    case "ROLE_ADMIN":
      return "error"
    case "ROLE_STAFF":
      return "primary"
    case "ROLE_USER":
      return "secondary"
    default:
      return "grey"
  }
}

const roleText = role => {
  const roleMap = {
    ROLE_ADMIN: "Admin",
    ROLE_STAFF: "Staff",
    ROLE_USER: "User",
  }
  return roleMap[role] || role
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
    case "PENDING":
      return "info"
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
    PENDING: "Chờ duyệt",
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
.account-page {
  padding: 28px 20px;
  background: #f7f4ef;
  min-height: 100%;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.2;
  margin: 0 0 4px;
  color: #3e2f1c;
}

.page-subtitle {
  margin: 0;
  font-size: 14px;
  color: #8d7b68;
}

.add-staff-btn {
  height: 42px;
  padding: 0 18px;
  border-radius: 12px;
  font-weight: 700;
  text-transform: none;
  box-shadow: 0 8px 20px rgba(181, 152, 95, 0.22);
}

.filter-card,
.table-card {
  border-radius: 18px !important;
  border: 1px solid rgba(190, 171, 135, 0.18) !important;
  background: #fcfbf8;
}

.filter-card {
  margin-bottom: 18px;
}

.search-field :deep(.v-field) {
  border-radius: 14px;
  background: white;
}

.table-modern :deep(.v-table__wrapper) {
  border-radius: 14px;
  border: 1px solid rgba(190, 171, 135, 0.14);
  overflow: hidden;
  background: white;
}

.table-modern :deep(thead tr th) {
  background: #f4ede1;
  color: #5c4631;
  font-weight: 700 !important;
  border-bottom: 1px solid rgba(190, 171, 135, 0.18);
}

.table-modern :deep(tbody tr) {
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(190, 171, 135, 0.1);
}

.table-modern :deep(tbody tr:hover) {
  background: #fdf7ee;
}

.user-cell {
  gap: 12px;
}

.user-avatar-wrap {
  border: 2px solid rgba(190, 171, 135, 0.2);
}

.account-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.user-name {
  font-weight: 700;
  color: #3e2f1c;
  line-height: 1.2;
}

.cell-text {
  color: #5f5f5f;
}

.role-wrap {
  gap: 6px;
}

.role-chip {
  font-weight: 600;
  border-radius: 999px;
}

.status-chip {
  min-width: 98px;
  justify-content: center;
  font-weight: 700;
}

.action-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}

:deep(.v-btn--icon) {
  border-radius: 10px;
}

:deep(.v-card) {
  box-shadow: none !important;
}

@media (max-width: 768px) {
  .account-page {
    padding: 16px 10px;
  }

  .page-title {
    font-size: 22px;
  }

  .page-header {
    align-items: stretch;
  }

  .add-staff-btn {
    width: 100%;
  }
}
</style>