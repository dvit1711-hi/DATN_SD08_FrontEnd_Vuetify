<template>
    <div class="auth-wrapper d-flex align-center justify-center pa-4">
        <v-card class="auth-card rounded-lg" max-width="460" :class="$vuetify.display.smAndUp ? 'pa-8' : 'pa-6'"
            elevation="0" border>
            <v-card-item class="justify-center pb-2">
                <div class="text-center">
                    <h1 class="text-h4 font-weight-bold mb-2">Quên mật khẩu</h1>
                    <p class="text-body-2 text-grey">
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
                                hide-details="auto" required />
                        </v-col>

                        <v-col cols="12" class="pt-1">
                            <v-btn class="otp-btn" block color="primary" variant="flat" size="large"
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
                                required />
                        </v-col>

                        <v-col cols="12" class="pt-4" v-if="otpSent">
                            <v-text-field v-model="form.newPassword" label="Mật khẩu mới"
                                :type="visible1 ? 'text' : 'password'" prepend-inner-icon="mdi-lock"
                                :append-inner-icon="visible1 ? 'mdi-eye-off' : 'mdi-eye'"
                                @click:append-inner="visible1 = !visible1" variant="outlined" hide-details="auto"
                                required />
                        </v-col>

                        <v-col cols="12" class="pt-4" v-if="otpSent">
                            <v-text-field v-model="form.confirmPassword" label="Nhập lại mật khẩu"
                                :type="visible2 ? 'text' : 'password'" prepend-inner-icon="mdi-lock-check"
                                :append-inner-icon="visible2 ? 'mdi-eye-off' : 'mdi-eye'"
                                @click:append-inner="visible2 = !visible2" :error="!!passwordError"
                                :error-messages="passwordError ? passwordError : ''" variant="outlined"
                                hide-details="auto" required />
                        </v-col>

                        <v-col cols="12" class="pt-4" v-if="otpSent">
                            <v-btn block color="primary" size="large" type="submit" :loading="resettingPassword"
                                :disabled="!canSubmitReset">
                                Đổi mật khẩu
                            </v-btn>
                        </v-col>

                        <v-col cols="12" class="text-center mt-2">
                            <span class="text-body-2">Bạn đã nhớ mật khẩu?</span>
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
</style>