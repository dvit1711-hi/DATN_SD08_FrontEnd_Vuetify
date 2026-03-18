<template>
    <VRow>
        <VCol cols="12">
            <VCard title="Đổi mật khẩu">
                <VForm>
                    <VCardText>

                        <!-- 👉 Current Password -->
                        <VRow>
                            <VCol cols="12" md="6">
                                <VTextField v-model="currentPassword"
                                    :type="isCurrentPasswordVisible ? 'text' : 'password'"
                                    :append-inner-icon="isCurrentPasswordVisible ? 'mdi-eye-off' : 'mdi-eye'"
                                    label="Mật khẩu hiện tại" placeholder="············"
                                    @click:append-inner="isCurrentPasswordVisible = !isCurrentPasswordVisible" />
                            </VCol>
                        </VRow>

                        <!-- 👉 New Password -->
                        <VRow>
                            <VCol cols="12" md="6">
                                <VTextField v-model="newPassword" :type="isNewPasswordVisible ? 'text' : 'password'"
                                    :append-inner-icon="isNewPasswordVisible ? 'mdi-eye-off' : 'mdi-eye'"
                                    label="Mật khẩu mới" autocomplete="on" placeholder="············"
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

                    <!-- 👉 Password Requirements -->
                    <VCardText>
                        <p class="text-base font-weight-medium mt-2">Yêu cầu mật khẩu:</p>

                        <ul class="d-flex flex-column gap-y-3">
                            <li v-for="item in passwordRequirements" :key="item" class="d-flex align-center">
                                <VIcon size="14" icon="mdi-circle-small" class="me-3" />
                                <span class="font-weight-medium">{{ item }}</span>
                            </li>
                        </ul>
                    </VCardText>

                    <!-- 👉 Action Buttons -->
                    <VCardText class="d-flex flex-wrap gap-4">
                        <VBtn @click="handleChangePassword">Lưu thay đổi</VBtn>
                        <VBtn type="reset" color="secondary" variant="tonal">Làm mới</VBtn>
                    </VCardText>

                </VForm>
            </VCard>
        </VCol>
    </VRow>

    <!-- 👉 Snackbar -->
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
        {{ snackbar.message }}
    </VSnackbar>
</template>

<script setup>
import { ref } from 'vue'
import accountApi from '@/api/accountApi'

// Form fields
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

// Toggle visibility
const isCurrentPasswordVisible = ref(false)
const isNewPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)

// Snackbar state
const snackbar = ref({
    show: false,
    message: '',
    color: '',
})

// Hàm hiển thị snackbar
function showSnackbar(message, color = 'success') {
    snackbar.value.message = message
    snackbar.value.color = color
    snackbar.value.show = true
}

// Password requirement list
const passwordRequirements = [
    'Ít nhất 8 ký tự',
    'Bao gồm chữ hoa và chữ thường',
    'Có ít nhất một số',
]

// Validate password before send
function validatePassword() {
    if (!currentPassword.value)
        return 'Vui lòng nhập mật khẩu hiện tại.'

    if (!newPassword.value)
        return 'Vui lòng nhập mật khẩu mới.'

    if (newPassword.value.length < 8)
        return 'Mật khẩu phải có ít nhất 8 ký tự.'

    if (newPassword.value !== confirmPassword.value)
        return 'Xác nhận mật khẩu không khớp.'

    return null
}

// Submit change password
const handleChangePassword = async () => {
    const error = validatePassword()

    if (error) {
        showSnackbar(error, 'error')
        return
    }

    try {
        await accountApi.changePassword({
            currentPassword: currentPassword.value,
            newPassword: newPassword.value,
        })

        showSnackbar('Đổi mật khẩu thành công!', 'success')

        // Reset form
        currentPassword.value = ''
        newPassword.value = ''
        confirmPassword.value = ''
    } catch (err) {
        showSnackbar(err?.response?.data?.message || 'Đổi mật khẩu thất bại.', 'error')
    }
}
</script>