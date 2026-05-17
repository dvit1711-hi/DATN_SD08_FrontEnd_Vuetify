<template>
    <div class="auth-wrapper d-flex align-center justify-start pa-4">
        <v-card class="auth-card rounded-xl" max-width="420" :class="$vuetify.display.smAndUp ? 'pa-8' : 'pa-6'"
            elevation="0">
            <v-card-item class="justify-center pb-2">
                <div class="text-center">
                    <h1 class="text-h4 font-weight-bold mb-2 card-title">Quên mật khẩu</h1>
                    <p class="text-body-2 card-subtitle">
                        Nhập email để nhận mã OTP và đặt lại mật khẩu
                    </p>
                </div>
            </v-card-item>

            <v-card-text>
                <v-form @submit.prevent="resetPassword">
                    <v-row>
                        <v-col cols="12">
                            <v-text-field v-model="form.email" label="Email" type="email"
                                placeholder="email@example.com" prepend-inner-icon="mdi-email" variant="outlined"
                                :error="emailError" :error-messages="emailError ? 'Email không hợp lệ' : ''"
                                hide-details="auto" class="glass-field" required />
                        </v-col>

                        <v-col cols="12" class="pt-4">
                            <v-btn class="submit-btn" block variant="flat" size="large"
                                :loading="sendingOtp" :disabled="!form.email || !!emailError" @click="sendOtp">
                                {{ otpSent ? "Gửi lại mã OTP" : "Gửi mã OTP" }}
                            </v-btn>
                        </v-col>

                        <v-col cols="12" class="pt-0" v-if="message">
                            <div class="success-box">
                                {{ message }}
                            </div>
                        </v-col>

                        <v-col cols="12" class="pt-0" v-if="error">
                            <div class="error-box">
                                {{ error }}
                            </div>
                        </v-col>

                        <v-col cols="12" class="pt-4" v-if="otpSent">
                            <v-text-field v-model="form.otp" label="Mã OTP" placeholder="Nhập mã OTP đã gửi về email"
                                prepend-inner-icon="mdi-shield-key" variant="outlined" maxlength="6" hide-details="auto"
                                class="glass-field" required />
                        </v-col>

                        <v-col cols="12" class="pt-4" v-if="otpSent">
                            <v-text-field v-model="form.newPassword" label="Mật khẩu mới"
                                :type="visible1 ? 'text' : 'password'" prepend-inner-icon="mdi-lock"
                                :append-inner-icon="visible1 ? 'mdi-eye-off' : 'mdi-eye'"
                                @click:append-inner="visible1 = !visible1" variant="outlined" hide-details="auto"
                                class="glass-field" required />
                        </v-col>

                        <v-col cols="12" class="pt-4" v-if="otpSent">
                            <v-text-field v-model="form.confirmPassword" label="Nhập lại mật khẩu"
                                :type="visible2 ? 'text' : 'password'" prepend-inner-icon="mdi-lock-check"
                                :append-inner-icon="visible2 ? 'mdi-eye-off' : 'mdi-eye'"
                                @click:append-inner="visible2 = !visible2" :error="!!passwordError"
                                :error-messages="passwordError ? passwordError : ''" variant="outlined"
                                hide-details="auto" class="glass-field" required />
                        </v-col>

                        <v-col cols="12" class="pt-4" v-if="otpSent">
                            <v-btn block size="large" type="submit" :loading="resettingPassword"
                                :disabled="!canSubmitReset" class="submit-btn">
                                Đổi mật khẩu
                            </v-btn>
                        </v-col>

                        <v-col cols="12" class="text-center mt-4">
                            <span class="card-subtitle text-body-2">Bạn đã nhớ mật khẩu?</span>
                            <router-link to="/login" class="forgot-link ms-1">
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
import { computed, reactive, ref } from "vue"
import { useRouter } from "vue-router"
import axios from "axios"

const router = useRouter()
const API_BASE = "http://localhost:8080"

const form = reactive({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
})

const sendingOtp = ref(false)
const resettingPassword = ref(false)
const otpSent = ref(false)
const message = ref("")
const error = ref("")
const visible1 = ref(false)
const visible2 = ref(false)

const emailError = computed(() => {
    if (!form.email) return false
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return !emailRegex.test(form.email)
})

const passwordError = computed(() => {
    if (!form.confirmPassword) return ""

    if (form.newPassword.length > 0 && form.newPassword.length < 6) {
        return "Mật khẩu phải có ít nhất 6 ký tự"
    }

    if (form.newPassword !== form.confirmPassword) {
        return "Mật khẩu nhập lại không khớp"
    }

    return ""
})

const canSubmitReset = computed(() => {
    return (
        form.email.trim() &&
        form.otp.trim() &&
        form.newPassword.trim() &&
        form.confirmPassword.trim() &&
        !emailError.value &&
        !passwordError.value
    )
})

const clearNotice = () => {
    message.value = ""
    error.value = ""
}

const sendOtp = async () => {
    clearNotice()

    if (!form.email.trim()) {
        error.value = "Vui lòng nhập email"
        return
    }

    if (emailError.value) {
        error.value = "Email không hợp lệ"
        return
    }

    try {
        sendingOtp.value = true

        const res = await axios.post(
            `${API_BASE}/auth/forgot-password/send-otp`,
            { email: form.email.trim() },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        )

        otpSent.value = true
        message.value = res.data?.message || "Đã gửi OTP về email"
    } catch (err) {
        error.value =
            err.response?.data?.message ||
            err.response?.data ||
            "Gửi OTP thất bại"
    } finally {
        sendingOtp.value = false
    }
}

const resetPassword = async () => {
    clearNotice()

    if (!canSubmitReset.value) {
        error.value = "Vui lòng nhập đầy đủ và đúng thông tin"
        return
    }

    try {
        resettingPassword.value = true

        const res = await axios.post(
            `${API_BASE}/auth/forgot-password/reset`,
            {
                email: form.email.trim(),
                otp: form.otp.trim(),
                newPassword: form.newPassword,
                confirmPassword: form.confirmPassword,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        )

        message.value = res.data?.message || "Đổi mật khẩu thành công"

        setTimeout(() => {
            router.push("/login")
        }, 1500)
    } catch (err) {
        error.value =
            err.response?.data?.message ||
            err.response?.data ||
            "Đổi mật khẩu thất bại"
    } finally {
        resettingPassword.value = false
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

/* Submit button */
.submit-btn {
  background: rgba(255, 255, 255, 0.9) !important;
  color: #1a1a2e !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px;
  border-radius: 10px !important;
  transition: all 0.25s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.submit-btn:hover {
  background: #ffffff !important;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  transform: translateY(-1px);
}

/* Success/Error boxes */
.success-box,
.error-box {
  font-size: 14px;
  border-radius: 8px;
  padding: 10px 12px;
}

.success-box {
  color: #8b4513;
  background: rgba(139, 69, 19, 0.08);
  border: 1px solid rgba(139, 69, 19, 0.15);
}

.error-box {
  color: #b42318;
  background: rgba(180, 35, 24, 0.08);
  border: 1px solid rgba(180, 35, 24, 0.15);
}

/* Links */
.forgot-link {
  color: #ffffff !important;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: opacity 0.2s;
}

.forgot-link:hover {
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