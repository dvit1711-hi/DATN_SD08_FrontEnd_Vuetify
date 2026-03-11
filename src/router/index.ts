/**
 * router/index.ts
 *
 * Manual routes for ./src/pages/*.vue
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router'
import Index from '@/pages/index.vue'
import Menu from '@/pages/menu.vue'
import ProductList from '@/pages/ProductList.vue'
import Footer from '@/layouts/components/Footer.vue'
import ProductDetail from '@/pages/ProductDetail.vue'
import AdminProduct from '@/pages/admin/AdminProduct.vue'
import AccountSecurity from '@/pages/AccountSecurity.vue'
import AccountSetting from '@/pages/accountSetting.vue'
import Login from '@/pages/Login.vue'
import Register from '@/pages/Register.vue'
import AccountList from '@/pages/admin/AccountList.vue'
import AdminProductDetail from '@/pages/admin/AdminProductDetail.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // {path: '/',  component: Index},
    {path: '/menu',  component: Menu},
    
    {path: '/',  component: ProductList,},
    {path: '/footer',  component: Footer,},
    
    {path: '/products/:id',  component: ProductDetail},
    {path: '/products/list', component: AdminProduct},
    {path: '/products/list/:id', name: 'AdminProductDetail', component: AdminProductDetail, props: true },

    
    {path: '/accountSecurity', component: AccountSecurity},
    {path: '/account', component: AccountSetting},
    {path: '/login', component: Login},
    {path: '/register', component: Register},
    {path: '/accountList', component: AccountList},
    {path: '/footer',     component: Footer},
  ],
})
export default router
