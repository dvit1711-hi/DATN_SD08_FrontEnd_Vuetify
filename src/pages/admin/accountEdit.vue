<template>
    <VRow>
        <VCol cols="12">
            <VCard class="pa-4">
                <div class="d-flex justify-space-between align-center mb-4">
                    <h2 class="text-h6">Cập nhật trạng thái Account</h2>
                    <VBtn variant="tonal" color="secondary" @click="goBack">Quay lại</VBtn>
                </div>

                <VRow>
                    <VCol cols="12" md="4">
                        <div class="d-flex flex-column align-center">
                            <VAvatar size="110" rounded="lg" class="mb-4">
                                <img :src="getImage(account.images)" />
                            </VAvatar>

                            <div class="text-subtitle-1 font-weight-medium">
                                {{ account.username }}
                            </div>

                            <div class="text-body-2 text-medium-emphasis">
                                {{ account.email }}
                            </div>
                        </div>
                    </VCol>

                    <VCol cols="12" md="8">
                        <VForm @submit.prevent="saveStatus">
                            <VRow>
                                <VCol cols="12" md="6">
                                    <VTextField label="Username" :model-value="account.username" readonly />
                                </VCol>

                                <VCol cols="12" md="6">
                                    <VTextField label="Current Status" :model-value="account.statusName" readonly />
                                </VCol>

                                <VCol cols="12" md="6">
                                    <VSelect v-model="form.statusId" label="New Status" :items="statusOptions"
                                        item-title="title" item-value="value" />
                                </VCol>

                                <VCol cols="12" class="d-flex gap-3">
                                    <VBtn color="primary" type="submit" :loading="saving">
                                        Lưu trạng thái
                                    </VBtn>

                                    <VBtn color="secondary" variant="tonal" @click="goBack">
                                        Hủy
                                    </VBtn>
                                </VCol>
                            </VRow>
                        </VForm>
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

const saving = ref(false)

const account = ref({
    id: null,
    username: "",
    email: "",
    images: "",
    statusId: null,
    statusName: "",
})

const form = ref({
    statusId: null,
})

const statusOptions = ref([])

const loadStatuses = async () => {
    try {
        const res = await accountApi.getStatuses()

        statusOptions.value = (res.data || []).map(st => ({
            title: st.statusName,
            value: st.id,
        }))
    } catch (err) {
        console.error("Lỗi load status list:", err)

        statusOptions.value = [
            { title: "ACTIVE", value: 1 },
            { title: "INACTIVE", value: 2 },
            { title: "LOCKED", value: 3 },
            { title: "BANNED", value: 4 },
        ]
    }
}

const loadAccount = async () => {
    try {
        const res = await accountApi.getById(route.params.id)
        const acc = res.data.account || res.data

        account.value = {
            id: acc.id || acc.accountID || acc.accountId || null,
            username: acc.username || "",
            email: acc.email || "",
            images: acc.images || "",
            statusId: acc.status?.id || acc.statusID || acc.statusId || null,
            statusName: acc.status?.statusName || acc.statusName || "UNKNOWN",
        }

        form.value.statusId = account.value.statusId
    } catch (err) {
        console.error("Lỗi load account status:", err)
        alert("Không tải được tài khoản!")
    }
}

const goToAccountList = () => {
    router.push({ name: "AdminAccounts" })
}

const saveStatus = async () => {
    try {
        saving.value = true

        if (!account.value.id) {
            alert("Không tìm thấy accountId!")
            return
        }

        if (!form.value.statusId) {
            alert("Vui lòng chọn trạng thái!")
            return
        }

        await accountApi.updateStatus(account.value.id, {
            id: form.value.statusId,
        })

        alert("Cập nhật trạng thái thành công!")
        goToAccountList()
    } catch (err) {
        console.error("Lỗi update status:", err)
        console.error("Response:", err?.response?.data)
        alert(err?.response?.data?.message || "Cập nhật trạng thái thất bại!")
    } finally {
        saving.value = false
    }
}

const getImage = img => {
    if (!img) return "/default-avatar.png"
    if (img.startsWith("data:image")) return img
    if (img.startsWith("http://") || img.startsWith("https://")) return img
    return `http://localhost:8080${img}`
}

const goBack = () => {
    goToAccountList()
}

onMounted(async () => {
    await loadStatuses()
    await loadAccount()
})
</script>