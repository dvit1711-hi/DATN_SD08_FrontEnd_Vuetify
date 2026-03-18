<template>
  <v-app>
    <v-layout>
      <!-- Sidebar -->
      <v-navigation-drawer v-model="drawer">
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
      <v-app-bar flat border="b">
        <v-app-bar-nav-icon v-if="$vuetify.display.smAndDown" @click="drawer = !drawer" />

        <v-app-bar-title>Baseball Cap Shop</v-app-bar-title>

        <template #append>
          <!-- Nếu đã đăng nhập -->
          <div v-if="isLoggedIn">
            <v-btn icon>
              <v-avatar :image="getAvatarImage(currentUser.images)" size="32" />

              <v-menu activator="parent">
                <v-list density="compact">
                  <v-list-item :title="currentUser.username || 'Account'" subtitle="Đang đăng nhập" />
                  <v-divider />

                  <v-list-item title="Account" to="/account" />
                  <v-list-item title="Settings" to="/accountSecurity" />
                  <v-list-item title="Logout" @click="logout" />
                </v-list>
              </v-menu>
            </v-btn>
          </div>

          <!-- Nếu chưa đăng nhập -->
          <div v-else class="d-flex ga-2 me-2">
            <v-btn variant="text" to="/login">Login</v-btn>
            <v-btn color="primary" to="/register">Register</v-btn>
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