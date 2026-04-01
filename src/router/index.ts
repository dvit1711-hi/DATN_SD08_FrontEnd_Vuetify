/**
 * router/index.ts
 *
 * Manual routes for ./src/pages/*.vue
 */

import { createRouter, createWebHistory } from 'vue-router'
import UserLayout from '@/layouts/UserLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
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
import DiscountManager from '@/pages/admin/discountManager.vue'
import Statistics from '@/pages/admin/Statistics.vue'
import Review from '@/pages/Review.vue'
import Home from '@/pages/Home.vue'
import PurchaseHistory from '@/pages/PurchaseHistory.vue'
import PaymentManager from '@/pages/admin/PaymentManager.vue'
import ForgotPassword from '@/pages/ForgotPassword.vue'

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
      children: [
        { path: '', component: AdminProduct, name: 'AdminDashboard' },
        { path: 'products', component: AdminProduct, name: 'AdminProducts' },
        { path: 'products/detail/:id', name: 'AdminProductDetail', component: AdminProductDetail, props: true },
        { path: 'accounts', component: AccountList, name: 'AdminAccounts' },
        { path: 'accounts/detail/:id', component: AccountDetail, name: 'AccountDetail' },
        { path: 'accounts/edit/:id', component: AccountEdit, name: 'AccountEdit' },
        { path: 'discounts', component: DiscountManager, name: 'DiscountManager' },
        { path: 'statistics', component: Statistics, name: 'Statistics' },
        { path: 'payments', component: PaymentManager, name: 'AdminPayments' },
      ],
    },

    { path: '/menu', component: Menu, name: 'Menu' },
    { path: '/footer', component: Footer, name: 'Footer' },
  ],
})

export default router