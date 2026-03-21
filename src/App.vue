<template>
  <v-app>
    <v-layout>
      <!-- Sidebar -->
      <v-navigation-drawer v-model="drawer">
        <div class="sidebar-logo-container pa-4 d-flex justify-center border-b">
          <img src="/images/logo1.jpg" alt="DTVD Logo" class="sidebar-logo" />
        </div>
        <v-list density="compact" nav>
          <template v-for="item in items" :key="item.title">
            <v-list-item v-if="!item.children" :to="item.to" :prepend-icon="item.icon" :title="item.title" link />

            <v-list-group v-else value="Admin">
              <template #activator="{ props }">
                <v-list-item v-bind="props" :title="item.title" prepend-icon="mdi-shield-account" />
              </template>

              <v-list-item v-for="child in item.children" :key="child.title" :to="child.to" :prepend-icon="child.icon"
                :title="child.title" link />
            </v-list-group>
          </template>
        </v-list>
      </v-navigation-drawer>

      <!-- Header -->
      <v-app-bar flat color="background" border="b" class="navbar">
        <v-app-bar-nav-icon v-if="$vuetify.display.smAndDown" @click="drawer = !drawer" />

        <div class="d-flex align-center gap-2">
          <img src="/images/logo2.png" alt="Logo" class="logo-img" />
          <v-app-bar-title class="font-weight-bold brand-title">
            <span class="brand-text">Baseball Cap Shop</span>
          </v-app-bar-title>
        </div>

        <template #append>
          <!-- Nếu đã đăng nhập -->
          <div v-if="isLoggedIn">
            <v-btn icon>
              <v-avatar :image="getAvatarImage(currentUser.images)" size="32" />

              <v-menu activator="parent">
                <v-list density="compact">
                  <v-list-item :title="currentUser.username || 'Tài khoản'" subtitle="Đang đăng nhập" />
                  <v-divider />

                  <v-list-item title="Hồ sơ" to="/account" />
                  <v-list-item title="Bảo mật" to="/accountSecurity" />
                  <v-divider />
                  <v-list-item title="Đăng xuất" @click="logout" />
                </v-list>
              </v-menu>
            </v-btn>
          </div>

          <!-- Nếu chưa đăng nhập -->
          <div v-else class="d-flex gap-2 me-2">
            <v-btn variant="text" to="/login">Đăng nhập</v-btn>
            <v-btn color="primary" to="/register">Đăng ký</v-btn>
          </div>
        </template>
      </v-app-bar>

      <!-- Page Content -->
      <v-main>
        <v-container>
          <router-view />
        </v-container>
      </v-main>
    </v-layout>
  </v-app>

  <Footer />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import Footer from './layouts/components/Footer.vue'
import accountApi from '@/api/accountApi'

const router = useRouter()
const drawer = ref(true)

const isLoggedIn = ref(false)

const currentUser = ref({
  id: null,
  username: '',
  images: '',
})

const items = [
  {
    title: 'Home',
    icon: 'mdi-home',
    to: '/',
  },
  {
    title: 'Products',
    icon: 'mdi-hanger',
    to: '/',
  },
  {
    title: 'Reviews',
    icon: 'mdi-star',
    to: '/review',
  },
  {
    title: 'Admin',
    children: [
      {
        title: 'Admin Products',
        icon: 'mdi-database',
        to: '/products/list',
      },
      {
        title: 'Admin Account',
        icon: 'mdi-account-cog',
        to: '/accountList',
      },
      {
        title: 'Discount Manager',
        icon: 'mdi-account-cog',
        to: '/discount',
      },
      {
        title: 'Thống kê',
        icon: 'mdi-account-cog',
        to: '/admin/statistics',
      },
    ],
  },
]

const resetCurrentUser = () => {
  currentUser.value = {
    id: null,
    username: '',
    images: '',
  }
}

const loadCurrentUser = async () => {
  try {
    const accountId = localStorage.getItem('accountId')
    if (!accountId) {
      resetCurrentUser()
      return
    }

    const res = await accountApi.getById(accountId)
    const account = res.data.account || res.data

    currentUser.value = {
      id: account.id || null,
      username: account.username || localStorage.getItem('username') || '',
      images: account.images || '',
    }
  } catch (error) {
    console.error('Lỗi load user:', error)
    resetCurrentUser()
  }
}

const syncAuthState = async () => {
  const token = localStorage.getItem('token')
  isLoggedIn.value = !!token

  if (isLoggedIn.value) {
    await loadCurrentUser()
  } else {
    resetCurrentUser()
  }
}

const getAvatarImage = (img) => {
  if (!img) return '/images/default.jpg'

  if (img.startsWith('data:image')) return img
  if (img.startsWith('http://') || img.startsWith('https://')) return img

  return `http://localhost:8080${img}`
}

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('accountId')
  localStorage.removeItem('username')

  isLoggedIn.value = false
  resetCurrentUser()

  window.dispatchEvent(new Event('auth-changed'))
  router.push('/login')
}

onMounted(() => {
  syncAuthState()

  window.addEventListener('auth-changed', syncAuthState)
  window.addEventListener('storage', syncAuthState)
})

onBeforeUnmount(() => {
  window.removeEventListener('auth-changed', syncAuthState)
  window.removeEventListener('storage', syncAuthState)
})
</script>

<style scoped>
:deep(.background) {
  background-color: #F5DEB3 !important;
}

.logo-img {
  width: 200px;
  height: 150px;
  object-fit: contain;
}

.sidebar-logo-container {
  border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
  padding: 12px !important;
}

.sidebar-logo {
  width: 200px;
  height: 100px;
  object-fit: contain;
}

.brand-title {
  margin: 0 !important;
  padding: 0 !important;
}

.brand-text {
  color: #000000 !important;
  font-size: 1.3rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px;
}

.navbar {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08) !important;
}

:deep(.v-navigation-drawer) {
  border-right: 1px solid rgba(205, 186, 150, 0.1);
}

:deep(.v-app-bar) {
  border-bottom: 1px solid rgba(205, 186, 150, 0.1);
}

:deep(.v-list-item__title),
:deep(.v-list-item-subtitle),
:deep(.v-list-group__header) {
  color: #000000 !important;
}

:deep(.v-list-item) {
  color: #000000 !important;
}

:deep(.v-list-item:hover) {
  background-color: rgba(0, 0, 0, 0.05) !important;
}

:deep(.v-btn--variant-text) {
  color: #000000 !important;
}

:deep(.v-btn--color-primary) {
  background-color: #8B4513 !important;
}
</style>
