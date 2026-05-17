<template>
  <div class="auth-wrapper d-flex align-center justify-start pa-4">
    <v-card class="auth-card rounded-xl" max-width="420" :class="$vuetify.display.smAndUp ? 'pa-8' : 'pa-6'"
      elevation="0">
      <v-card-item class="justify-center pb-2">
        <div class="text-center">
          <h1 class="text-h4 font-weight-bold mb-2 card-title">Đăng nhập</h1>
          <p class="text-body-2 card-subtitle">Quản lý tài khoản của bạn</p>
        </div>
      </v-card-item>

      <v-card-text>
        <v-form @submit.prevent="login">
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="form.email" label="Email" type="email" placeholder="email@example.com"
                prepend-inner-icon="mdi-email" variant="outlined" autofocus hide-details="auto"
                class="glass-field" />
            </v-col>

            <v-col cols="12" class="pt-4">
              <v-text-field v-model="form.password" label="Mật khẩu" :type="isPasswordVisible ? 'text' : 'password'"
                placeholder="••••••••" prepend-inner-icon="mdi-lock"
                :append-inner-icon="isPasswordVisible ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="isPasswordVisible = !isPasswordVisible" variant="outlined" hide-details="auto"
                class="glass-field" />
            </v-col>

            <v-col cols="12" class="d-flex align-center justify-space-between my-2">
              <v-checkbox v-model="form.remember" label="Ghi nhớ tôi" hide-details class="glass-checkbox" />
              <router-link to="/forgot-password" class="forgot-link">Quên mật khẩu?</router-link>
            </v-col>

            <v-col cols="12">
              <v-btn block size="large" type="submit" :loading="isLoading" class="login-btn">
                Đăng nhập
              </v-btn>
            </v-col>

            <v-col cols="12" class="text-center mt-2">
              <span class="card-subtitle text-body-2">Chưa có tài khoản?</span>
              <router-link to="/register" class="register-link ms-1">
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

const normalizeRoles = rawRoles => {
  if (!rawRoles) return []
  const rolesArray = Array.isArray(rawRoles) ? rawRoles : [...rawRoles]
  return rolesArray
    .map(role => {
      if (typeof role === "string") return role
      return role?.authority || role?.roleName || role?.name || ""
    })
    .filter(Boolean)
    .map(role => (role.startsWith("ROLE_") ? role : `ROLE_${role}`))
}

const clearOldAuth = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("accessToken")
  localStorage.removeItem("accountId")
  localStorage.removeItem("username")
  localStorage.removeItem("email")
  localStorage.removeItem("roles")
  localStorage.removeItem("userRole")
  localStorage.removeItem("cartId")
}

const login = async () => {
  try {
    if (!form.value.email?.trim() || !form.value.password?.trim()) {
      alert("Vui lòng nhập đầy đủ email và mật khẩu")
      return
    }

    isLoading.value = true
    clearOldAuth()

    const res = await loginApi.login({
      email: form.value.email.trim(),
      password: form.value.password,
    })

    const payload = res.data?.data || res.data || {}
    const accessToken = payload.accessToken || payload.token || res.data?.accessToken || res.data?.token || null
    const accountId = payload.accountId || res.data?.accountId || null
    const username = payload.username || res.data?.username || ""
    const email = payload.email || res.data?.email || ""
    const normalizedRoles = normalizeRoles(payload.roles || res.data?.roles || [])

    if (!accessToken) {
      alert("Response login không có token.")
      return
    }

    userStore.login({ accountId, token: accessToken, username, email, roles: normalizedRoles })

    localStorage.setItem("token", accessToken)
    localStorage.setItem("accessToken", accessToken)
    localStorage.setItem("accountId", String(accountId || ""))
    localStorage.setItem("username", username)
    localStorage.setItem("email", email)
    localStorage.setItem("roles", JSON.stringify(normalizedRoles))
    if (normalizedRoles.length > 0) localStorage.setItem("userRole", normalizedRoles[0])

    window.dispatchEvent(new Event("auth-changed"))
    alert(res.data?.message || "Đăng nhập thành công!")

    if (normalizedRoles.includes("ROLE_ADMIN")) { router.push({ name: "AdminDashboard" }); return }
    if (normalizedRoles.includes("ROLE_STAFF")) { router.push({ name: "StaffPosSale" }); return }
    router.push({ name: "Home" })
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.response?.data || "Sai email hoặc mật khẩu!"
    alert(errorMessage)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.auth-wrapper {
  min-height: 100vh;
  background-image: url('/images/AnhNen.png');
  background-size: cover;
  background-position: center right;
  background-repeat: no-repeat;
  padding-left: 20vw !important;
}

.auth-card {
  background: rgba(255, 255, 255, 0.12) !important;
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  border-radius: 20px !important;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  width: 100%;
}

.card-title {
  color: #ffffff !important;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: -0.5px;
}

.card-subtitle {
  color: rgba(255, 255, 255, 0.75) !important;
}

/* Glass input fields */
:deep(.glass-field .v-field) {
  background: rgba(255, 255, 255, 0.15) !important;
  border-radius: 10px !important;
}

:deep(.glass-field .v-field__outline) {
  --v-field-border-opacity: 0.4;
  color: rgba(255, 255, 255, 0.5) !important;
}

:deep(.glass-field .v-field__outline__start),
:deep(.glass-field .v-field__outline__end),
:deep(.glass-field .v-field__outline__notch) {
  border-color: rgba(255, 255, 255, 0.35) !important;
}

:deep(.glass-field .v-field--focused .v-field__outline__start),
:deep(.glass-field .v-field--focused .v-field__outline__end),
:deep(.glass-field .v-field--focused .v-field__outline__notch) {
  border-color: rgba(255, 255, 255, 0.8) !important;
}

:deep(.glass-field input),
:deep(.glass-field .v-field__input) {
  color: #ffffff !important;
  caret-color: #ffffff;
}

:deep(.glass-field input::placeholder) {
  color: rgba(255, 255, 255, 0.45) !important;
}

:deep(.glass-field .v-label) {
  color: rgba(255, 255, 255, 0.7) !important;
}

:deep(.glass-field .v-field--focused .v-label) {
  color: #ffffff !important;
}

:deep(.glass-field .v-icon) {
  color: rgba(255, 255, 255, 0.7) !important;
}

/* Checkbox */
:deep(.glass-checkbox .v-label) {
  color: rgba(255, 255, 255, 0.85) !important;
  font-size: 14px;
}

:deep(.glass-checkbox .v-checkbox-btn) {
  color: rgba(255, 255, 255, 0.7) !important;
}

/* Links */
.forgot-link {
  color: rgba(255, 255, 255, 0.85) !important;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
}

.forgot-link:hover {
  color: #ffffff !important;
  text-decoration: underline;
}

.register-link {
  color: #ffffff !important;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: opacity 0.2s;
}

.register-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

/* Login button */
.login-btn {
  background: rgba(255, 255, 255, 0.9) !important;
  color: #1a1a2e !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px;
  border-radius: 10px !important;
  transition: all 0.25s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.login-btn:hover {
  background: #ffffff !important;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 600px) {
  .auth-wrapper {
    padding-left: 1rem !important;
    padding-right: 1rem !important;
    justify-content: center !important;
    background-position: center center;
  }
}
</style>