<template>
  <div class="auth-wrapper d-flex align-center justify-center pa-4">
    <v-card class="auth-card rounded-lg" max-width="460" :class="$vuetify.display.smAndUp ? 'pa-8' : 'pa-6'" elevation="0" border>
      <v-card-item class="justify-center pb-2">
        <div class="text-center">
          <h1 class="text-h4 font-weight-bold mb-2">Đăng ký</h1>
          <p class="text-body-2 text-grey">Tạo tài khoản để tiếp tục</p>
        </div>
      </v-card-item>

      <v-card-text>
        <v-form @submit.prevent="register">
          <v-row>
            <!-- Username -->
            <v-col cols="12">
              <v-text-field
                v-model="form.username"
                label="Tên đăng nhập"
                placeholder="your_username"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                hide-details
                required
              />
            </v-col>

            <!-- Email -->
            <v-col cols="12" class="pt-4">
              <v-text-field
                v-model="form.email"
                label="Email"
                type="email"
                placeholder="email@example.com"
                prepend-inner-icon="mdi-email"
                variant="outlined"
                hide-details
                required
              />
            </v-col>

            <!-- Password -->
            <v-col cols="12" class="pt-4">
              <v-text-field
                v-model="form.password"
                label="Mật khẩu"
                :type="visible1 ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="visible1 ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="visible1 = !visible1"
                variant="outlined"
                hide-details
                required
              />
            </v-col>

            <!-- Confirm Password -->
            <v-col cols="12" class="pt-4">
              <v-text-field
                v-model="form.confirmPassword"
                label="Xác nhận mật khẩu"
                :type="visible2 ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock-check"
                :append-inner-icon="visible2 ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="visible2 = !visible2"
                :error="passwordError"
                :error-messages="passwordError ? 'Mật khẩu không khớp' : ''"
                variant="outlined"
                hide-details
                required
              />
            </v-col>

            <!-- Privacy Policy -->
            <v-col cols="12" class="pt-4">
              <div class="d-flex align-center gap-2">
                <v-checkbox
                  v-model="form.privacyPolicies"
                  hide-details
                />
                <span class="text-body-2">Tôi đồng ý với <strong>chính sách & điều khoản</strong></span>
              </div>
            </v-col>

            <!-- Submit Button -->
            <v-col cols="12" class="pt-4">
              <v-btn block color="primary" size="large" type="submit">
                Đăng ký
              </v-btn>
            </v-col>

            <!-- Link Login -->
            <v-col cols="12" class="text-center mt-2">
              <span class="text-body-2">Bạn đã có tài khoản?</span>
              <router-link to="/login" class="text-primary text-decoration-none ms-1">
                Đăng nhập
              </router-link>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
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

  if (!form.value.username || !form.value.email || !form.value.password) {
    alert("Vui lòng nhập đầy đủ thông tin!")
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
  background: linear-gradient(135deg, rgba(245, 222, 179, 0.1) 0%, rgba(238, 216, 174, 0.1) 100%);
}

:deep(.auth-card) {
  border-radius: 8px !important;
}
</style>