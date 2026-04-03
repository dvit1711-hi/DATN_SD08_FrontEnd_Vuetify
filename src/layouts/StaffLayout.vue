<template>
    <v-app>
        <v-app-bar color="white" elevation="1" height="70" class="px-6">
            <div class="d-flex align-center w-100 justify-space-between">
                <router-link :to="{ name: 'StaffPosSale' }" class="d-flex align-center gap-3 text-decoration-none">
                    <img src="/images/logo1.jpg" alt="DTVD" class="logo-image" />
                    <span class="text-h6 font-weight-bold text-dark">Kênh nhân viên bán hàng</span>
                </router-link>

                <div class="d-flex align-center gap-4">
                    <v-menu offset-y>
                        <template #activator="{ props }">
                            <v-btn v-bind="props" icon size="large">
                                <v-avatar v-if="userAvatar" size="40" :image="userAvatar" />
                                <v-icon v-else size="40" color="primary">mdi-account-circle</v-icon>
                            </v-btn>
                        </template>
                        <v-list density="compact">
                            <v-list-item :title="`Xin chào, ${username || 'Staff'}`" disabled />
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
                        <v-list-item :to="{ name: 'StaffPosSale' }" title="Bán hàng tại quầy"
                            prepend-icon="mdi-cash-register" active-color="primary" />

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
        console.error("Lỗi khi lấy thông tin staff:", error)
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

.page-content {
    flex: 1;
    min-width: 0;
}

/* Sidebar text color */
:deep(.v-list-item__content) {
    color: #C9A982 !important;
}

:deep(.v-list-item) {
    color: #C9A982 !important;
}

:deep(.v-list-item-title) {
    color: #C9A982 !important;
}

:deep(.v-icon) {
    color: #C9A982 !important;
}

.w-100 {
    width: 100%;
}
</style>