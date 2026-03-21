<template>
  <div>
    <!-- Top Navigation Bar -->
    <v-toolbar color="#cdba96" dark height="36" class="px-8">
      <div class="d-flex align-center" style="width: 100%; justify-content: space-between;">
        <div class="d-flex align-center gap-4">
          <!-- Kênh Người Bán - Chỉ hiển thị khi là Admin -->
            <router-link v-if="isAdmin" :to="{ name: 'AdminDashboard' }"
              class="text-decoration-none text-caption"
              style="color: white;">
              Kênh Người Bán
            </router-link>
        </div>
        <div class="d-flex align-center gap-4">
          <v-menu offset-y>
            <template v-slot:activator="{ props }">
              <div v-bind="props" class="d-flex align-center gap-2 text-caption text-white" style="cursor: pointer;">
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
          <span class="text-caption" style="color: rgba(255,255,255,0.7)">|</span>
          <!-- Ẩn khi đã đăng nhập -->
          <router-link v-if="!isLoggedIn" :to="{ name: 'Register' }"
            class="text-white text-decoration-none text-caption">Đăng
            Ký</router-link>
          <router-link v-if="!isLoggedIn" :to="{ name: 'Login' }"
            class="text-white text-decoration-none text-caption">Đăng
            Nhập</router-link>
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
            <router-link :to="{ name: 'Cart' }"
              class="d-flex flex-column align-center text-decoration-none gap-1"
              style="color: white;">
              
              <v-badge color="red" :content="cartCount" offset-x="-8" offset-y="8">
                <v-icon size="28" style="color: white;">mdi-shopping-outline</v-icon>
              </v-badge>

              <span class="text-caption" style="color: white;">Giỏ Hàng</span>
            </router-link>  
          <!-- User Menu with Avatar -->
          <v-menu offset-y v-if="isLoggedIn">
            <template v-slot:activator="{ props }">
              <div v-bind="props" class="d-flex align-center gap-2 cursor-pointer">
                <v-avatar v-if="userAvatar" size="32" :image="userAvatar" />
                <v-icon v-else size="32" class="text-white">mdi-account-circle</v-icon>
                <span class="text-white text-caption">{{ username }}</span>
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
        <router-link :to="{ name: 'Products' }" class="text-decoration-none text-body2 font-weight-medium text-dark">
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
            <v-list-item title="Lịch sử mua hàng" :to="{ name: 'Products' }" />
            <v-list-item title="Mũ Bóng Chày Nhân Vật" :to="{ name: 'Products' }" />
            <v-list-item title="Mũ Bóng Chày Espace" :to="{ name: 'Products' }" />
          </v-list>
        </v-menu>
        <router-link :to="{ name: 'Products' }" class="text-decoration-none text-body2 font-weight-medium"
          style="color: #FF6633;">
          🔥 Khuyến Mãi
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
const isLoggedIn = ref(false)
const username = ref('')
const userAvatar = ref('')

const checkAdminRole = async () => {
  // Lấy thông tin từ localStorage
  const userRole = localStorage.getItem('userRole')
  const accountId = localStorage.getItem('accountId')
  const storedUsername = localStorage.getItem('username')
  const token = localStorage.getItem('token')

  // Kiểm tra đã đăng nhập chưa
  if (token && accountId) {
    isLoggedIn.value = true
    username.value = storedUsername || ''

    // Gọi API để lấy avatar
    try {
      const res = await axios.get(`http://localhost:8080/api/account/getById/${accountId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const account = res.data.account || res.data

      if (account.images) {
        // Xử lý URL ảnh
        if (account.images.startsWith('http') || account.images.startsWith('data:image')) {
          userAvatar.value = account.images
        } else {
          userAvatar.value = `http://localhost:8080${account.images}`
        }
      } else {
        // Không có ảnh, để trống - sẽ dùng icon fallback
        userAvatar.value = ''
      }
    } catch (error) {
      console.error('Lỗi khi lấy avatar:', error)
      // Không có ảnh, để trống - sẽ dùng icon fallback
      userAvatar.value = ''
    }
  } else {
    isLoggedIn.value = false
    username.value = ''
    userAvatar.value = ''
  }

  // Kiểm tra admin role
  isAdmin.value = userRole === 'admin' || userRole === 'ADMIN'
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({ name: 'Products', query: { search: searchQuery.value } })
  }
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('accountId')
  localStorage.removeItem('userRole')
  localStorage.removeItem('username')

  isAdmin.value = false
  isLoggedIn.value = false
  username.value = ''
  userAvatar.value = ''
  router.push({ name: 'Login' })
}

onMounted(() => {
  checkAdminRole()
  window.addEventListener('auth-changed', checkAdminRole)
})

onBeforeUnmount(() => {
  window.removeEventListener('auth-changed', checkAdminRole)
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
