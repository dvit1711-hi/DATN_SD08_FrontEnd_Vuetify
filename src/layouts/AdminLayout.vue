<template>
    <v-app :theme="appTheme" :class="['admin-layout', appTheme]">
        <v-app-bar :color="appTheme === 'dark' ? '#1e1e1e' : 'white'" elevation="1" height="70" class="px-6">
            <div class="d-flex align-center w-100 justify-space-between">
                <router-link :to="{ name: 'AdminDashboard' }" class="d-flex align-center gap-3 text-decoration-none">
                    <img src="/images/logo1.jpg" alt="DTVD" class="logo-image" />
                    <span class="text-h6 font-weight-bold text-title">Baseball Cap Shop</span>
                </router-link>

                <div class="d-flex align-center gap-4">
                    <v-btn variant="text" size="small" @click="toggleTheme">
                        <v-icon size="small" class="mr-1">
                            {{ appTheme === 'dark' ? 'mdi-weather-night' : 'mdi-white-balance-sunny' }}
                        </v-icon>
                        {{ appTheme === 'dark' ? t('common.dark') : t('common.light') }}
                    </v-btn>

                    <v-menu offset-y>
                        <template #activator="{ props }">
                            <v-badge color="red" content="3" offset-x="-8" offset-y="8">
                                <v-icon v-bind="props" class="cursor-pointer">mdi-bell-outline</v-icon>
                            </v-badge>
                        </template>

                        <v-list density="compact" style="width: 300px">
                            <v-list-item :title="t('common.newOrder')" :subtitle="t('common.newOrderCount')" />
                            <v-list-item :title="t('common.outOfStockProduct')"
                                :subtitle="t('common.outOfStockCount')" />
                            <v-divider />
                            <v-list-item :title="t('common.viewAll')" class="text-center text-primary" />
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
                            <v-list-item :title="`${t('common.hello')}, ${username || t('common.admin')}`" disabled />
                            <v-divider />
                            <v-list-item :title="t('common.setting')" />
                            <v-divider />
                            <v-list-item :title="t('common.logout')" @click="handleLogout" />
                        </v-list>
                    </v-menu>
                </div>
            </div>
        </v-app-bar>

        <v-main class="layout-main">
            <v-container fluid class="d-flex pa-0">
                <v-navigation-drawer v-model="drawer" :permanent="true" width="220" class="layout-drawer" elevation="1">
                    <v-list density="compact" nav>
                        <v-list-item :to="{ name: 'AdminDashboard' }" :title="t('common.adminHome')"
                            prepend-icon="mdi-home" active-color="primary" />

                        <v-list-item :to="{ name: 'AdminProducts' }" :title="t('common.productList')"
                            prepend-icon="mdi-format-list-bulleted" active-color="primary" />

                        <v-list-item :to="{ name: 'AdminAccounts' }" :title="t('common.accountList')"
                            prepend-icon="mdi-account-multiple" active-color="primary" />

                        <v-list-item :to="{ name: 'DiscountManager' }" :title="t('common.discountManager')"
                            prepend-icon="mdi-percent" active-color="primary" />

                        <v-list-item :to="{ name: 'DiscountProduct' }" :title="t('common.discountProduct')"
                            prepend-icon="mdi-sale" active-color="primary" />

                        <v-list-item :to="{ name: 'Statistics' }" :title="t('common.statistics')"
                            prepend-icon="mdi-chart-box" active-color="primary" />

                        <v-list-item :to="{ name: 'AdminPayments' }" :title="t('common.paymentConfirm')"
                            prepend-icon="mdi-cash-check" active-color="primary" />

                        <v-list-item :to="{ name: 'AdminReturnOrder' }" title="Trả hàng"
                            prepend-icon="mdi-keyboard-return" active-color="primary" />

                        <v-list-item :to="{ name: 'AdminBrandMaterial' }" :title="t('common.brandMaterial')"
                            prepend-icon="mdi-tag" active-color="primary" />

                        <v-list-item :to="{ name: 'AdminColorSize' }" :title="t('common.colorSize')"
                            prepend-icon="mdi-palette" active-color="primary" />

                        <v-list-item :to="{ name: 'AdminPosSale' }" :title="t('common.posSale')"
                            prepend-icon="mdi-cash-register" active-color="primary" />

                        <v-list-item :to="{ name: 'AdminStaffReport' }" :title="t('common.staffReport')"
                            prepend-icon="mdi-account-group" />

                        <v-divider class="my-2" />

                        <v-list-item :to="{ name: 'Home' }" :title="t('common.backToStore')" prepend-icon="mdi-store"
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import { useAppSettings } from '@/composables/useAppSettings'

const router = useRouter()
const { t } = useI18n()

const {
    appTheme,
    setLanguage,
    toggleTheme,
} = useAppSettings()

const drawer = ref(true)
const username = ref('')
const userAvatar = ref('')

const loadUserInfo = async () => {
    try {
        const token = localStorage.getItem('token')
        const accountId = localStorage.getItem('accountId')
        const storedUsername = localStorage.getItem('username')

        if (!token || !accountId) {
            username.value = ''
            userAvatar.value = ''
            return
        }

        username.value = storedUsername || ''

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
            if (account.images.startsWith('http') || account.images.startsWith('data:image')) {
                userAvatar.value = account.images
            } else {
                userAvatar.value = `http://localhost:8080${account.images}`
            }
        } else {
            userAvatar.value = ''
        }
    } catch (error) {
        console.error('Lỗi khi lấy thông tin admin:', error)
        userAvatar.value = ''
    }
}

const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('accountId')
    localStorage.removeItem('userRole')
    localStorage.removeItem('username')
    localStorage.removeItem('email')
    localStorage.removeItem('roles')
    localStorage.removeItem('cartId')

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

.layout-main {
    background-color: rgb(var(--v-theme-background));
    color: rgb(var(--v-theme-on-background));
}

.layout-drawer {
    background-color: rgb(var(--v-theme-surface)) !important;
}

.text-title {
    color: rgb(var(--v-theme-on-surface));
}

.cursor-pointer {
    cursor: pointer;
}

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

.page-content {
    flex: 1;
    min-width: 0;
    background-color: rgb(var(--v-theme-background));
    color: rgb(var(--v-theme-on-background));
}

.w-100 {
    width: 100%;
}
</style>