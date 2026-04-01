<template>
  <div class="auth-wrapper d-flex align-center justify-center pa-4">
    <v-card class="auth-card rounded-lg" max-width="460" :class="$vuetify.display.smAndUp ? 'pa-8' : 'pa-6'"
      elevation="0" border>
      <v-card-item class="justify-center pb-2">
        <div class="text-center">
          <h1 class="text-h4 font-weight-bold mb-2">Đăng ký</h1>
          <p class="text-body-2 text-grey">Tạo tài khoản để tiếp tục</p>
        </div>
      </v-card-item>

      <v-card-text>
        <v-form @submit.prevent="confirmRegister">
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="form.username" label="Tên đăng nhập" placeholder="your_username"
                prepend-inner-icon="mdi-account" variant="outlined" hide-details="auto" required />
            </v-col>

            <v-col cols="12" class="pt-4">
              <v-text-field v-model="form.email" label="Email" type="email" placeholder="email@example.com"
                prepend-inner-icon="mdi-email" variant="outlined" :error="emailError"
                :error-messages="emailError ? 'Email không hợp lệ' : ''" hide-details="auto" required />
            </v-col>

            <v-col cols="12" class="pt-1">
              <v-btn class="otp-btn" block color="primary" variant="flat" size="large" :loading="isSendingOtp"
                :disabled="!form.email || !!emailError" @click="sendOtp">
                {{ otpSent ? "Gửi lại mã OTP" : "Gửi mã OTP" }}
              </v-btn>
            </v-col>

            <v-col cols="12" class="pt-0" v-if="otpMessage">
              <div class="otp-message">
                {{ otpMessage }}
              </div>
            </v-col>

            <v-col cols="12" class="pt-4">
              <v-text-field v-model="form.otp" label="Mã OTP" placeholder="Nhập mã OTP đã gửi về email"
                prepend-inner-icon="mdi-shield-key" variant="outlined" hide-details="auto" required />
            </v-col>

            <v-col cols="12" class="pt-4">
              <v-text-field v-model="form.password" label="Mật khẩu" :type="visible1 ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock" :append-inner-icon="visible1 ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="visible1 = !visible1" variant="outlined" hide-details="auto" required />
            </v-col>

            <v-col cols="12" class="pt-4">
              <v-text-field v-model="form.confirmPassword" label="Xác nhận mật khẩu"
                :type="visible2 ? 'text' : 'password'" prepend-inner-icon="mdi-lock-check"
                :append-inner-icon="visible2 ? 'mdi-eye-off' : 'mdi-eye'" @click:append-inner="visible2 = !visible2"
                :error="passwordError" :error-messages="passwordError ? 'Mật khẩu không khớp' : ''" variant="outlined"
                hide-details="auto" required />
            </v-col>

            <v-col cols="12" class="pt-4">
              <div class="d-flex align-center gap-2">
                <v-checkbox v-model="form.privacyPolicies" hide-details />
                <span class="text-body-2">
                  Tôi đồng ý với <strong>chính sách & điều khoản</strong>
                </span>
              </div>
            </v-col>

            <v-col cols="12" class="pt-4">
              <v-btn block color="primary" size="large" type="submit" :loading="isRegistering">
                Xác nhận đăng ký
              </v-btn>
            </v-col>

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
  otp: "",
  password: "",
  confirmPassword: "",
  privacyPolicies: false,
})

const isSendingOtp = ref(false)
const isRegistering = ref(false)
const otpSent = ref(false)
const otpMessage = ref("")

const visible1 = ref(false)
const visible2 = ref(false)

const emailError = computed(() => {
  if (form.value.email === "") return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return !emailRegex.test(form.value.email)
})

const passwordError = computed(() => {
  return (
    form.value.confirmPassword !== "" &&
    form.value.password !== form.value.confirmPassword
  )
})

const sendOtp = async () => {
  otpMessage.value = ""

  if (emailError.value || !form.value.email) {
    alert("Vui lòng nhập email hợp lệ!")
    return
  }

  try {
    isSendingOtp.value = true

    const res = await registerApi.requestOtp({
      email: form.value.email.trim(),
    })

    otpSent.value = true
    otpMessage.value = res?.data?.message || "OTP đã được gửi tới email của bạn!"
    alert(otpMessage.value)
  } catch (error) {
    console.error("Lỗi gửi OTP:", error)
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data ||
      "Gửi OTP thất bại! Vui lòng thử lại."
    otpMessage.value = errorMessage
    alert(errorMessage)
  } finally {
    isSendingOtp.value = false
  }
}

const confirmRegister = async () => {
  if (!form.value.username || form.value.username.trim().length < 3) {
    alert("Tên đăng nhập phải có ít nhất 3 ký tự!")
    return
  }

  if (emailError.value || !form.value.email) {
    alert("Email không hợp lệ!")
    return
  }

  if (!form.value.otp || form.value.otp.trim().length === 0) {
    alert("Vui lòng nhập mã OTP!")
    return
  }

  if (!form.value.password || form.value.password.length < 6) {
    alert("Mật khẩu phải có ít nhất 6 ký tự!")
    return
  }

  if (passwordError.value) {
    alert("Mật khẩu nhập lại không khớp!")
    return
  }

  if (!form.value.privacyPolicies) {
    alert("Bạn phải đồng ý chính sách & điều khoản!")
    return
  }

  try {
    isRegistering.value = true

    const res = await registerApi.confirmRegister({
      username: form.value.username.trim(),
      email: form.value.email.trim(),
      password: form.value.password,
      otp: form.value.otp.trim(),
    })

    alert(res?.data?.message || res?.data || "Đăng ký tài khoản thành công!")
    router.push("/login")
  } catch (error) {
    console.error("Lỗi đăng ký:", error)
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data ||
      "Đăng ký thất bại! Vui lòng thử lại."
    alert(errorMessage)
  } finally {
    isRegistering.value = false
  }
}
</script>

<style scoped>
.auth-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg,
      rgba(245, 222, 179, 0.1) 0%,
      rgba(238, 216, 174, 0.1) 100%);
}

:deep(.auth-card) {
  border-radius: 8px !important;
}

.otp-btn {
  min-height: 44px;
}

.otp-message {
  font-size: 14px;
  color: #8b4513;
  background: rgba(139, 69, 19, 0.08);
  border: 1px solid rgba(139, 69, 19, 0.15);
  border-radius: 8px;
  padding: 10px 12px;
}

:deep(.v-text-field__input) {
  color: #000000 !important;
}

:deep(.v-text-field--focused .v-text-field__input) {
  color: #000000 !important;
}

:deep(.v-field__input) {
  color: #000000 !important;
}

:deep(.v-label) {
  color: #333333 !important;
}

:deep(.v-field--focused .v-label) {
  color: #000000 !important;
}

:deep(.v-input__details) {
  color: #000000 !important;
}

:deep(.v-checkbox__label) {
  color: #000000 !important;
}

:deep(a) {
  color: #000000 !important;
}

:deep(a:hover) {
  color: #8b4513 !important;
}

:deep(.v-btn--color-primary) {
  background-color: #8b4513 !important;
}

:deep(.v-btn) {
  color: white !important;
}

:deep(.router-link) {
  color: #000000 !important;
}

:deep(.router-link:hover) {
  color: #8b4513 !important;
}

:deep(.text-h4) {
  color: #000000 !important;
}

:deep(.text-body-2) {
  color: #333333 !important;
}

:deep(strong) {
  color: #000000 !important;
}
</style>