<template>
    <v-container fluid class="pa-6">
        <v-card elevation="3" rounded="lg">
            <v-card-title class="text-h5 font-weight-bold">
                Thêm tài khoản Staff
            </v-card-title>

            <v-divider />

            <v-card-text class="pt-6">
                <v-form ref="formRef" v-model="valid">
                    <v-row>
                        <v-col cols="12" md="6">
                            <v-text-field v-model="form.username" label="Tên đăng nhập" variant="outlined"
                                prepend-inner-icon="mdi-account" :rules="[rules.required, rules.username]" />
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-text-field v-model="form.email" label="Email" variant="outlined"
                                prepend-inner-icon="mdi-email" :rules="[rules.required, rules.email]" />
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-text-field v-model="form.phoneNumber" label="Số điện thoại" variant="outlined"
                                prepend-inner-icon="mdi-phone" :rules="[rules.required, rules.phone]" />
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-select v-model="form.statusID" label="Trạng thái" variant="outlined"
                                prepend-inner-icon="mdi-shield-check" :items="statusOptions" item-title="title"
                                item-value="value" :rules="[rules.required]" :loading="loadingStatuses" />
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-text-field v-model="form.password" label="Mật khẩu" variant="outlined"
                                prepend-inner-icon="mdi-lock" :type="showPassword ? 'text' : 'password'"
                                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                                @click:append-inner="showPassword = !showPassword"
                                :rules="[rules.required, rules.password]" />
                        </v-col>

                        <v-col cols="12" md="6">
                            <v-text-field v-model="form.confirmPassword" label="Xác nhận mật khẩu" variant="outlined"
                                prepend-inner-icon="mdi-lock-check" :type="showConfirmPassword ? 'text' : 'password'"
                                :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                                @click:append-inner="showConfirmPassword = !showConfirmPassword"
                                :rules="[rules.required, rules.confirmPassword]" />
                        </v-col>

                        <v-col cols="12">
                            <v-text-field v-model="form.images" label="Ảnh đại diện (URL)" variant="outlined"
                                prepend-inner-icon="mdi-image" />
                        </v-col>
                    </v-row>
                </v-form>
            </v-card-text>

            <v-divider />

            <v-card-actions class="pa-4 justify-end">
                <v-btn variant="outlined" color="grey-darken-1" @click="goBack">
                    Quay lại
                </v-btn>

                <v-btn color="primary" :loading="loading" @click="handleSubmit">
                    Tạo tài khoản Staff
                </v-btn>
            </v-card-actions>
        </v-card>

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="2500">
            {{ snackbar.text }}
        </v-snackbar>
    </v-container>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue"
import { useRouter } from "vue-router"
import accountApi from "@/api/accountApi"

const router = useRouter()
const formRef = ref(null)
const valid = ref(false)
const loading = ref(false)
const loadingStatuses = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const statusOptions = ref([])

const form = reactive({
    username: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    images: "",
    statusID: null,
})

const snackbar = reactive({
    show: false,
    text: "",
    color: "success",
})

const rules = {
    required: v => !!v || "Trường này không được để trống",
    username: v => (v && v.trim().length >= 3) || "Tên đăng nhập tối thiểu 3 ký tự",
    email: v => /.+@.+\..+/.test(v || "") || "Email không hợp lệ",
    phone: v => /^[0-9]{9,11}$/.test(v || "") || "Số điện thoại không hợp lệ",
    password: v => (v && v.length >= 6) || "Mật khẩu tối thiểu 6 ký tự",
    confirmPassword: v => v === form.password || "Mật khẩu xác nhận không khớp",
}

const showMessage = (text, color = "success") => {
    snackbar.text = text
    snackbar.color = color
    snackbar.show = true
}

const loadStatuses = async () => {
    loadingStatuses.value = true
    try {
        const res = await accountApi.getStaffStatuses()
        statusOptions.value = res.data || []
        if (statusOptions.value.length > 0 && !form.statusID) {
            form.statusID = statusOptions.value[0].value
        }
    } catch (error) {
        showMessage("Không tải được danh sách trạng thái", "error")
    } finally {
        loadingStatuses.value = false
    }
}

const resetForm = () => {
    form.username = ""
    form.email = ""
    form.phoneNumber = ""
    form.password = ""
    form.confirmPassword = ""
    form.images = ""
    form.statusID = statusOptions.value.length > 0 ? statusOptions.value[0].value : null
}

const handleSubmit = async () => {
    const result = await formRef.value.validate()
    if (!result.valid) return

    loading.value = true
    try {
        const payload = {
            username: form.username.trim(),
            email: form.email.trim(),
            phoneNumber: form.phoneNumber.trim(),
            password: form.password,
            images: form.images?.trim() || null,
            statusID: form.statusID,
        }

        await accountApi.createStaffAccount(payload)
        showMessage("Tạo tài khoản staff thành công", "success")

        setTimeout(() => {
            router.push({ name: "AdminAccounts" })
        }, 700)
    } catch (error) {
        const message =
            error?.response?.data?.message ||
            error?.response?.data ||
            "Tạo tài khoản staff thất bại"
        showMessage(message, "error")
    } finally {
        loading.value = false
    }
}

const goBack = () => {
    router.push({ name: "AdminAccounts" })
}

onMounted(() => {
    loadStatuses()
})
</script>