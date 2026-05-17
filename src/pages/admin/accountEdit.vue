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
                                    <VTextField label="Current Status" :model-value="getStatusText(account.statusName)"
                                        readonly />
                                </VCol>

                                <VCol cols="12" md="6">
                                    <VSelect v-model="form.statusId" label="New Status" :items="statusOptions"
                                        item-title="title" item-value="value" placeholder="Chọn trạng thái" clearable />
                                </VCol>

                                <VCol cols="12" class="d-flex gap-3">
                                    <VBtn color="primary" type="submit" :loading="saving">
                                        Lưu trạng thái
                                    </VBtn>

                                    <VBtn color="secondary" variant="tonal" @click="cancelEdit">
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
import { ref, onMounted, computed } from "vue"
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

const currentStatusId = computed(() => Number(account.value.statusId))
const selectedStatusId = computed(() =>
    form.value.statusId !== null && form.value.statusId !== undefined
        ? Number(form.value.statusId)
        : null
)

const hasChanges = computed(() => {
    return selectedStatusId.value !== null && selectedStatusId.value !== currentStatusId.value
})

const getStatusTitleById = id => {
    const found = statusOptions.value.find(item => Number(item.value) === Number(id))
    return found?.title || ""
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

const getStatusNameByEnglish = st => {
    const nameMap = {
        "Active": "Đang hoạt động",
        "Inactive": "Không hoạt động",
        "Locked": "Bị khóa",
        "Banned": "Bị cấm",
        "Pending": "Chờ xác nhận",
    }
    return nameMap[st] || st
}

const getConfirmMessageByStatus = statusTitle => {
    const messages = {
        "Đang hoạt động": `Bạn có chắc muốn kích hoạt tài khoản "${account.value.username}" không?`,
        "Không hoạt động": `Bạn có chắc muốn vô hiệu hóa tài khoản "${account.value.username}" không?`,
        "Bị khóa": `Bạn có chắc muốn khóa tài khoản "${account.value.username}" không?\n\nNgười dùng sẽ không thể đăng nhập sau khi bị khóa.`,
        "Bị cấm": `Bạn có chắc muốn cấm tài khoản "${account.value.username}" không?`,
        "Chờ xác nhận": `Bạn có chắc muốn đưa tài khoản "${account.value.username}" vào hàng chờ xác nhận không?`,
    }
    return messages[statusTitle] || `Bạn có chắc muốn cập nhật trạng thái tài khoản "${account.value.username}" không?`
}

const getSuccessMessageByStatus = statusTitle => {
    const messages = {
        "Đang hoạt động": "Kích hoạt tài khoản thành công!",
        "Không hoạt động": "Vô hiệu hóa tài khoản thành công!",
        "Bị khóa": "Khóa tài khoản thành công!",
        "Bị cấm": "Cấm tài khoản thành công!",
        "Chờ xác nhận": "Cập nhật trạng thái sang chờ xác nhận thành công!",
    }
    return messages[statusTitle] || "Cập nhật trạng thái thành công!"
}

const loadStatuses = async () => {
    try {
        const res = await accountApi.getStatuses()

        statusOptions.value = (res.data || []).map(st => {
            const statusName = st.statusName || st.name || ""
            const viName = getStatusText(statusName) || getStatusNameByEnglish(statusName) || statusName
            return {
                title: viName,
                value: Number(st.id),
            }
        })
    } catch (err) {
        console.error("Lỗi load status list:", err)

        statusOptions.value = [
            { title: "Đang hoạt động", value: 1 },
            { title: "Bị cấm", value: 2 },
            { title: "Không hoạt động", value: 3 },
            { title: "Bị khóa", value: 4 },
            { title: "Chờ xác nhận", value: 5 },
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
            statusId: Number(acc.status?.id || acc.statusID || acc.statusId || 0) || null,
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
        if (!account.value.id) {
            alert("Không tìm thấy accountId!")
            return
        }

        if (!form.value.statusId) {
            alert("Vui lòng chọn trạng thái!")
            return
        }

        if (Number(form.value.statusId) === Number(account.value.statusId)) {
            alert("Trạng thái mới đang trùng với trạng thái hiện tại!")
            return
        }

        const selectedStatusTitle = getStatusTitleById(form.value.statusId)

        const confirmed = window.confirm(getConfirmMessageByStatus(selectedStatusTitle))
        if (!confirmed) return

        saving.value = true

        await accountApi.updateStatus(account.value.id, {
            id: Number(form.value.statusId),
        })

        account.value.statusId = Number(form.value.statusId)
        account.value.statusName = selectedStatusTitle || account.value.statusName

        alert(getSuccessMessageByStatus(selectedStatusTitle))
        goToAccountList()
    } catch (err) {
        console.error("Lỗi update status:", err)
        console.error("Response:", err?.response?.data)
        alert(err?.response?.data?.message || "Cập nhật trạng thái thất bại!")
    } finally {
        saving.value = false
    }
}

const cancelEdit = () => {
    if (hasChanges.value) {
        const confirmed = window.confirm(
            "Bạn có thay đổi chưa lưu. Bạn có chắc muốn hủy không?"
        )
        if (!confirmed) return
    }

    form.value.statusId = account.value.statusId
    goToAccountList()
}

const goBack = () => {
    if (hasChanges.value) {
        const confirmed = window.confirm(
            "Bạn có thay đổi chưa lưu. Bạn có chắc muốn quay lại không?"
        )
        if (!confirmed) return
    }

    goToAccountList()
}

const getImage = img => {
    if (!img) return "/default-avatar.png"
    if (img.startsWith("data:image")) return img
    if (img.startsWith("http://") || img.startsWith("https://")) return img
    return `http://localhost:8080${img}`
}

onMounted(async () => {
    await loadStatuses()
    await loadAccount()
})
</script>