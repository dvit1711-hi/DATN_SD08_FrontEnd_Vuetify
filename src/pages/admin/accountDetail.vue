<template>
  <VRow>
    <VCol cols="12">
      <VCard class="pa-4">
        <div class="d-flex justify-space-between align-center mb-4">
          <h2 class="text-h6">Chi tiết Account</h2>
          <VBtn variant="tonal" color="secondary" @click="goBack">Quay lại</VBtn>
        </div>

        <VRow>
          <VCol cols="12" md="3">
            <div class="d-flex flex-column align-center">
              <VAvatar size="120" rounded="lg" class="mb-4">
                <img :src="getImage(account.images)" />
              </VAvatar>

              <VChip :color="statusColor(account.statusName)" variant="flat">
                {{ getStatusText(account.statusName) }}
              </VChip>
            </div>
          </VCol>

          <VCol cols="12" md="9">
            <VRow>
              <VCol cols="12" md="6">
                <VTextField label="Account ID" :model-value="account.id" readonly />
              </VCol>

              <VCol cols="12" md="6">
                <VTextField label="Username" :model-value="account.username" readonly />
              </VCol>

              <VCol cols="12" md="6">
                <VTextField label="Email" :model-value="account.email" readonly />
              </VCol>

              <VCol cols="12" md="6">
                <VTextField label="Phone Number" :model-value="account.phoneNumber" readonly />
              </VCol>

              <VCol cols="12" md="6">
                <VTextField label="Create Date" :model-value="formatDate(account.createDate)" readonly />
              </VCol>

              <VCol cols="12" md="6">
                <VTextField label="Status" :model-value="getStatusText(account.statusName)" readonly />
              </VCol>

              <VCol cols="12">
                <div class="mb-2 font-weight-medium">Roles</div>
                <div class="d-flex flex-wrap gap-2">
                  <VChip v-for="r in account.roles" :key="r" color="primary" variant="tonal">
                    {{ roleTextDisplay(r) }}
                  </VChip>
                </div>
              </VCol>
            </VRow>
          </VCol>
        </VRow>
      </VCard>
    </VCol>
  </VRow>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import accountApi from "@/api/accountApi"

const route = useRoute()
const router = useRouter()

const account = ref({
  id: null,
  username: "",
  email: "",
  phoneNumber: "",
  images: "",
  createDate: "",
  statusId: null,
  statusName: "",
  roles: [],
})

const loadAccount = async () => {
  try {
    const res = await accountApi.getById(route.params.id)
    const acc = res.data.account || res.data

    account.value = {
      id: acc.id,
      username: acc.username || "",
      email: acc.email || "",
      phoneNumber: acc.phoneNumber || "",
      images: acc.images || "",
      createDate: acc.createDate || "",
      statusId: acc.status?.id || acc.statusID || acc.statusId || null,
      statusName: acc.status?.statusName || acc.statusName || "UNKNOWN",
      roles: formatRoles(acc.roles),
    }
  } catch (err) {
    console.error("Lỗi load account detail:", err)
    alert("Không tải được thông tin account!")
  }
}

const getImage = img => {
  if (!img) return '/images/default.jpg'
  return img
}

const formatDate = date => {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("vi-VN")
}

const statusColor = st => {
  switch (st) {
    case "ACTIVE": return "green"
    case "INACTIVE": return "grey"
    case "LOCKED": return "orange"
    case "BANNED": return "red"
    default: return "primary"
  }
}

const getStatusText = st => {
  const statusMap = {
    ACTIVE: "Đang hoạt động",
    INACTIVE: "Không hoạt động",
    LOCKED: "Bị khóa",
    BANNED: "Bị cấm",
    PENDING: "Chờ xác nhận",
  }
  return statusMap[st] || st
}

const goBack = () => {
  router.push("/admin/accounts")
}

const formatRoles = (roles) => {
  if (!roles) return []
  
  // Nếu là string (ví dụ "['ROLE_ADMIN']")
  if (typeof roles === 'string') {
    try {
      const parsed = JSON.parse(roles.replace(/'/g, '"'))
      return Array.isArray(parsed) 
        ? parsed.map(r => cleanRoleName(r))
        : [cleanRoleName(roles)]
    } catch (e) {
      return [cleanRoleName(roles)]
    }
  }
  
  // Nếu là array
  if (Array.isArray(roles)) {
    return roles.map(r => {
      const roleName = r.roleName || r.role?.roleName || r
      return cleanRoleName(roleName)
    })
  }
  
  return [cleanRoleName(roles)]
}

const cleanRoleName = (roleName) => {
  if (typeof roleName === 'string') {
    return roleName.replace(/^ROLE_/, '').toLowerCase()
  }
  return roleName
}

const roleTextDisplay = (role) => {
  const cleanRole = cleanRoleName(role)
  const roleMap = {
    admin: "Quản lý",
    staff: "Nhân viên",
    user: "Người dùng",
  }
  return roleMap[cleanRole] || cleanRole
}

onMounted(loadAccount)
</script>