<template>
    <VRow>
        <VCol cols="12">
            <VCard title="Thông tin tài khoản">
                <!-- Avatar -->
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

                <!-- FORM -->
                <VCardText>
                    <VForm class="mt-6" @submit.prevent="saveChanges">
                        <VRow>
                            <VCol md="6" cols="12">
                                <VTextField label="Username" v-model="form.username" />
                            </VCol>

                            <VCol cols="12" md="6">
                                <VTextField label="Email" v-model="form.email" />
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

const form = ref({
    accountId: null,
    username: '',
    email: '',
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
        const accountId = localStorage.getItem('accountId')

        if (!accountId) {
            alert('Bạn chưa đăng nhập!')
            router.push('/login')
            return
        }

        const res = await accountApi.getById(accountId)

        account.value = res.data.account || {}
        address.value = res.data.address || {}

        form.value = {
            accountId: account.value.id || null,
            username: account.value.username || '',
            email: account.value.email || '',
            images: account.value.images || '',
            phoneNumber: account.value.phoneNumber || '',
            unitNumber: address.value.unitNumber || '',
            streetNumber: address.value.streetNumber || '',
            addressLine1: address.value.addressLine1 || '',
            addressLine2: address.value.addressLine2 || '',
            city: address.value.city || '',
            region: address.value.region || '',
            postalCode: address.value.postalCode || ''
        }
    } catch (err) {
        console.error('Lỗi load account:', err)
        alert('Không tải được thông tin tài khoản!')
    }
}

const saveChanges = async () => {
    try {
        await accountApi.updateAccountFull(form.value)

        account.value = {
            ...account.value,
            username: form.value.username,
            email: form.value.email,
            images: form.value.images,
            phoneNumber: form.value.phoneNumber
        }

        address.value = {
            ...address.value,
            unitNumber: form.value.unitNumber,
            streetNumber: form.value.streetNumber,
            addressLine1: form.value.addressLine1,
            addressLine2: form.value.addressLine2,
            city: form.value.city,
            region: form.value.region,
            postalCode: form.value.postalCode
        }

        alert('Cập nhật thành công!')
    } catch (err) {
        console.error('Lỗi update:', err)
        alert('Lỗi khi cập nhật!')
    }
}

const getImage = img => {
    if (!img) return '/images/default.jpg'
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