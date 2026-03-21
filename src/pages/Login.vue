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
            <!-- Username -->
            <v-col cols="12">
              <v-text-field v-model="form.username" label="Tên đăng nhập" placeholder="your_username"
                prepend-inner-icon="mdi-account" variant="outlined" autofocus hide-details />
            </v-col>

            <!-- Password -->
            <v-col cols="12" class="pt-4">
              <v-text-field v-model="form.password" label="Mật khẩu" :type="isPasswordVisible ? 'text' : 'password'"
                placeholder="••••••••" prepend-inner-icon="mdi-lock"
                :append-inner-icon="isPasswordVisible ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="isPasswordVisible = !isPasswordVisible" variant="outlined" hide-details />
            </v-col>

            <v-col cols="12" class="d-flex align-center justify-space-between my-4">
              <v-checkbox v-model="form.remember" label="Ghi nhớ tôi" hide-details />
              <a href="#" class="text-primary text-decoration-none">Quên mật khẩu?</a>
            </v-col>

            <v-col cols="12">
              <v-btn block color="primary" size="large" type="submit">
                Đăng nhập
              </v-btn>
            </v-col>

            <!-- Link to Register -->
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
import axios from "axios"
import { useRouter } from "vue-router"
import accountApi from "@/api/accountApi"

const router = useRouter()

const form = ref({
  username: "",
  password: "",
  remember: false
})

const isPasswordVisible = ref(false)

const login = async () => {
  console.log("=== LOGIN FUNCTION CALLED ===")
  try {
    console.log("Form values:", form.value)

    if (!form.value.username || !form.value.password) {
      alert("Vui lòng nhập tên đăng nhập và mật khẩu")
      return
    }

    console.log("Sending login request to API...")
    const res = await axios.post("http://localhost:8080/auth/login", {
      username: form.value.username,
      password: form.value.password,
    })

    console.log("✅ Login response:", res.data)

    // Lưu token + accountId + username
    localStorage.setItem("token", res.data.token)
    localStorage.setItem("accountId", res.data.accountId)
    localStorage.setItem("username", res.data.username)

    // Nếu username là 'admin' → set role = 'admin' luôn
    if (res.data.username === 'admin') {
      localStorage.setItem("userRole", 'admin')
      console.log("✅ Set admin role for username: admin")
    } else {
      // Gọi API getById để lấy thông tin account (bao gồm role)
      if (res.data.accountId) {
        try {
          const accountRes = await accountApi.getById(res.data.accountId)
          console.log("📋 Full account response:", accountRes.data)

          const account = accountRes.data.account || accountRes.data
          console.log("📋 Account object:", account)
          console.log("📋 Account keys:", Object.keys(account))

          // Tìm role từ nhiều field có thể
          let userRole = null
          if (account.role) {
            userRole = account.role
          } else if (account.roleId) {
            userRole = account.roleId
          } else if (account.accountRole) {
            userRole = account.accountRole
          } else if (account.type) {
            userRole = account.type
          } else if (account.status) {
            // Nếu status là số, map sang admin/user
            userRole = account.status === 1 ? 'admin' : 'user'
          }

          if (userRole) {
            localStorage.setItem("userRole", userRole)
            console.log("✅ Saved userRole:", userRole)
          } else {
            console.warn("⚠️ Không tìm thấy role field trong account info")
            console.log("Available fields:", account)
          }
        } catch (error) {
          console.error("❌ Lỗi khi lấy thông tin account:", error)
        }
      }
    }

    console.log("Final stored data:", {
      accountId: localStorage.getItem("accountId"),
      username: localStorage.getItem("username"),
      userRole: localStorage.getItem("userRole")
    })

    window.dispatchEvent(new Event('auth-changed'))

    alert("Đăng nhập thành công!")
    router.push({ name: 'Home' })
  } catch (error) {
    console.error("Login error:", error)
    console.error("Error response:", error.response?.data)
    alert("Sai tài khoản hoặc mật khẩu!")
  }
}
</script>

<style scoped>
.auth-wrapper {
  height: 100vh;
  background: linear-gradient(135deg, rgba(245, 222, 179, 0.1) 0%, rgba(238, 216, 174, 0.1) 100%);
}

:deep(.auth-card) {
  border-radius: 8px !important;
}
</style>