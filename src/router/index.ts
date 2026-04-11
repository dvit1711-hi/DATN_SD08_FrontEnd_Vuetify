import { createRouter, createWebHistory } from 'vue-router'
import UserLayout from '@/layouts/UserLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import StaffLayout from '@/layouts/StaffLayout.vue'
import Menu from '@/pages/menu.vue'
import Login from '@/pages/Login.vue'
import ProductList from '@/pages/ProductList.vue'
import Footer from '@/layouts/components/Footer.vue'
import ProductDetail from '@/pages/ProductDetail.vue'
import AdminProduct from '@/pages/admin/AdminProduct.vue'
import AccountSecurity from '@/pages/AccountSecurity.vue'
import AccountSetting from '@/pages/accountSetting.vue'
import Register from '@/pages/Register.vue'
import AccountList from '@/pages/admin/AccountList.vue'
import AdminProductDetail from '@/pages/admin/AdminProductDetail.vue'
import AccountEdit from '@/pages/admin/accountEdit.vue'
import AccountDetail from '@/pages/admin/accountDetail.vue'
import DiscountManager from '@/pages/admin/DiscountManager.vue'
import DiscountProduct from '@/pages/admin/DiscountProduct.vue'
import Statistics from '@/pages/admin/Statistics.vue'
import Review from '@/pages/Review.vue'
import Home from '@/pages/Home.vue'
import PurchaseHistory from '@/pages/PurchaseHistory.vue'
import PaymentManager from '@/pages/admin/PaymentManager.vue'
import ForgotPassword from '@/pages/ForgotPassword.vue'
import AdminBrandMetarial from '@/pages/admin/AdminBrandMetarial.vue'
import AdminColorSize from '@/pages/admin/AdminColorSize.vue'
import AddStaffAccount from '@/pages/admin/AddStaffAccount.vue'
import PosSale from '@/pages/admin/PosSale.vue'
import Promotion from '@/pages/Promotion.vue'

function getRoles(): string[] {
  const roles = localStorage.getItem('roles')
  const userRole = localStorage.getItem('userRole')

  if (roles) {
    try {
      const parsed = JSON.parse(roles)
      if (Array.isArray(parsed)) return parsed
    } catch {
      return roles.split(',').map(r => r.trim())
    }
  }

  if (userRole) {
    return [userRole]
  }

  return []
}

function hasRole(role: string) {
  return getRoles().includes(role)
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: UserLayout,
      children: [
        { path: '', component: Home, name: 'Home' },
        { path: 'products', component: ProductList, name: 'ProductList' },
        { path: 'review', component: Review, name: 'Review' },
        { path: 'products/:id', component: ProductDetail, name: 'ProductDetail' },
        { path: 'promotion', component: Promotion, name: 'Promotion' },
        { path: 'cart', component: () => import('@/pages/Cart.vue'), name: 'Cart' },
        { path: 'checkout', component: () => import('@/pages/Checkout.vue'), name: 'Checkout' },
        { path: 'purchase-history', component: PurchaseHistory, name: 'PurchaseHistory' },
        { path: 'account-security', component: AccountSecurity, name: 'AccountSecurity' },
        { path: 'account-setting', component: AccountSetting, name: 'AccountSetting' },
      ],
    },

    { path: '/login', component: Login, name: 'Login' },
    { path: '/register', component: Register, name: 'Register' },
    { path: '/forgot-password', component: ForgotPassword, name: 'ForgotPassword' },

    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true, roles: ['ROLE_ADMIN'] },
      children: [
        { path: '', component: AdminProduct, name: 'AdminDashboard', meta: { requiresAuth: true, roles: ['ROLE_ADMIN'] } },
        { path: 'products', component: AdminProduct, name: 'AdminProducts', meta: { requiresAuth: true, roles: ['ROLE_ADMIN'] } },
        { path: 'products/detail/:id', name: 'AdminProductDetail', component: AdminProductDetail, props: true, meta: { requiresAuth: true, roles: ['ROLE_ADMIN'] } },

        { path: 'accounts', component: AccountList, name: 'AdminAccounts', meta: { requiresAuth: true, roles: ['ROLE_ADMIN'] } },
        { path: 'accounts/staff/add', component: AddStaffAccount, name: 'AddStaffAccount', meta: { requiresAuth: true, roles: ['ROLE_ADMIN'] } },
        { path: 'accounts/detail/:id', component: AccountDetail, name: 'AccountDetail', meta: { requiresAuth: true, roles: ['ROLE_ADMIN'] } },
        { path: 'accounts/edit/:id', component: AccountEdit, name: 'AccountEdit', meta: { requiresAuth: true, roles: ['ROLE_ADMIN'] } },
        { path: 'discounts', component: DiscountManager, name: 'DiscountManager', meta: { requiresAuth: true, roles: ['ROLE_ADMIN'] } },
        { path: 'product-discounts', component: DiscountProduct, name: 'DiscountProduct', meta: { requiresAuth: true, roles: ['ROLE_ADMIN'] } },
        { path: 'statistics', component: Statistics, name: 'Statistics', meta: { requiresAuth: true, roles: ['ROLE_ADMIN'] } },
        { path: 'payments', component: PaymentManager, name: 'AdminPayments', meta: { requiresAuth: true, roles: ['ROLE_ADMIN'] } },
        { path: 'discounts', component: DiscountManager, name: 'DiscountManager' },
        { path: 'statistics', component: Statistics, name: 'Statistics' },
        { path: 'payments', component: PaymentManager, name: 'AdminPayments' },
        { path: 'brand-material', component: AdminBrandMetarial, name: 'AdminBrandMaterial' },
        { path: 'color-size', component: AdminColorSize, name: 'AdminColorSize' },
        {
      path: 'pos',
      component: PosSale,
      name: 'AdminPosSale',
      meta: { requiresAuth: true, roles: ['ROLE_ADMIN'] }
    },
      ],
    },

    {
      path: '/staff',
      component: StaffLayout,
      meta: { requiresAuth: true, roles: ['ROLE_STAFF'] },
      children: [
        { path: '', redirect: { name: 'StaffPosSale' } },
        { path: 'pos', component: PosSale, name: 'StaffPosSale', meta: { requiresAuth: true, roles: ['ROLE_STAFF' , 'ROLE_ADMIN'] } },
      ],
    },

    { path: '/menu', component: Menu, name: 'Menu' },
    { path: '/footer', component: Footer, name: 'Footer' },
  ],
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const roles = getRoles()

  if (to.meta.requiresAuth && !token) {
    return next({ name: 'Login' })
  }

  // đã đăng nhập mà vào login/register thì đẩy đúng trang
  if ((to.name === 'Login' || to.name === 'Register') && token) {
    if (roles.includes('ROLE_ADMIN')) {
      return next({ name: 'AdminDashboard' })
    }
    if (roles.includes('ROLE_STAFF')) {
      return next({ name: 'StaffPosSale' })
    }
    return next({ name: 'Home' })
  }

  const allowedRoles = to.meta.roles as string[] | undefined
  if (allowedRoles && allowedRoles.length > 0) {
    const ok = allowedRoles.some(role => roles.includes(role))
    if (!ok) {
      if (hasRole('ROLE_STAFF')) {
        return next({ name: 'StaffPosSale' })
      }
      if (hasRole('ROLE_ADMIN')) {
        return next({ name: 'AdminDashboard' })
      }
      return next({ name: 'Home' })
    }
  }

  if (to.path.startsWith('/admin') && hasRole('ROLE_STAFF')) {
    return next({ name: 'StaffPosSale' })
  }

  if (to.path.startsWith('/staff') && hasRole('ROLE_ADMIN')) {
    return next({ name: 'AdminDashboard' })
  }

  next()
})

export default router