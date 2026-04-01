<template>
    <VRow>
        <VCol cols="12">
            <VCard title="Thông tin tài khoản">
                <VCardText class="d-flex">
                    <VAvatar rounded="lg" size="100" class="me-6" :image="getImage(form.images || account.images)" />

                    <div class="d-flex flex-column justify-center gap-5">
                        <div class="d-flex flex-wrap gap-2">
                            <VBtn color="primary" type="button" @click="refInputEl?.click()">
                                <VIcon icon="bx-cloud-upload" class="d-sm-none" />
                                <span class="d-none d-sm-block">Upload new photo</span>
                            </VBtn>

                            <input ref="refInputEl" type="file" name="file" accept=".jpeg,.png,.jpg,.gif" hidden
                                @change="changeAvatar" />

                            <VBtn type="button" color="error" variant="tonal" @click="resetAvatar">
                                <span class="d-none d-sm-block">Reset</span>
                                <VIcon icon="bx-refresh" class="d-sm-none" />
                            </VBtn>
                        </div>

                        <p class="text-body-1 mb-0">
                            Allowed JPG, GIF or PNG. Max size of 800K
                        </p>
                    </div>
                </VCardText>

                <VDivider />

                <VCardText>
                    <VForm class="mt-6" @submit.prevent="saveChanges">
                        <VRow>
                            <VCol md="6" cols="12">
                                <VTextField label="Username" v-model="form.username" />
                            </VCol>

                            <!-- Chỉ hiển thị email, không cho sửa -->
                            <VCol cols="12" md="6">
                                <VTextField label="Email" :model-value="displayEmail" readonly disabled />
                            </VCol>

                            <VCol cols="12" md="6">
                                <VTextField label="Phone Number" v-model="form.phoneNumber" />
                            </VCol>

                            <VCol cols="12" md="6">
                                <VTextField label="Unit Number" v-model="form.unitNumber" />
                            </VCol>

                            <VCol cols="12" md="6">
                                <VTextField label="Street Number" v-model="form.streetNumber" />
                            </VCol>

                            <VCol cols="12" md="6">
                                <VTextField label="Address Line 1" v-model="form.addressLine1" />
                            </VCol>

                            <VCol cols="12" md="6">
                                <VTextField label="Address Line 2" v-model="form.addressLine2" />
                            </VCol>

                            <VCol cols="12" md="6">
                                <VTextField label="City" v-model="form.city" />
                            </VCol>

                            <VCol cols="12" md="6">
                                <VTextField label="Region" v-model="form.region" />
                            </VCol>

                            <VCol cols="12" md="6">
                                <VTextField label="Postal Code" v-model="form.postalCode" />
                            </VCol>

                            <VCol cols="12" class="d-flex flex-wrap gap-4">
                                <VBtn color="primary" type="submit">Save changes</VBtn>
                            </VCol>
                        </VRow>
                    </VForm>
                </VCardText>
            </VCard>
        </VCol>
    </VRow>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import accountApi from '@/api/accountApi'

const router = useRouter()

const account = ref({})
const address = ref({})
const refInputEl = ref(null)
const displayEmail = ref('')

const form = ref({
    accountId: null,
    username: '',
    images: '',
    phoneNumber: '',
    unitNumber: '',
    streetNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    region: '',
    postalCode: ''
})

const loadAccount = async () => {
    try {
        const storedAccountId = localStorage.getItem('accountId')

        if (!storedAccountId) {
            alert('Bạn chưa đăng nhập!')
            router.push('/login')
            return
        }

        const res = await accountApi.getById(storedAccountId)

        const accountData = res.data?.account || res.data || {}
        const addressData = res.data?.address || {}

        account.value = accountData
        address.value = addressData

        console.log("account response:", res.data)
        console.log("addressData:", addressData)

        const storedUsername = localStorage.getItem('username') || ''
        const storedEmail = localStorage.getItem('email') || ''

        form.value = {
            accountId: accountData.accountId || accountData.id || Number(storedAccountId),
            username: accountData.username || storedUsername || '',
            images: accountData.images || '',
            phoneNumber: accountData.phoneNumber || '',

            unitNumber: addressData.unitNumber || addressData.unit_number || '',
            streetNumber: addressData.streetNumber || addressData.street_number || '',
            addressLine1: addressData.addressLine1 || addressData.address_line1 || '',
            addressLine2: addressData.addressLine2 || addressData.address_line2 || '',
            city: addressData.city || '',
            region: addressData.region || '',
            postalCode: addressData.postalCode || addressData.postal_code || ''
        }

        displayEmail.value = accountData.email || storedEmail || ''
    } catch (err) {
        console.error('Lỗi load account:', err)
        alert('Không tải được thông tin tài khoản!')
    }
}

const saveChanges = async () => {
    try {
        if (!form.value.accountId) {
            alert("Không tìm thấy accountId")
            return
        }

        console.log("Payload gửi lên:", form.value)

        await accountApi.updateAccountFull(form.value)

        localStorage.setItem("username", form.value.username || "")
        window.dispatchEvent(new Event("auth-changed"))

        await loadAccount()

        alert("Cập nhật thành công!")
    } catch (err) {
        console.error("Lỗi update:", err)

        if (err.response?.status === 401 || err.response?.status === 403) {
            alert("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!")
            localStorage.removeItem("token")
            localStorage.removeItem("accountId")
            localStorage.removeItem("username")
            localStorage.removeItem("email")
            router.push("/login")
            return
        }

        alert(err.response?.data?.message || "Lỗi khi cập nhật!")
    }
}

const getImage = img => {
    if (!img) return '/images/default.jpg'

    if (typeof img === 'string') {
        if (img.startsWith('data:image') || img.startsWith('http')) return img
        if (img.startsWith('/')) return `http://localhost:8080${img}`
    }

    return img
}

const changeAvatar = event => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
        alert('Chỉ chấp nhận file JPG, JPEG, PNG hoặc GIF!')
        return
    }

    const maxSize = 800 * 1024
    if (file.size > maxSize) {
        alert('Ảnh vượt quá 800KB!')
        return
    }

    const reader = new FileReader()
    reader.onload = () => {
        form.value.images = reader.result
    }
    reader.readAsDataURL(file)
}

const resetAvatar = () => {
    form.value.images = account.value.images || ''
    if (refInputEl.value) {
        refInputEl.value.value = ''
    }
}

onMounted(loadAccount)
</script>