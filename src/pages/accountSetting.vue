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
                            <!-- Tên đăng nhập -->
                            <VCol md="6" cols="12">
                                <VTextField label="Tên đăng nhập" v-model="form.username"
                                    :error-messages="errors.username" @blur="validateField('username')"
                                    @input="clearError('username')" counter="50" maxlength="50" />
                            </VCol>

                            <!-- Email (readonly) -->
                            <VCol cols="12" md="6">
                                <VTextField label="Email" :model-value="displayEmail" readonly disabled />
                            </VCol>

                            <!-- Số điện thoại -->
                            <VCol cols="12" md="6">
                                <VTextField label="Số điện thoại" v-model="form.phoneNumber"
                                    :error-messages="errors.phoneNumber" @blur="validateField('phoneNumber')"
                                    @input="clearError('phoneNumber')" maxlength="11" placeholder="0xxxxxxxxx" />
                            </VCol>

                            <!-- Số căn / số nhà -->
                            <VCol cols="12" md="6">
                                <VTextField label="Số căn / số nhà" v-model="form.unitNumber"
                                    :error-messages="errors.unitNumber" @blur="validateField('unitNumber')"
                                    @input="clearError('unitNumber')" maxlength="20" />
                            </VCol>

                            <!-- Số đường -->
                            <VCol cols="12" md="6">
                                <VTextField label="Số đường" v-model="form.streetNumber"
                                    :error-messages="errors.streetNumber" @blur="validateField('streetNumber')"
                                    @input="clearError('streetNumber')" maxlength="20" />
                            </VCol>

                            <!-- Tên đường -->
                            <VCol cols="12" md="6">
                                <VTextField label="Tên đường" v-model="form.addressLine1"
                                    :error-messages="errors.addressLine1" @blur="validateField('addressLine1')"
                                    @input="clearError('addressLine1')" maxlength="100" />
                            </VCol>

                            <!-- Tỉnh / Thành phố -->
                            <VCol cols="12" md="4">
                                <VSelect v-model="form.provinceId" :items="ghnProvinces" item-title="provinceName"
                                    item-value="provinceId" label="Tỉnh / Thành phố" :loading="isLoadingProvinces"
                                    :disabled="isLoadingProvinces" variant="outlined"
                                    :error-messages="errors.provinceId"
                                    @update:model-value="onProvinceChange(); clearError('provinceId')" />
                            </VCol>

                            <!-- Quận / Huyện -->
                            <VCol cols="12" md="4">
                                <VSelect v-model="form.districtId" :items="ghnDistricts" item-title="districtName"
                                    item-value="districtId" label="Quận / Huyện" :loading="isLoadingDistricts"
                                    :disabled="!form.provinceId || isLoadingDistricts" variant="outlined"
                                    :error-messages="errors.districtId"
                                    @update:model-value="onDistrictChange(); clearError('districtId')" />
                            </VCol>

                            <!-- Phường / Xã -->
                            <VCol cols="12" md="4">
                                <VSelect v-model="form.wardCode" :items="ghnWards" item-title="wardName"
                                    item-value="wardCode" label="Phường / Xã" :loading="isLoadingWards"
                                    :disabled="!form.districtId || isLoadingWards" variant="outlined"
                                    :error-messages="errors.wardCode"
                                    @update:model-value="onWardChange(); clearError('wardCode')" />
                            </VCol>

                            <!-- Mã bưu chính -->
                            <VCol cols="12" md="6">
                                <VTextField label="Mã bưu chính / Ghi chú khu vực (Không bắt buộc)"
                                    v-model="form.postalCode" :error-messages="errors.postalCode"
                                    @blur="validateField('postalCode')" @input="clearError('postalCode')"
                                    maxlength="20" />
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

// ─── Validation errors ───────────────────────────────────────────────────────
const errors = ref({
    username: '',
    phoneNumber: '',
    unitNumber: '',
    streetNumber: '',
    addressLine1: '',
    provinceId: '',
    districtId: '',
    wardCode: '',
    postalCode: ''
})

// ─── Validation rules ────────────────────────────────────────────────────────
const PHONE_REGEX = /^(0|\+84)(3[2-9]|5[6-9]|7[06-9]|8[0-9]|9[0-9])[0-9]{7}$/
const POSTAL_REGEX = /^[0-9]{5,6}$/
const USERNAME_REGEX = /^[a-zA-Z0-9_\.]{3,50}$/

const validationRules = {
    username: (val) => {
        if (!val || !val.trim()) return 'Tên đăng nhập không được để trống.'
        if (val.trim().length < 3) return 'Tên đăng nhập phải có ít nhất 3 ký tự.'
        if (val.trim().length > 50) return 'Tên đăng nhập không được vượt quá 50 ký tự.'
        if (!USERNAME_REGEX.test(val.trim())) return 'Tên đăng nhập chỉ chứa chữ cái, số, dấu gạch dưới (_) hoặc dấu chấm (.).'
        return ''
    },
    phoneNumber: (val) => {
        if (!val || !val.trim()) return 'Số điện thoại không được để trống.'
        if (!PHONE_REGEX.test(val.trim())) return 'Số điện thoại không hợp lệ. Ví dụ: 0901234567.'
        return ''
    },
    unitNumber: (val) => {
        if (!val || !val.trim()) return 'Số căn / số nhà không được để trống.'
        if (val.trim().length > 20) return 'Số căn / số nhà không được vượt quá 20 ký tự.'
        return ''
    },
    streetNumber: (val) => {
        if (!val || !val.trim()) return 'Số đường không được để trống.'
        if (val.trim().length > 20) return 'Số đường không được vượt quá 20 ký tự.'
        return ''
    },
    addressLine1: (val) => {
        if (!val || !val.trim()) return 'Tên đường không được để trống.'
        if (val.trim().length < 2) return 'Tên đường phải có ít nhất 2 ký tự.'
        if (val.trim().length > 100) return 'Tên đường không được vượt quá 100 ký tự.'
        return ''
    },
    provinceId: (val) => {
        if (!val) return 'Vui lòng chọn Tỉnh / Thành phố.'
        return ''
    },
    districtId: (val) => {
        if (!val) return 'Vui lòng chọn Quận / Huyện.'
        return ''
    },
    wardCode: (val) => {
        if (!val) return 'Vui lòng chọn Phường / Xã.'
        return ''
    },
    postalCode: (val) => {
        if (!val || !val.trim()) return '' // Không bắt buộc
        if (!POSTAL_REGEX.test(val.trim())) return 'Mã bưu chính phải gồm 5–6 chữ số.'
        return ''
    }
}

const validateField = (field) => {
    const rule = validationRules[field]
    if (rule) errors.value[field] = rule(form.value[field])
}

const clearError = (field) => {
    errors.value[field] = ''
}

const validateAll = () => {
    let valid = true
    for (const field of Object.keys(validationRules)) {
        validateField(field)
        if (errors.value[field]) valid = false
    }
    return valid
}

// ─── GHN helpers ─────────────────────────────────────────────────────────────
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

// ─── Save ─────────────────────────────────────────────────────────────────────
const saveChanges = async () => {
    // Validate toàn bộ form trước khi gửi
    if (!validateAll()) {
        return
    }

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

// ─── Avatar ──────────────────────────────────────────────────────────────────
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