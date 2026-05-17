<template>
  <div class="auth-wrapper d-flex align-center justify-start pa-4">
    <v-card class="auth-card rounded-xl" max-width="420" :class="$vuetify.display.smAndUp ? 'pa-8' : 'pa-6'"
      elevation="0">
      <v-card-item class="justify-center pb-2">
        <div class="text-center">
          <h1 class="text-h4 font-weight-bold mb-2 card-title">Đăng ký</h1>
          <p class="text-body-2 card-subtitle">Tạo tài khoản để tiếp tục</p>
        </div>
      </v-card-item>

      <v-card-text>
        <v-form @submit.prevent="confirmRegister">
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="form.username" label="Tên đăng nhập" placeholder="your_username"
                prepend-inner-icon="mdi-account" variant="outlined" hide-details="auto" required
                class="glass-field" />
            </v-col>

            <v-col cols="12" class="pt-4">
              <v-text-field v-model="form.email" label="Email" type="email" placeholder="email@example.com"
                prepend-inner-icon="mdi-email" variant="outlined" :error="emailError"
                :error-messages="emailError ? 'Email không hợp lệ' : ''" hide-details="auto" required
                class="glass-field" />
            </v-col>

            <v-col cols="12" class="pt-2">
              <v-btn class="otp-btn" block variant="outlined" size="large" :loading="isSendingOtp"
                :disabled="!form.email || !!emailError" @click="sendOtp">
                {{ otpSent ? "Gửi lại mã OTP" : "Gửi mã OTP" }}
              </v-btn>
            </v-col>

            <v-col cols="12" class="pt-0" v-if="otpMessage">
              <div class="otp-message">{{ otpMessage }}</div>
            </v-col>

            <v-col cols="12" class="pt-3">
              <v-text-field v-model="form.otp" label="Mã OTP" placeholder="Nhập mã OTP đã gửi về email"
                prepend-inner-icon="mdi-shield-key" variant="outlined" hide-details="auto" required
                class="glass-field" />
            </v-col>

            <v-col cols="12" class="pt-4">
              <v-text-field v-model="form.password" label="Mật khẩu" :type="visible1 ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock" :append-inner-icon="visible1 ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="visible1 = !visible1" variant="outlined" hide-details="auto" required
                class="glass-field" />
            </v-col>

            <v-col cols="12" class="pt-4">
              <v-text-field v-model="form.confirmPassword" label="Xác nhận mật khẩu"
                :type="visible2 ? 'text' : 'password'" prepend-inner-icon="mdi-lock-check"
                :append-inner-icon="visible2 ? 'mdi-eye-off' : 'mdi-eye'" @click:append-inner="visible2 = !visible2"
                :error="passwordError" :error-messages="passwordError ? 'Mật khẩu không khớp' : ''" variant="outlined"
                hide-details="auto" required class="glass-field" />
            </v-col>

            <v-col cols="12" class="pt-3">
              <div class="d-flex align-center gap-2">
                <v-checkbox v-model="form.privacyPolicies" hide-details class="glass-checkbox" />
                <span class="text-body-2 card-subtitle">
                  Tôi đồng ý với <strong class="text-white">chính sách & điều khoản</strong>
                </span>
              </div>
            </v-col>

            <v-col cols="12" class="pt-3">
              <v-btn block size="large" type="submit" :loading="isRegistering" class="register-btn">
                Xác nhận đăng ký
              </v-btn>
            </v-col>

            <v-col cols="12" class="text-center mt-2">
              <span class="card-subtitle text-body-2">Bạn đã có tài khoản?</span>
              <router-link to="/login" class="login-link ms-1">Đăng nhập</router-link>
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
  return form.value.confirmPassword !== "" && form.value.password !== form.value.confirmPassword
})

const sendOtp = async () => {
  otpMessage.value = ""
  if (emailError.value || !form.value.email) { alert("Vui lòng nhập email hợp lệ!"); return }
  try {
    isSendingOtp.value = true
    const res = await registerApi.requestOtp(form.value.email.trim())
    otpSent.value = true
    otpMessage.value = res?.data?.message || "OTP đã được gửi tới email của bạn!"
    alert(otpMessage.value)
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.response?.data || "Gửi OTP thất bại! Vui lòng thử lại."
    otpMessage.value = errorMessage
    alert(errorMessage)
  } finally {
    isSendingOtp.value = false
  }
}

const confirmRegister = async () => {
  if (!form.value.username || form.value.username.trim().length < 3) { alert("Tên đăng nhập phải có ít nhất 3 ký tự!"); return }
  if (emailError.value || !form.value.email) { alert("Email không hợp lệ!"); return }
  if (!form.value.otp || form.value.otp.trim().length === 0) { alert("Vui lòng nhập mã OTP!"); return }
  if (!form.value.password || form.value.password.length < 6) { alert("Mật khẩu phải có ít nhất 6 ký tự!"); return }
  if (passwordError.value) { alert("Mật khẩu nhập lại không khớp!"); return }
  if (!form.value.privacyPolicies) { alert("Bạn phải đồng ý chính sách & điều khoản!"); return }
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
    const errorMessage = error.response?.data?.message || error.response?.data || "Đăng ký thất bại! Vui lòng thử lại."
    alert(errorMessage)
  } finally {
    isRegistering.value = false
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

.text-white {
  color: #ffffff !important;
}

/* Glass input fields */
:deep(.glass-field .v-field) {
  background: rgba(255, 255, 255, 0.15) !important;
  border-radius: 10px !important;
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

/* OTP button */
.otp-btn {
  border-color: rgba(255, 255, 255, 0.5) !important;
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.1) !important;
  border-radius: 10px !important;
  backdrop-filter: blur(4px);
  transition: all 0.25s ease;
}

.otp-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  border-color: rgba(255, 255, 255, 0.8) !important;
}

/* OTP message */
.otp-message {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 10px 12px;
}

/* Checkbox */
:deep(.glass-checkbox .v-label) {
  color: rgba(255, 255, 255, 0.85) !important;
}

:deep(.glass-checkbox .v-checkbox-btn) {
  color: rgba(255, 255, 255, 0.7) !important;
}

/* Register button */
.register-btn {
  background: rgba(255, 255, 255, 0.9) !important;
  color: #1a1a2e !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px;
  border-radius: 10px !important;
  transition: all 0.25s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.register-btn:hover {
  background: #ffffff !important;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  transform: translateY(-1px);
}

/* Links */
.login-link {
  color: #ffffff !important;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: opacity 0.2s;
}

.login-link:hover {
  opacity: 0.8;
  text-decoration: underline;
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