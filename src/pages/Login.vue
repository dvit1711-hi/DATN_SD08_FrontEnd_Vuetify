<template>
    <div class="auth-wrapper d-flex align-center justify-center pa-4">
        <div class="position-relative my-sm-16">

            <VCard class="auth-card" max-width="460" :class="$vuetify.display.smAndUp ? 'pa-6' : 'pa-0'">
                <VCardItem class="justify-center">
                    <h1 class="text-h5">Đăng nhập</h1>
                </VCardItem>

                <VCardText>
                    <VForm @submit.prevent="login">
                        <VRow>

                            <!-- Username -->
                            <VCol cols="12">
                                <VTextField v-model="form.username" label="Username" placeholder="your_username"
                                    autofocus />
                            </VCol>

                            <!-- Password -->
                            <VCol cols="12">
                                <VTextField v-model="form.password" label="Password"
                                    :type="isPasswordVisible ? 'text' : 'password'" placeholder="••••••••"
                                    :append-inner-icon="isPasswordVisible ? 'bx-hide' : 'bx-show'"
                                    @click:append-inner="isPasswordVisible = !isPasswordVisible" />

                                <div class="d-flex align-center justify-space-between flex-wrap my-6">
                                    <VCheckbox v-model="form.remember" label="Remember me" />
                                    <a href="#" class="text-primary">Forgot Password?</a>
                                </div>

                                <VBtn block color="primary" type="submit">Đăng nhập</VBtn>
                            </VCol>

                            <!-- chuyển sang đăng ký -->
                            <VCol cols="12" class="text-center mt-4">
                                <span>Chưa có tài khoản?</span>
                                <RouterLink to="/register" class="text-primary ms-1">
                                    Đăng ký ngay
                                </RouterLink>
                            </VCol>

                        </VRow>
                    </VForm>
                </VCardText>
            </VCard>

        </div>
    </div>
</template>

<script setup>
import { ref } from "vue"
import axios from "axios"
import { useRouter } from "vue-router"

const router = useRouter()

// Form data
const form = ref({
    username: "",
    password: "",
    remember: false
})

const isPasswordVisible = ref(false)

// LOGIN FUNCTION
const login = async () => {
    try {
        const res = await axios.post("http://localhost:8080/auth/login", {
            username: form.value.username,
            password: form.value.password,
        })

        alert("Đăng nhập thành công!")
        router.push("/")
    } catch (error) {
        console.error(error)
        alert("Sai tài khoản hoặc mật khẩu!")
    }
}
</script>

<style scoped>
.auth-wrapper {
    height: 100vh;
}
</style>