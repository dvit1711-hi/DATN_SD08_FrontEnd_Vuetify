<template>
  <div>
    <!-- Top Navigation Bar -->
    <v-toolbar color="#cdba96" dark height="36" class="px-8">
      <div class="d-flex align-center" style="width: 100%; justify-content: space-between;">
        <div class="d-flex align-center gap-4">
          <!-- Kênh Người Bán - Chỉ hiển thị khi là Admin -->
          <router-link v-if="isLoggedIn && isAdmin" :to="{ name: 'AdminDashboard' }" class="text-decoration-none text-caption"
            style="color: white;">
            Kênh Người Bán
          </router-link>

          <!-- Kênh staff -->
          <router-link v-if="isLoggedIn && isStaff" :to="{ name: 'StaffPosSale' }"
            class="text-decoration-none text-caption" style="color: white;">
            Kênh Nhân Viên
          </router-link>
        </div>

        <div class="d-flex align-center gap-4">
          <v-menu offset-y>
            <template v-slot:activator="{ props }">
              <div v-bind="props" class="d-flex align-center gap-2 text-caption" style="cursor: pointer; color: #000000;">
                <v-icon size="small">mdi-globe</v-icon>
                <span>Tiếng Việt</span>
                <v-icon size="small">mdi-chevron-down</v-icon>
              </div>
            </template>
            <v-list density="compact">
              <v-list-item title="Tiếng Việt" />
              <v-list-item title="English" />
            </v-list>
          </v-menu>

          <router-link v-if="!isLoggedIn" :to="{ name: 'Register' }"
            class="text-white text-decoration-none text-caption">
            Đăng Ký
          </router-link>

          <router-link v-if="!isLoggedIn" :to="{ name: 'Login' }" class="text-white text-decoration-none text-caption">
            Đăng Nhập
          </router-link>
        </div>
      </div>
    </v-toolbar>

    <!-- Main Header -->
    <v-toolbar color="#cdba96" dark height="80" class="px-8">
      <div class="d-flex align-center" style="width: 100%; justify-content: space-between;">
        <!-- Logo -->
        <router-link :to="{ name: 'Home' }" class="d-flex align-center gap-3 text-decoration-none">
          <img src="/images/logo2.png" alt="DTVD" class="logo-image" />
          <span class="font-weight-bold text-dark" style="font-size: 28px; letter-spacing: 1px;">
            Baseball Cap Shop
          </span>
        </router-link>

        <!-- Search Bar -->
        <div class="flex-grow-1 mx-6" style="max-width: 600px;">
          <v-text-field v-model="searchQuery" placeholder="Tìm kiếm sản phẩm..." prepend-inner-icon="mdi-magnify"
            outlined dense hide-details class="bg-white rounded" @keyup.enter="handleSearch" />
        </div>

        <!-- Right Side Actions -->
        <div class="d-flex align-center gap-4">
          <!-- Shopping Cart -->
          <router-link :to="{ name: 'Cart' }" class="d-flex flex-column align-center text-decoration-none gap-1"
            style="color: white;">
            <v-badge color="red" :content="cartCount" offset-x="-8" offset-y="8">
              <v-icon size="28" style="color: #000000;">mdi-shopping-outline</v-icon>
            </v-badge>
            <span class="text-caption" style="color: #000000;">Giỏ Hàng</span>
          </router-link>

          <!-- User Menu -->
          <v-menu offset-y v-if="isLoggedIn">
            <template v-slot:activator="{ props }">
              <div v-bind="props" class="d-flex align-center gap-2 cursor-pointer">
                <v-avatar v-if="userAvatar" size="32" :image="userAvatar" />
                <v-icon v-else size="32" style="color: #000000;">mdi-account-circle</v-icon>
                <span class="text-caption" style="color: #000000;">{{ username }}</span>
              </div>
            </template>
            <v-list density="compact">
              <v-list-item :to="{ name: 'AccountSecurity' }" title="Bảo mật Tài khoản" />
              <v-list-item :to="{ name: 'AccountSetting' }" title="Cài đặt Tài khoản" />
              <v-divider />
              <v-list-item title="Đăng Xuất" @click="handleLogout" />
            </v-list>
          </v-menu>
        </div>
      </div>
    </v-toolbar>

    <!-- Category Navigation -->
    <v-toolbar color="#FFFFFF" height="50" class="px-8 border-bottom">
      <div class="d-flex align-center gap-6">
        <router-link :to="{ name: 'Home' }" class="text-decoration-none text-body2 font-weight-medium text-dark">
          Trang Chủ
        </router-link>

        <router-link :to="{ name: 'ProductList' }" class="text-decoration-none text-body2 font-weight-medium text-dark">
          Sản Phẩm
        </router-link>

        <v-menu offset-y>
          <template v-slot:activator="{ props }">
            <div v-bind="props"
              class="text-decoration-none text-body2 font-weight-medium text-dark d-flex align-center gap-1"
              style="cursor: pointer;">
              <span>Danh Mục</span>
              <v-icon size="20">mdi-chevron-down</v-icon>
            </div>
          </template>
          <v-list density="compact">
            <v-list-item title="Đánh giá" :to="{ name: 'Review' }" />
            <v-list-item title="Lịch sử mua hàng" :to="{ name: 'PurchaseHistory' }" />
          </v-list>
        </v-menu>

        <router-link :to="{ name: 'Promotion' }" class="text-decoration-none text-body2 font-weight-medium"
          style="color: #FF6633;">
          🎉 Khuyến Mãi & Mã Giảm Giá
        </router-link>
      </div>
    </v-toolbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
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

.border-bottom {
  border-bottom: 1px solid #e0e0e0;
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
</style>