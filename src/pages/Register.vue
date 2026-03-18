<template>
    <div class="auth-wrapper d-flex align-center justify-center pa-4">
        <div class="position-relative my-sm-16">

            <VCard class="auth-card" max-width="460" :class="$vuetify.display.smAndUp ? 'pa-6' : 'pa-0'">
                <VCardItem class="justify-center">
                    <h1 class="text-h5">Đăng ký</h1>
                </VCardItem>

                <VCardText>
                    <p>Tạo tài khoản để tiếp tục</p>
                </VCardText>

                <VCardText>
                    <VForm @submit.prevent="register">
                        <VRow>

                            <!-- Username -->
                            <VCol cols="12">
                                <VTextField v-model="form.username" label="Username" placeholder="your_username"
                                    required />
                            </VCol>

                            <!-- Email -->
                            <VCol cols="12">
                                <VTextField v-model="form.email" label="Email" type="email"
                                    placeholder="email@example.com" required />
                            </VCol>

                            <!-- Password -->
                            <VCol cols="12">
                                <VTextField v-model="form.password" label="Password"
                                    :type="visible1 ? 'text' : 'password'"
                                    :append-inner-icon="visible1 ? 'mdi-eye-off' : 'mdi-eye'"
                                    @click:append-inner="visible1 = !visible1" required />
                            </VCol>

                            <!-- Confirm Password -->
                            <VCol cols="12">
                                <VTextField v-model="form.confirmPassword" label="Confirm Password"
                                    :type="visible2 ? 'text' : 'password'"
                                    :append-inner-icon="visible2 ? 'mdi-eye-off' : 'mdi-eye'"
                                    @click:append-inner="visible2 = !visible2" :error="passwordError"
                                    :error-messages="passwordError ? 'Passwords do not match' : ''" required />
                            </VCol>

                            <!-- Privacy -->
                            <VCol cols="12" class="d-flex align-center">
                                <VCheckbox v-model="form.privacyPolicies" />
                                <span>Tôi đồng ý với <b>chính sách & điều khoản</b></span>
                            </VCol>

                            <!-- Button -->
                            <VCol cols="12">
                                <VBtn block color="primary" type="submit">
                                    Đăng ký
                                </VBtn>
                            </VCol>

                            <!-- Link Login -->
                            <VCol cols="12" class="text-center">
                                Bạn đã có tài khoản?
                                <RouterLink to="/login" class="text-primary">Đăng nhập</RouterLink>
                            </VCol>

                        </VRow>
                    </VForm>
                </VCardText>
            </VCard>

        </div>
    </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { useRouter } from "vue-router"
import registerApi from "@/api/registerApi"

const router = useRouter()

const form = ref({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    privacyPolicies: false,
})

// Ẩn/hiện mật khẩu
const visible1 = ref(false)
const visible2 = ref(false)

// Kiểm tra mật khẩu trùng nhau
const passwordError = computed(() => {
    return form.value.confirmPassword !== "" && form.value.password !== form.value.confirmPassword
})

const register = async () => {
    if (passwordError.value) {
        alert("Mật khẩu nhập lại không khớp!")
        return
    }

    if (!form.value.privacyPolicies) {
        alert("Bạn phải đồng ý điều khoản!")
        return
    }

    try {
        await registerApi.register({
            username: form.value.username,
            email: form.value.email,
            password: form.value.password,
        })

        alert("Đăng ký thành công!")
        router.push("/login")
    } catch (error) {
        console.error(error)
        alert("Đăng ký thất bại!")
    }
}
</script>

<style scoped>
.auth-wrapper {
    height: 100vh;
}
</style>