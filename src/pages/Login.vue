<template>
  <div class="auth-wrapper d-flex align-center justify-center pa-4">
    <v-card class="auth-card rounded-lg" max-width="460" :class="$vuetify.display.smAndUp ? 'pa-8' : 'pa-6'"
      elevation="0" border>
      <v-card-item class="justify-center pb-2">
        <div class="text-center">
          <h1 class="text-h4 font-weight-bold mb-2">Đăng nhập</h1>
          <p class="text-body-2 text-grey">Quản lý tài khoản của bạn</p>
        </div>
      </v-card-item>

      <v-card-text>
        <v-form @submit.prevent="login">
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="form.email" label="Email" type="email" placeholder="email@example.com"
                prepend-inner-icon="mdi-email" variant="outlined" autofocus hide-details="auto" />
            </v-col>

            <v-col cols="12" class="pt-4">
              <v-text-field v-model="form.password" label="Mật khẩu" :type="isPasswordVisible ? 'text' : 'password'"
                placeholder="••••••••" prepend-inner-icon="mdi-lock"
                :append-inner-icon="isPasswordVisible ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="isPasswordVisible = !isPasswordVisible" variant="outlined" hide-details="auto" />
            </v-col>

            <v-col cols="12" class="d-flex align-center justify-space-between my-4">
              <v-checkbox v-model="form.remember" label="Ghi nhớ tôi" hide-details />
              <a href="#" class="text-primary text-decoration-none">Quên mật khẩu?</a>
            </v-col>

            <v-col cols="12">
              <v-btn block color="primary" size="large" type="submit" :loading="isLoading">
                Đăng nhập
              </v-btn>
            </v-col>

            <v-col cols="12" class="text-center mt-2">
              <span class="text-body-2">Chưa có tài khoản?</span>
              <router-link to="/register" class="text-primary text-decoration-none ms-1">
                Đăng ký ngay
              </router-link>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"
import { useUserStore } from "@/stores/user"
import loginApi from "@/api/loginApi"

const router = useRouter()
const userStore = useUserStore()

const form = ref({
  email: "",
  password: "",
  remember: false,
})

const isPasswordVisible = ref(false)
const isLoading = ref(false)

const login = async () => {
  try {
    if (!form.value.email || !form.value.password) {
      alert("Vui lòng nhập email và mật khẩu")
      return
    }

    isLoading.value = true

    const res = await loginApi.login({
      email: form.value.email,
      password: form.value.password,
    })

    console.log("✅ Login response:", res.data)

    userStore.login({
      accountId: res.data.accountId,
      token: res.data.token,
      username: res.data.username,
      email: res.data.email,
      roles: res.data.roles || [],
    })

    window.dispatchEvent(new Event("auth-changed"))

    alert(res.data.message || "Đăng nhập thành công!")
    router.push({ name: "Home" })
  } catch (error) {
    console.error("❌ Login error:", error)
    console.error("❌ Error response:", error.response?.data)

    const errorMessage =
      error.response?.data?.message ||
      error.response?.data ||
      "Sai email hoặc mật khẩu!"

    alert(errorMessage)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.auth-wrapper {
  height: 100vh;
  background: linear-gradient(135deg,
      rgba(245, 222, 179, 0.1) 0%,
      rgba(238, 216, 174, 0.1) 100%);
}

:deep(.auth-card) {
  border-radius: 8px !important;
}
</style>