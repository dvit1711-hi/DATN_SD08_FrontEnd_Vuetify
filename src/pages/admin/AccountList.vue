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
                            <img :src="acc.images || defaultAvatar" />
                        </VAvatar>
                        <div>
                            <div class="font-weight-medium">{{ acc.username }}</div>
                        </div>
                    </td>

                    <td>{{ acc.email }}</td>
                    <td>{{ acc.phoneNumber }}</td>

                    <td>
                        <div class="d-flex flex-wrap gap-1">
                            <VChip v-for="r in acc.roles" :key="r" small color="primary" variant="tonal">
                                {{ r }}
                            </VChip>
                        </div>
                    </td>

                    <td>
                        <VChip small :color="statusColor(acc.status)" variant="flat">
                            {{ acc.status }}
                        </VChip>
                    </td>

                    <td>{{ formatDate(acc.createDate) }}</td>

                    <td>
                        <div class="d-flex gap-2">
                            <VIcon icon="mdi-pencil-outline" size="20" class="cursor-pointer" />
                            <VIcon icon="mdi-delete-outline" size="20" class="cursor-pointer" />
                            <VIcon icon="mdi-dots-vertical" size="20" class="cursor-pointer" />
                        </div>
                    </td>

                </tr>
            </tbody>
        </VTable>

    </VCard>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import accountApi from "@/api/accountApi"

const search = ref("")
const accounts = ref([])
const defaultAvatar = "/default-avatar.png"

// Load danh sách account từ backend
onMounted(async () => {
    try {
        const res = await accountApi.getAll()

        accounts.value = res.data.map(acc => ({
            id: acc.id,
            username: acc.username,
            email: acc.email,
            phoneNumber: acc.phoneNumber,
            images: acc.images,
            createDate: acc.createDate,
            status: acc.statusName || "Unknown",
            roles: acc.roles || []   // backend chưa gửi roles -> luôn không lỗi
        }))
    } catch (err) {
        console.error("Lỗi tải account:", err)
    }
})

// Map status → màu
const statusColor = (st) => {
    switch (st) {
        case "Active": return "green"
        case "Inactive": return "grey"
        case "Pending": return "orange"
        default: return "primary"
    }
}

// Format ngày
const formatDate = (date) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("vi-VN")
}

// Search
const filteredAccounts = computed(() =>
    accounts.value.filter(acc =>
        acc.username?.toLowerCase().includes(search.value.toLowerCase()) ||
        acc.email?.toLowerCase().includes(search.value.toLowerCase())
    )
)
</script>