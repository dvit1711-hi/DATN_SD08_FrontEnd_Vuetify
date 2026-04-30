<template>
  <div>
    <!-- Top Navigation Bar -->
    <v-toolbar color="#cdba96" dark height="36" class="px-8">
      <div class="d-flex align-center" style="width: 100%; justify-content: space-between;">
        <div class="d-flex align-center gap-4">
          <router-link v-if="isLoggedIn && isAdmin" :to="{ name: 'AdminDashboard' }"
            class="text-decoration-none text-caption" style="color: white;">
            {{ t('common.sellerChannel') }}
          </router-link>

          <router-link v-if="isLoggedIn && isStaff" :to="{ name: 'StaffPosSale' }"
            class="text-decoration-none text-caption" style="color: white;">
            {{ t('common.staffChannel') }}
          </router-link>
        </div>

        <div class="d-flex align-center gap-4">
          <!-- Theme -->
          <v-btn size="small" variant="text" class="top-action-btn" @click="toggleTheme">
            <v-icon size="small" class="mr-1">
              {{ appTheme === 'dark' ? 'mdi-weather-night' : 'mdi-white-balance-sunny' }}
            </v-icon>
            {{ appTheme === 'dark' ? t('common.dark') : t('common.light') }}
          </v-btn>

          <!-- Language -->
          <v-menu offset-y>
            <template #activator="{ props }">
              <div v-bind="props" class="d-flex align-center gap-2 text-caption top-action-link">
                <v-icon size="small">mdi-globe</v-icon>
                <span>{{ currentLanguageLabel }}</span>
                <v-icon size="small">mdi-chevron-down</v-icon>
              </div>
            </template>

            <v-list density="compact">
              <v-list-item :active="language === 'vi'" @click="setLanguage('vi')">
                <template #prepend>
                  <span class="mr-2">🇻🇳</span>
                </template>
                <v-list-item-title>Tiếng Việt</v-list-item-title>
              </v-list-item>

              <v-list-item :active="language === 'en'" @click="setLanguage('en')">
                <template #prepend>
                  <span class="mr-2">🇺🇸</span>
                </template>
                <v-list-item-title>English</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <router-link v-if="!isLoggedIn" :to="{ name: 'Register' }"
            class="text-white text-decoration-none text-caption">
            {{ t('common.register') }}
          </router-link>

          <router-link v-if="!isLoggedIn" :to="{ name: 'Login' }" class="text-white text-decoration-none text-caption">
            {{ t('common.login') }}
          </router-link>
        </div>
      </div>
    </v-toolbar>

    <!-- Main Header -->
    <v-toolbar color="#cdba96" dark height="80" class="px-8">
      <div class="d-flex align-center" style="width: 100%; justify-content: space-between;">
        <router-link :to="{ name: 'Home' }" class="d-flex align-center gap-3 text-decoration-none">
          <img src="/images/logo2.png" alt="DTVD" class="logo-image" />
          <span class="font-weight-bold text-dark" style="font-size: 28px; letter-spacing: 1px;">
            Baseball Cap Shop
          </span>
        </router-link>

        <div class="flex-grow-1 mx-6" style="max-width: 600px;">
          <div class="search-bar-header">
            <v-text-field v-model="searchQuery" :placeholder="t('common.search')" variant="solo" flat hide-details
              class="search-input-header" @keyup.enter="handleSearch" />

            <v-btn icon="mdi-magnify" variant="flat" color="black" size="x-large" class="search-btn-header"
              @click="handleSearch" />
          </div>
        </div>

        <div class="d-flex align-center gap-4">
          <router-link :to="{ name: 'Cart' }" class="d-flex flex-column align-center text-decoration-none gap-1"
            style="color: white;">
            <v-badge color="red" :content="cartCount" offset-x="-8" offset-y="8">
              <v-icon size="28" style="color: #000000;">mdi-shopping-outline</v-icon>
            </v-badge>
            <span class="text-caption" style="color: #000000;">{{ t('common.cart') }}</span>
          </router-link>

          <v-menu offset-y v-if="isLoggedIn">
            <template #activator="{ props }">
              <div v-bind="props" class="d-flex align-center gap-2 cursor-pointer">
                <v-avatar v-if="userAvatar" size="32" :image="userAvatar" />
                <v-icon v-else size="32" style="color: #000000;">mdi-account-circle</v-icon>
                <span class="text-caption" style="color: #000000;">{{ username }}</span>
              </div>
            </template>

            <v-list density="compact">
              <v-list-item :to="{ name: 'AccountSecurity' }" :title="t('common.accountSecurity')" />
              <v-list-item :to="{ name: 'AccountSetting' }" :title="t('common.accountSetting')" />
              <v-divider />
              <v-list-item :title="t('common.logout')" @click="handleLogout" />
            </v-list>
          </v-menu>
        </div>
      </div>
    </v-toolbar>

    <!-- Category Navigation -->
    <v-toolbar :color="appTheme === 'dark' ? '#1e1e1e' : '#FFFFFF'" height="50" class="px-8 border-bottom">
      <div class="d-flex align-center gap-6">
        <router-link :to="{ name: 'Home' }" class="text-decoration-none text-body2 font-weight-medium nav-link">
          {{ t('common.home') }}
        </router-link>

        <router-link :to="{ name: 'ProductList' }" class="text-decoration-none text-body2 font-weight-medium nav-link">
          {{ t('common.products') }}
        </router-link>

        <v-menu offset-y>
          <template #activator="{ props }">
            <div v-bind="props"
              class="text-decoration-none text-body2 font-weight-medium nav-link d-flex align-center gap-1"
              style="cursor: pointer;">
              <span>{{ t('common.category') }}</span>
              <v-icon size="20">mdi-chevron-down</v-icon>
            </div>
          </template>

          <v-list density="compact">
            <v-list-item :title="t('common.review')" :to="{ name: 'Review' }" />
            <v-list-item :title="t('common.purchaseHistory')" :to="{ name: 'PurchaseHistory' }" />
          </v-list>
        </v-menu>

        <router-link :to="{ name: 'Promotion' }" class="text-decoration-none text-body2 font-weight-medium"
          style="color: #FF6633;">
          🎉 {{ t('common.promotion') }}
        </router-link>
      </div>
    </v-toolbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import { useAppSettings } from '@/composables/useAppSettings'

const router = useRouter()
const { t } = useI18n()
const {
  language,
  appTheme,
  currentLanguageLabel,
  setLanguage,
  toggleTheme,
} = useAppSettings()

const searchQuery = ref('')
const cartCount = ref(0)
const isAdmin = ref(false)
const isStaff = ref(false)
const isLoggedIn = ref(false)
const username = ref('')
const userAvatar = ref('')

const parseStoredRoles = (): string[] => {
  const userRole = localStorage.getItem('userRole')
  const rawRoles = localStorage.getItem('roles')

  let roles: string[] = []

  if (rawRoles) {
    try {
      const parsed = JSON.parse(rawRoles)
      if (Array.isArray(parsed)) {
        roles = parsed
      } else {
        roles = rawRoles.split(',').map((r) => r.trim())
      }
    } catch {
      roles = rawRoles.split(',').map((r) => r.trim())
    }
  }

  if (userRole && !roles.includes(userRole)) {
    roles.push(userRole)
  }

  return roles.filter(Boolean)
}

const loadCartCount = async () => {
  let cartId = Number.parseInt(localStorage.getItem('cartId') || '', 10)

  if (!Number.isFinite(cartId) || cartId <= 0) {
    const accountId = Number.parseInt(localStorage.getItem('accountId') || '', 10)
    const token = localStorage.getItem('token')

    if (Number.isFinite(accountId) && accountId > 0) {
      try {
        const config = token
          ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
          : undefined

        const cartRes = await axios.post('http://localhost:8080/api/carts', { accountID: accountId }, config)
        const resolvedCartId = Number.parseInt(cartRes.data?.id || cartRes.data?.cartID, 10)

        if (Number.isFinite(resolvedCartId) && resolvedCartId > 0) {
          cartId = resolvedCartId
          localStorage.setItem('cartId', String(resolvedCartId))
        }
      } catch (error) {
        console.error('Lỗi khi đồng bộ cartId:', error)
      }
    }
  }

  if (!Number.isFinite(cartId) || cartId <= 0) {
    cartCount.value = 0
    return
  }

  try {
    const res = await axios.get(`http://localhost:8080/api/cart-items/cart/${cartId}`)
    cartCount.value = (res.data || []).reduce(
      (sum: number, item: any) => sum + (Number.parseInt(item.quantity, 10) || 0),
      0
    )
  } catch (error) {
    console.error('Lỗi khi tải số lượng giỏ hàng:', error)
    cartCount.value = 0
  }
}

const checkUserRole = async () => {
  const roles = parseStoredRoles()
  const accountId = localStorage.getItem('accountId')
  const storedUsername = localStorage.getItem('username')
  const token = localStorage.getItem('token')

  if (token && accountId) {
    isLoggedIn.value = true
    username.value = storedUsername || ''

    try {
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
      console.error('Lỗi khi lấy avatar:', error)
      userAvatar.value = ''
    }
  } else {
    isLoggedIn.value = false
    username.value = ''
    userAvatar.value = ''
  }

  await loadCartCount()

  isAdmin.value =
    roles.includes('ROLE_ADMIN') ||
    roles.includes('ADMIN') ||
    roles.includes('admin')

  isStaff.value =
    roles.includes('ROLE_STAFF') ||
    roles.includes('STAFF') ||
    roles.includes('staff')
}

const handleSearch = () => {
  const keyword = searchQuery.value.trim()

  router.push({
    name: 'ProductList',
    query: keyword ? { search: keyword } : {},
  })
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('accountId')
  localStorage.removeItem('userRole')
  localStorage.removeItem('username')
  localStorage.removeItem('email')
  localStorage.removeItem('roles')
  localStorage.removeItem('cartId')

  isAdmin.value = false
  isStaff.value = false
  isLoggedIn.value = false
  username.value = ''
  userAvatar.value = ''
  cartCount.value = 0

  window.dispatchEvent(new Event('auth-changed'))
  router.push({ name: 'Login' })
}

onMounted(() => {
  checkUserRole()
  window.addEventListener('auth-changed', checkUserRole)
  window.addEventListener('cart-changed', loadCartCount)
})

onBeforeUnmount(() => {
  window.removeEventListener('auth-changed', checkUserRole)
  window.removeEventListener('cart-changed', loadCartCount)
})
</script>

<style scoped>
a {
  transition: opacity 0.2s ease;
}

a:hover {
  opacity: 0.8;
}

.logo-image {
  height: 60px;
  max-width: 150px;
  object-fit: contain;
}

.text-dark {
  color: #333;
}

.nav-link {
  color: rgb(var(--v-theme-on-surface));
}

.border-bottom {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.gap-1 {
  gap: 0.25rem;
}

.gap-2 {
  gap: 0.5rem;
}

.gap-3 {
  gap: 0.75rem;
}

.gap-4 {
  gap: 1rem;
}

.gap-6 {
  gap: 1.5rem;
}

.top-action-link {
  cursor: pointer;
  color: #000000;
  padding: 4px 8px;
  border-radius: 999px;
}

.top-action-link:hover,
.top-action-btn:hover {
  background-color: rgba(255, 255, 255, 0.25);
}

.top-action-btn {
  color: #000000 !important;
  text-transform: none;
}

.search-bar-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input-header {
  flex: 1;
}

.search-input-header :deep(.v-field) {
  background: white !important;
  border-radius: 28px !important;
  box-shadow: none !important;
}

.search-input-header :deep(.v-field:hover) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

.search-input-header :deep(.v-field.v-field--focused) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12) !important;
}

.search-input-header :deep(.v-field__input) {
  font-size: 18px !important;
  color: #000 !important;
  padding: 0 8px !important;
  font-weight: 700;
}

.search-input-header :deep(.v-field__input::placeholder) {
  color: #666 !important;
  font-size: 18px !important;
  font-weight: 700;
}

.search-btn-header {
  width: 60px !important;
  height: 60px !important;
  border-radius: 50% !important;
  background: white !important;
  border: none !important;
  flex-shrink: 0;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08) !important;
}

.search-btn-header:hover {
  background: #f5f5f5 !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12) !important;
  transform: scale(1.05);
}

.search-btn-header :deep(.v-icon) {
  color: #000 !important;
  font-size: 28px !important;
}
</style>