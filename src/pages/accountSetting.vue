<template>
    <VCard title="Thông tin tài khoản">
        <VCardText class="d-flex align-center gap-6">

            <!-- Avatar -->
            <VAvatar size="100" :image="getImage(account.images)" />

            <div>
                <p><b>Username:</b> {{ account.username }}</p>
                <p><b>Email:</b> {{ account.email }}</p>
                <p><b>Phone:</b> {{ account.phoneNumber }}</p>
            </div>

        </VCardText>
    </VCard>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import accountApi from '@/api/accountApi'

const account = ref({})

// hàm lấy đường dẫn ảnh
const getImage = (img) => {
    if (!img) return '/images/default.png'
    return '/images/' + img
}

const loadAccount = async () => {
    try {
        const res = await accountApi.getById(2)
        account.value = res.data
    } catch (error) {
        console.error(error)
    }
}

onMounted(() => {
    loadAccount()
})
</script>