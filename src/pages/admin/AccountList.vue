<template>
    <VCard class="pa-4">
        <div class="d-flex justify-space-between align-center mb-4">
            <h2 class="text-h6">Account List</h2>

            <div class="d-flex gap-3">
                <VTextField v-model="search" placeholder="Search account..." prepend-inner-icon="mdi-magnify"
                    density="comfortable" style="max-width: 250px" clearable />
            </div>
        </div>

        <VTable>
            <thead>
                <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Roles</th>
                    <th>Status</th>
                    <th>Create Date</th>
                    <th>Actions</th>
                </tr>
            </thead>

            <tbody>
                <tr v-for="acc in filteredAccounts" :key="acc.id">
                    <td class="d-flex align-center">
                        <VAvatar size="36" class="me-3" rounded="lg">
                            <img :src="getImage(acc.images)" @error="handleImgError" />
                        </VAvatar>
                        <div>
                            <div class="font-weight-medium">{{ acc.username }}</div>
                        </div>
                    </td>

                    <td>{{ acc.email || '—' }}</td>
                    <td>{{ acc.phoneNumber || '—' }}</td>

                    <td>
                        <div class="d-flex flex-wrap gap-1">
                            <VChip v-for="r in acc.roles" :key="r" size="small" color="primary" variant="tonal">
                                {{ r }}
                            </VChip>
                        </div>
                    </td>

                    <td>
                        <VChip size="small" :color="statusColor(acc.statusName)" variant="flat">
                            {{ acc.statusName }}
                        </VChip>
                    </td>

                    <td>{{ formatDate(acc.createDate) }}</td>

                    <td>
                        <div class="d-flex gap-2">
                            <VIcon icon="mdi-eye-outline" size="20" class="cursor-pointer"
                                @click="goToDetail(acc.id)" />
                            <VIcon icon="mdi-pencil-outline" size="20" class="cursor-pointer"
                                @click="goToStatusEdit(acc.id)" />
                        </div>
                    </td>
                </tr>
            </tbody>
        </VTable>
    </VCard>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import accountApi from "@/api/accountApi"

const router = useRouter()
const search = ref("")
const accounts = ref([])
const defaultAvatar = "/images/default-avatar.png" // sửa đúng path file mặc định

onMounted(async () => {
    try {
        const res = await accountApi.getAll()

        accounts.value = (res.data || []).map(acc => ({
            id: acc.id || acc.accountID || null,
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
    router.push(`/accountList/detail/${id}`)
}

const goToStatusEdit = id => {
    router.push(`/accountList/status/${id}`)
}

const getImage = img => {
    if (typeof img !== "string" || !img.trim()) {
        return defaultAvatar
    }

    const value = img.trim()

    if (value.startsWith("data:image")) return value
    if (value.startsWith("http://") || value.startsWith("https://")) return value
    if (value.startsWith("/")) return `http://localhost:8080${value}`

    return `http://localhost:8080/${value}`
}

const handleImgError = e => {
    e.target.src = defaultAvatar
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