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
                                <span class="d-none d-sm-block">Tải ảnh mới</span>
                            </VBtn>

                            <input ref="refInputEl" type="file" name="file" accept=".jpeg,.png,.jpg,.gif" hidden
                                @change="changeAvatar" />

                            <VBtn type="button" color="error" variant="tonal" @click="resetAvatar">
                                <span class="d-none d-sm-block">Làm mới</span>
                                <VIcon icon="bx-refresh" class="d-sm-none" />
                            </VBtn>
                        </div>

                        <p class="text-body-1 mb-0">
                            Chỉ chấp nhận JPG, GIF hoặc PNG. Kích thước tối đa 800KB.
                        </p>
                    </div>
                </VCardText>

                <VDivider />

                <VCardText>
                    <VForm class="mt-6" @submit.prevent="saveChanges">
                        <VRow>
                            <VCol md="6" cols="12">
                                <VTextField label="Tên đăng nhập" v-model="form.username" />
                            </VCol>

                            <!-- Chỉ hiển thị email, không cho sửa -->
                            <VCol cols="12" md="6">
                                <VTextField label="Email" :model-value="displayEmail" readonly disabled />
                            </VCol>

                            <VCol cols="12" md="6">
                                <VTextField label="Số điện thoại" v-model="form.phoneNumber" />
                            </VCol>

                            <VCol cols="12" md="6">
                                <VTextField label="Số căn / số nhà" v-model="form.unitNumber" />
                            </VCol>

                            <VCol cols="12" md="6">
                                <VTextField label="Số đường" v-model="form.streetNumber" />
                            </VCol>

                            <VCol cols="12" md="6">
                                <VTextField label="Tên đường" v-model="form.addressLine1" />
                            </VCol>

                            <VCol cols="12" md="4">
                                <VSelect
                                    v-model="form.provinceId"
                                    :items="ghnProvinces"
                                    item-title="provinceName"
                                    item-value="provinceId"
                                    label="Tỉnh / Thành phố"
                                    :loading="isLoadingProvinces"
                                    :disabled="isLoadingProvinces"
                                    variant="outlined"
                                    @update:model-value="onProvinceChange"
                                />
                            </VCol>

                            <VCol cols="12" md="4">
                                <VSelect
                                    v-model="form.districtId"
                                    :items="ghnDistricts"
                                    item-title="districtName"
                                    item-value="districtId"
                                    label="Quận / Huyện"
                                    :loading="isLoadingDistricts"
                                    :disabled="!form.provinceId || isLoadingDistricts"
                                    variant="outlined"
                                    @update:model-value="onDistrictChange"
                                />
                            </VCol>

                            <VCol cols="12" md="4">
                                <VSelect
                                    v-model="form.wardCode"
                                    :items="ghnWards"
                                    item-title="wardName"
                                    item-value="wardCode"
                                    label="Phường / Xã"
                                    :loading="isLoadingWards"
                                    :disabled="!form.districtId || isLoadingWards"
                                    variant="outlined"
                                    @update:model-value="onWardChange"
                                />
                            </VCol>

                            <VCol cols="12" md="6">
                                <VTextField label="Mã bưu chính / Ghi chú khu vực(Không bắt buộc)" v-model="form.postalCode" />
                            </VCol>

                            

                            <VCol cols="12" class="d-flex flex-wrap gap-4">
                                <VBtn color="primary" type="submit" prepend-icon="bx-check">
                                    Lưu thay đổi
                                </VBtn>
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
import paymentApi from '@/api/paymentApi'

const router = useRouter()

const account = ref({})
const address = ref({})
const refInputEl = ref(null)
const displayEmail = ref('')
const isLoadingProvinces = ref(false)
const isLoadingDistricts = ref(false)
const isLoadingWards = ref(false)
const ghnProvinces = ref([])
const ghnDistricts = ref([])
const ghnWards = ref([])

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
    postalCode: '',
    provinceId: null,
    districtId: null,
    wardCode: ''
})

const normalizeText = value => String(value || '').trim().toLowerCase()

const loadGhnProvinces = async () => {
    isLoadingProvinces.value = true
    try {
        const res = await paymentApi.getGhnProvinces()
        ghnProvinces.value = Array.isArray(res.data) ? res.data : []
    } catch (error) {
        console.error('Lỗi load tỉnh GHN:', error)
        ghnProvinces.value = []
    } finally {
        isLoadingProvinces.value = false
    }
}

const onProvinceChange = async () => {
    form.value.districtId = null
    form.value.wardCode = ''
    ghnDistricts.value = []
    ghnWards.value = []

    const provinceId = Number.parseInt(form.value.provinceId, 10)
    if (!Number.isFinite(provinceId) || provinceId <= 0) return

    isLoadingDistricts.value = true
    try {
        const res = await paymentApi.getGhnDistricts(provinceId)
        ghnDistricts.value = Array.isArray(res.data) ? res.data : []
    } catch (error) {
        console.error('Lỗi load quận GHN:', error)
        ghnDistricts.value = []
    } finally {
        isLoadingDistricts.value = false
    }
}

const onDistrictChange = async () => {
    form.value.wardCode = ''
    form.value.addressLine2 = ''
    ghnWards.value = []

    const districtId = Number.parseInt(form.value.districtId, 10)
    if (!Number.isFinite(districtId) || districtId <= 0) return

    isLoadingWards.value = true
    try {
        const res = await paymentApi.getGhnWards(districtId)
        ghnWards.value = Array.isArray(res.data) ? res.data : []
    } catch (error) {
        console.error('Lỗi load phường GHN:', error)
        ghnWards.value = []
    } finally {
        isLoadingWards.value = false
    }
}

const onWardChange = () => {
    const wardName = ghnWards.value.find(item => item.wardCode === form.value.wardCode)?.wardName || ''
    form.value.addressLine2 = wardName
}

const applyExistingAddressSelection = async () => {
    const provinceName = normalizeText(form.value.city)
    const districtName = normalizeText(form.value.region)
    const wardValue = normalizeText(form.value.addressLine2)

    if (!provinceName || ghnProvinces.value.length === 0) return

    const matchedProvince = ghnProvinces.value.find(item => normalizeText(item.provinceName) === provinceName)
    if (!matchedProvince) return

    form.value.provinceId = matchedProvince.provinceId
    await onProvinceChange()

    if (!districtName || ghnDistricts.value.length === 0) return

    const matchedDistrict = ghnDistricts.value.find(item => normalizeText(item.districtName) === districtName)
    if (!matchedDistrict) return

    form.value.districtId = matchedDistrict.districtId
    await onDistrictChange()

    if (!wardValue || ghnWards.value.length === 0) return

    const matchedWard = ghnWards.value.find(item => normalizeText(item.wardCode) === wardValue || normalizeText(item.wardName) === wardValue)
    if (matchedWard) {
        form.value.wardCode = matchedWard.wardCode
        form.value.addressLine2 = matchedWard.wardName
    }
}

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
            postalCode: addressData.postalCode || addressData.postal_code || '',
            provinceId: null,
            districtId: null,
            wardCode: ''
        }

        displayEmail.value = accountData.email || storedEmail || ''
        await applyExistingAddressSelection()
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

        const payload = {
            ...form.value,
            city: ghnProvinces.value.find(item => item.provinceId === form.value.provinceId)?.provinceName || form.value.city,
            region: ghnDistricts.value.find(item => item.districtId === form.value.districtId)?.districtName || form.value.region,
            addressLine2: ghnWards.value.find(item => item.wardCode === form.value.wardCode)?.wardName || form.value.addressLine2,
            postalCode: form.value.postalCode,
        }

        console.log("Payload gửi lên:", payload)

        await accountApi.updateAccountFull(payload)

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

onMounted(async () => {
    await loadGhnProvinces()
    await loadAccount()
})
</script>