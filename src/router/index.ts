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


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {path: '/',  component: Index},
    {path: '/menu',  component: Menu},
    
    {path: '/products',  component: ProductList},
    {path: '/products/:id',  component: ProductDetail},
    
    {path: '/footer',     component: Footer},
  ],
})

export default router
