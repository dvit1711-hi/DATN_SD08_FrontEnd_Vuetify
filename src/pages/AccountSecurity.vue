<template>
    <VRow>
        <VCol cols="12">
            <VCard title="Đổi mật khẩu">
                <VForm @submit.prevent="handleChangePassword">
                    <VCardText>
                        <VRow>
                            <VCol cols="12" md="6">
                                <VTextField v-model="currentPassword"
                                    :type="isCurrentPasswordVisible ? 'text' : 'password'"
                                    :append-inner-icon="isCurrentPasswordVisible ? 'mdi-eye-off' : 'mdi-eye'"
                                    label="Mật khẩu hiện tại" placeholder="············"
                                    @click:append-inner="isCurrentPasswordVisible = !isCurrentPasswordVisible" />
                            </VCol>
                        </VRow>

                        <VRow>
                            <VCol cols="12" md="6">
                                <VTextField v-model="newPassword" :type="isNewPasswordVisible ? 'text' : 'password'"
                                    :append-inner-icon="isNewPasswordVisible ? 'mdi-eye-off' : 'mdi-eye'"
                                    label="Mật khẩu mới" placeholder="············"
                                    @click:append-inner="isNewPasswordVisible = !isNewPasswordVisible" />
                            </VCol>

                            <VCol cols="12" md="6">
                                <VTextField v-model="confirmPassword"
                                    :type="isConfirmPasswordVisible ? 'text' : 'password'"
                                    :append-inner-icon="isConfirmPasswordVisible ? 'mdi-eye-off' : 'mdi-eye'"
                                    label="Xác nhận mật khẩu mới" placeholder="············"
                                    @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible" />
                            </VCol>
                        </VRow>
                    </VCardText>

                    <VCardText>
                        <p class="text-base font-weight-medium mt-2">Yêu cầu mật khẩu:</p>
                        <ul class="d-flex flex-column gap-y-3">
                            <li v-for="item in passwordRequirements" :key="item" class="d-flex align-center">
                                <VIcon size="14" icon="mdi-circle-small" class="me-3" />
                                <span class="font-weight-medium">{{ item }}</span>
                            </li>
                        </ul>
                    </VCardText>

                    <VCardText class="d-flex flex-wrap gap-4">
                        <VBtn type="submit" color="primary" :loading="loading">Lưu thay đổi</VBtn>
                        <VBtn type="button" color="secondary" variant="tonal" @click="resetForm">Làm mới</VBtn>
                    </VCardText>
                </VForm>
            </VCard>
        </VCol>
    </VRow>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
        {{ snackbar.message }}
    </VSnackbar>
</template>

<script setup>
import { ref } from 'vue'
import accountApi from '@/api/accountApi'

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)

const isCurrentPasswordVisible = ref(false)
const isNewPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)

const snackbar = ref({
    show: false,
    message: '',
    color: '',
})

const passwordRequirements = [
    'Ít nhất 8 ký tự',
    'Bao gồm chữ hoa và chữ thường',
    'Có ít nhất một số',
]

function showSnackbar(message, color = 'success') {
    snackbar.value.message = message
    snackbar.value.color = color
    snackbar.value.show = true
}

function resetForm() {
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
}

function validatePassword() {
    if (!currentPassword.value.trim()) return 'Vui lòng nhập mật khẩu hiện tại.'
    if (!newPassword.value.trim()) return 'Vui lòng nhập mật khẩu mới.'
    if (!confirmPassword.value.trim()) return 'Vui lòng nhập xác nhận mật khẩu mới.'
    // if (newPassword.value.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.'
    // if (!/[A-Z]/.test(newPassword.value) || !/[a-z]/.test(newPassword.value)) {
    //     return 'Mật khẩu phải có chữ hoa và chữ thường.'
    // }
    // if (!/\d/.test(newPassword.value)) return 'Mật khẩu phải có ít nhất một số.'
    if (newPassword.value !== confirmPassword.value) return 'Xác nhận mật khẩu không khớp.'
    if (currentPassword.value === newPassword.value) return 'Mật khẩu mới không được trùng mật khẩu hiện tại.'
    return null
}

const handleChangePassword = async () => {
    const error = validatePassword()
    if (error) {
        showSnackbar(error, 'error')
        return
    }

    try {
        loading.value = true

        await accountApi.changePassword({
            currentPassword: currentPassword.value,
            newPassword: newPassword.value,
        })

        showSnackbar('Đổi mật khẩu thành công!', 'success')
        resetForm()
    } catch (err) {
        console.error(err)
        showSnackbar(err?.response?.data?.message || 'Đổi mật khẩu thất bại.', 'error')
    } finally {
        loading.value = false
    }
}
</script>