<template>
    <v-app>
        <!-- Admin Header -->
        <v-app-bar color="white" elevation="1" height="70" class="px-6">
            <div class="d-flex align-center" style="width: 100%; justify-content: space-between;">
                <!-- Logo -->
                <router-link :to="{ name: 'AdminDashboard' }" class="d-flex align-center gap-3 text-decoration-none">
                    <img src="/images/logo2.png" alt="DTVD" class="logo-image" />
                    <span class="text-h6 font-weight-bold text-dark">Baseball Cap Shop</span>
                </router-link>

                <!-- Right Side -->
                <div class="d-flex align-center gap-4">
                    <!-- Notifications -->
                    <v-menu offset-y>
                        <template v-slot:activator="{ props }">
                            <v-badge color="red" content="3" offset-x="-8" offset-y="8">
                                <v-icon v-bind="props" class="cursor-pointer">mdi-bell-outline</v-icon>
                            </v-badge>
                        </template>
                        <v-list density="compact" style="width: 300px;">
                            <v-list-item title="Đơn hàng mới" subtitle="2 đơn" />
                            <v-list-item title="Sản phẩm hết hàng" subtitle="1 sản phẩm" />
                            <v-divider />
                            <v-list-item title="Xem tất cả" class="text-center text-primary" />
                        </v-list>
                    </v-menu>

                    <!-- User Menu -->
                    <v-menu offset-y>
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" icon size="large">
                                <v-avatar v-if="userAvatar" size="40" :image="userAvatar" />
                                <v-icon v-else size="40" color="primary">mdi-account-circle</v-icon>
                            </v-btn>
                        </template>
                        <v-list density="compact">
                            <v-list-item :title="`Xin chào, ${username}`" disabled />
                            <v-divider />
                            <v-list-item title="Cài Đặt" />
                            <v-divider />
                            <v-list-item title="Đăng Xuất" @click="handleLogout" />
                        </v-list>
                    </v-menu>
                </div>
            </div>
        </v-app-bar>

        <!-- Main Content -->
        <v-main class="bg-light">
            <v-container fluid class="d-flex" style="gap: 0;">
                <!-- Sidebar -->
                <v-navigation-drawer v-model="drawer" :permanent="true" width="200" class="bg-grey-lighten-5"
                    elevation="1">
                    <v-list density="compact">
                        <!-- Home -->
                        <v-list-item :to="{ name: 'AdminDashboard' }" title="Home" prepend-icon="mdi-home"
                            active-color="primary" />

                        <!-- Products -->
                        <v-list-group title="Products" prepend-icon="mdi-package-multiple">
                            <v-list-item :to="{ name: 'AdminProducts' }" title="Danh sách sản phẩm"
                                active-color="primary" />
                            <v-list-item title="Thêm sản phẩm" active-color="primary" />
                        </v-list-group>

                        <!-- Accounts -->
                        <v-list-group title="Admin Account" prepend-icon="mdi-account-tie">
                            <v-list-item :to="{ name: 'AdminAccounts' }" title="Danh sách tài khoản"
                                active-color="primary" />
                            <v-list-item title="Thêm tài khoản" active-color="primary" />
                        </v-list-group>

                        <!-- Discount Manager -->
                        <v-list-item :to="{ name: 'DiscountManager' }" title="Discount Manager"
                            prepend-icon="mdi-percent" active-color="primary" />

                        <!-- Statistics -->
                        <v-list-item :to="{ name: 'Statistics' }" title="Thống kê" prepend-icon="mdi-chart-box"
                            active-color="primary" />

                        <v-divider class="my-2" />

                        <!-- Back to Store -->
                        <v-list-item :to="{ name: 'Home' }" title="Quay về cửa hàng" prepend-icon="mdi-store"
                            active-color="primary" />
                    </v-list>
                </v-navigation-drawer>

                <!-- Page Content -->
                <div style="flex: 1;">
                    <router-view />
                </div>
            </v-container>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const drawer = ref(true)
const username = ref('')
const userAvatar = ref('')

const loadUserInfo = async () => {
    try {
        const token = localStorage.getItem('token')
        const accountId = localStorage.getItem('accountId')
        const storedUsername = localStorage.getItem('username')

        if (token && accountId) {
            username.value = storedUsername || ''

            // Lấy avatar từ API
            const res = await axios.get(`http://localhost:8080/api/account/getById/${accountId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            const account = res.data.account || res.data

            if (account.images) {
                if (account.images.startsWith('http') || account.images.startsWith('data:image')) {
                    userAvatar.value = account.images
                } else {
                    userAvatar.value = `http://localhost:8080${account.images}`
                }
            } else {
                // Không có ảnh, để trống - sẽ dùng icon fallback
                userAvatar.value = ''
            }
        }
    } catch (error) {
        console.error('Lỗi khi lấy thông tin admin:', error)
    }
}

const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('accountId')
    localStorage.removeItem('userRole')
    localStorage.removeItem('username')

    username.value = ''
    userAvatar.value = ''

    window.dispatchEvent(new Event('auth-changed'))
    router.push({ name: 'Login' })
}

onMounted(() => {
    loadUserInfo()
})
</script>

<style scoped>
.logo-image {
    height: 50px;
    max-width: 140px;
    object-fit: contain;
}

.bg-light {
    background-color: #f5f5f5;
}

.bg-grey-lighten-5 {
    background-color: #fafafa;
}

.cursor-pointer {
    cursor: pointer;
}
</style>
