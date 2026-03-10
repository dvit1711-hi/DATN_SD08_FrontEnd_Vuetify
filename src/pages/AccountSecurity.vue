<template>
    <VRow>
        <!-- SECTION: Change Password -->
        <VCol cols="12">
            <VCard title="Change Password">
                <VForm>
                    <VCardText>
                        <!-- 👉 Current Password -->
                        <VRow>
                            <VCol cols="12" md="6">
                                <VTextField v-model="currentPassword"
                                    :type="isCurrentPasswordVisible ? 'text' : 'password'"
                                    :append-inner-icon="isCurrentPasswordVisible ? 'bx-hide' : 'bx-show'"
                                    label="Current Password" placeholder="············"
                                    @click:append-inner="isCurrentPasswordVisible = !isCurrentPasswordVisible" />
                            </VCol>
                        </VRow>

                        <!-- 👉 New Password -->
                        <VRow>
                            <VCol cols="12" md="6">
                                <VTextField v-model="newPassword" :type="isNewPasswordVisible ? 'text' : 'password'"
                                    :append-inner-icon="isNewPasswordVisible ? 'bx-hide' : 'bx-show'"
                                    label="New Password" autocomplete="on" placeholder="············"
                                    @click:append-inner="isNewPasswordVisible = !isNewPasswordVisible" />
                            </VCol>

                            <VCol cols="12" md="6">
                                <VTextField v-model="confirmPassword"
                                    :type="isConfirmPasswordVisible ? 'text' : 'password'"
                                    :append-inner-icon="isConfirmPasswordVisible ? 'bx-hide' : 'bx-show'"
                                    label="Confirm New Password" placeholder="············"
                                    @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible" />
                            </VCol>
                        </VRow>
                    </VCardText>

                    <!-- 👉 Password Requirements -->
                    <VCardText>
                        <p class="text-base font-weight-medium mt-2">Password Requirements:</p>

                        <ul class="d-flex flex-column gap-y-3">
                            <li v-for="item in passwordRequirements" :key="item" class="d-flex">
                                <div>
                                    <VIcon size="7" icon="bxs-circle" class="me-3" />
                                </div>
                                <span class="font-weight-medium">{{ item }}</span>
                            </li>
                        </ul>
                    </VCardText>

                    <!-- 👉 Action Buttons -->
                    <VCardText class="d-flex flex-wrap gap-4">
                        <VBtn @click="handleChangePassword">Save changes</VBtn>

                        <VBtn type="reset" color="secondary" variant="tonal">Reset</VBtn>
                    </VCardText>
                </VForm>
            </VCard>
        </VCol>
    </VRow>

    <!-- 👉 Snackbar thông báo -->
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
    'At least 8 characters',
    'Contains uppercase and lowercase letters',
    'Contains at least one number',
]

// Validate password before send
function validatePassword() {
    if (!currentPassword.value) return 'Please enter your current password.'
    if (!newPassword.value) return 'Please enter a new password.'
    if (newPassword.value.length < 8) return 'Password must be at least 8 characters.'
    if (newPassword.value !== confirmPassword.value) return 'Confirm password does not match.'
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

        showSnackbar('Password changed successfully!', 'success')

        // Reset form
        currentPassword.value = ''
        newPassword.value = ''
        confirmPassword.value = ''
    } catch (err) {
        showSnackbar(err?.response?.data?.message || 'Failed to change password.', 'error')
    }
}
</script>