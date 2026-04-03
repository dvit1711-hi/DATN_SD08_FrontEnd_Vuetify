<template>
    <v-app>
        <v-app-bar color="white" elevation="1" height="70" class="px-6">
            <div class="d-flex align-center w-100 justify-space-between">
                <router-link :to="{ name: 'AdminDashboard' }" class="d-flex align-center gap-3 text-decoration-none">
                    <img src="/images/logo1.jpg" alt="DTVD" class="logo-image" />
                    <span class="text-h6 font-weight-bold text-dark">Baseball Cap Shop</span>
                </router-link>

                <div class="d-flex align-center gap-4">
                    <v-menu offset-y>
                        <template #activator="{ props }">
                            <v-badge color="red" content="3" offset-x="-8" offset-y="8">
                                <v-icon v-bind="props" class="cursor-pointer">mdi-bell-outline</v-icon>
                            </v-badge>
                        </template>
                        <v-list density="compact" style="width: 300px">
                            <v-list-item title="Đơn hàng mới" subtitle="2 đơn" />
                            <v-list-item title="Sản phẩm hết hàng" subtitle="1 sản phẩm" />
                            <v-divider />
                            <v-list-item title="Xem tất cả" class="text-center text-primary" />
                        </v-list>
                    </v-menu>

                    <v-menu offset-y>
                        <template #activator="{ props }">
                            <v-btn v-bind="props" icon size="large">
                                <v-avatar v-if="userAvatar" size="40" :image="userAvatar" />
                                <v-icon v-else size="40" color="primary">mdi-account-circle</v-icon>
                            </v-btn>
                        </template>
                        <v-list density="compact">
                            <v-list-item :title="`Xin chào, ${username || 'Admin'}`" disabled />
                            <v-divider />
                            <v-list-item title="Cài đặt" />
                            <v-divider />
                            <v-list-item title="Đăng xuất" @click="handleLogout" />
                        </v-list>
                    </v-menu>
                </div>
            </div>
        </v-app-bar>

        <v-main class="bg-light">
            <v-container fluid class="d-flex pa-0">
                <v-navigation-drawer v-model="drawer" :permanent="true" width="220" class="bg-grey-lighten-5"
                    elevation="1">
                    <v-list density="compact" nav>
                        <v-list-item :to="{ name: 'AdminDashboard' }" title="Home" prepend-icon="mdi-home"
                            active-color="primary" />

                        <v-list-item :to="{ name: 'AdminProducts' }" title="Danh sách sản phẩm"
                            prepend-icon="mdi-format-list-bulleted" active-color="primary" />

                        <v-list-item :to="{ name: 'AdminAccounts' }" title="Danh sách tài khoản"
                            prepend-icon="mdi-account-multiple" active-color="primary" />

                        <v-list-item :to="{ name: 'DiscountManager' }" title="Discount Manager"
                            prepend-icon="mdi-percent" active-color="primary" />

                        <v-list-item :to="{ name: 'DiscountProduct' }" title="Giảm giá biến thể màu"
                            prepend-icon="mdi-sale" active-color="primary" />

                        <v-list-item :to="{ name: 'Statistics' }" title="Thống kê" prepend-icon="mdi-chart-box"
                            active-color="primary" />

                        <v-list-item :to="{ name: 'AdminPayments' }" title="Xác nhận thanh toán"
                            prepend-icon="mdi-cash-check" active-color="primary" />

                        <!-- Brand & Material -->
                        <v-list-item :to="{ name: 'AdminBrandMaterial' }" title="Brand & Material"
                            prepend-icon="mdi-tag" active-color="primary" />

                        <!-- Color & Size -->
                        <v-list-item :to="{ name: 'AdminColorSize' }" title="Color & Size"
                            prepend-icon="mdi-palette" active-color="primary" />

                        <v-divider class="my-2" />

                        <v-list-item :to="{ name: 'Home' }" title="Quay về cửa hàng" prepend-icon="mdi-store"
                            active-color="primary" />
                    </v-list>
                </v-navigation-drawer>

                <div class="page-content">
                    <router-view />
                </div>
            </v-container>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import axios from "axios"

const router = useRouter()
const drawer = ref(true)
const username = ref("")
const userAvatar = ref("")

const loadUserInfo = async () => {
    try {
        const token = localStorage.getItem("token")
        const accountId = localStorage.getItem("accountId")
        const storedUsername = localStorage.getItem("username")

        if (!token || !accountId) {
            username.value = ""
            userAvatar.value = ""
            return
        }

        username.value = storedUsername || ""

        const res = await axios.get(`http://localhost:8080/api/account/getById/${accountId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        const account = res.data.account || res.data

        if (account?.username && !username.value) {
            username.value = account.username
        }

        if (account?.images) {
            if (account.images.startsWith("http") || account.images.startsWith("data:image")) {
                userAvatar.value = account.images
            } else {
                userAvatar.value = `http://localhost:8080${account.images}`
            }
        } else {
            userAvatar.value = ""
        }
    } catch (error) {
        console.error("Lỗi khi lấy thông tin admin:", error)
        userAvatar.value = ""
    }
}

const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("accountId")
    localStorage.removeItem("userRole")
    localStorage.removeItem("username")
    localStorage.removeItem("email")
    localStorage.removeItem("roles")
    localStorage.removeItem("cartId")

    username.value = ""
    userAvatar.value = ""

    window.dispatchEvent(new Event("auth-changed"))
    router.push({ name: "Login" })
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

.page-content {
    flex: 1;
    min-width: 0;
}

.w-100 {
    width: 100%;
}
</style>