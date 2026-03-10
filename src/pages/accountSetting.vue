<template>
    <VRow>
        <VCard title="Thông tin tài khoản">

            <!-- Avatar -->
            <VCardText class="d-flex">
                <VAvatar rounded="lg" size="100" class="me-6" :image="getImage(account.images)" />

                <form class="d-flex flex-column justify-center gap-5">
                    <div class="d-flex flex-wrap gap-2">
                        <VBtn color="primary" @click="refInputEl?.click()">
                            <VIcon icon="bx-cloud-upload" class="d-sm-none" />
                            <span class="d-none d-sm-block">Upload new photo</span>
                        </VBtn>

                        <input ref="refInputEl" type="file" name="file" accept=".jpeg,.png,.jpg,.gif" hidden
                            @change="changeAvatar" />

                        <VBtn type="reset" color="error" variant="tonal" @click="resetAvatar">
                            <span class="d-none d-sm-block">Reset</span>
                            <VIcon icon="bx-refresh" class="d-sm-none" />
                        </VBtn>
                    </div>

                    <p class="text-body-1 mb-0">
                        Allowed JPG, GIF or PNG. Max size of 800K
                    </p>
                </form>
            </VCardText>

            <VDivider />

            <!-- FORM -->
            <VCardText>
                <VForm class="mt-6">
                    <VRow>

                        <!-- username -->
                        <VCol md="6" cols="12">
                            <VTextField label="Username" v-model="form.username" />
                        </VCol>

                        <!-- Email -->
                        <VCol cols="12" md="6">
                            <VTextField label="Email" v-model="form.email" />
                        </VCol>

                        <!-- Phone -->
                        <VCol cols="12" md="6">
                            <VTextField label="Phone Number" v-model="form.phoneNumber" />
                        </VCol>

                        <!-- unit_number -->
                        <VCol cols="12" md="6">
                            <VTextField label="Unit Number" v-model="form.unitNumber" />
                        </VCol>

                        <!-- street_number -->
                        <VCol cols="12" md="6">
                            <VTextField label="Street Number" v-model="form.streetNumber" />
                        </VCol>

                        <!-- address_line1 -->
                        <VCol cols="12" md="6">
                            <VTextField label="Address Line 1" v-model="form.addressLine1" />
                        </VCol>

                        <!-- address_line2 -->
                        <VCol cols="12" md="6">
                            <VTextField label="Address Line 2" v-model="form.addressLine2" />
                        </VCol>

                        <!-- city -->
                        <VCol cols="12" md="6">
                            <VTextField label="City" v-model="form.city" />
                        </VCol>

                        <!-- region -->
                        <VCol cols="12" md="6">
                            <VTextField label="Region" v-model="form.region" />
                        </VCol>

                        <!-- postal_code -->
                        <VCol cols="12" md="6">
                            <VTextField label="Postal Code" v-model="form.postalCode" />
                        </VCol>

                        <!-- Save button -->
                        <VCol cols="12" class="d-flex flex-wrap gap-4">
                            <VBtn @click="saveChanges">Save changes</VBtn>
                        </VCol>

                    </VRow>
                </VForm>
            </VCardText>
        </VCard>
    </VRow>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import accountApi from '@/api/accountApi'

// ========== STATE ==========
const account = ref({})
const address = ref({})

// Form dùng chung cho Account + Address
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

// ========== LOAD DATA ==========
const loadAccount = async () => {
    const res = await accountApi.getById(2) // API trả về account + address

    account.value = res.data.account
    address.value = res.data.address

    form.value = {
        accountId: account.value.accountID,
        username: account.value.username,
        email: account.value.email,
        phoneNumber: account.value.phoneNumber,
        images: account.value.images,

        unitNumber: address.value.unitNumber,
        streetNumber: address.value.streetNumber,
        addressLine1: address.value.addressLine1,
        addressLine2: address.value.addressLine2,
        city: address.value.city,
        region: address.value.region,
        postalCode: address.value.postalCode
    }
}

// ========== SAVE ==========
const saveChanges = async () => {
    try {
        await accountApi.updateAccountFull(form.value)
        alert("Cập nhật thành công!")
    } catch (err) {
        console.error(err)
        alert("Lỗi khi cập nhật!")
    }
}

// ========== AVATAR ==========
const getImage = (img) => {
    if (!img) {
        return '/images/default.jpg'
    }
    return img
}

const refInputEl = ref(null)

const changeAvatar = (event) => {
    const file = event.target.files[0]

    if (!file) return

    const reader = new FileReader()

    reader.onload = () => {
        form.value.images = reader.result
        console.log("BASE64:", form.value.images)
    }

    reader.readAsDataURL(file)
}

const resetAvatar = () => {
    form.value.images = account.value.images // trả lại ảnh ban đầu
}

onMounted(loadAccount)
</script>