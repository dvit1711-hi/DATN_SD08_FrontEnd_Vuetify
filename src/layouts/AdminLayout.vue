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

                    <!-- NOTIFICATION BELL -->
                    <v-menu offset-y :close-on-content-click="false" max-width="400">
                        <template #activator="{ props }">
                            <div v-bind="props" class="notif-trigger">
                                <v-icon class="notif-bell-icon">mdi-bell-outline</v-icon>
                                <span v-if="totalUnread > 0" class="notif-trigger-badge">{{ totalUnread }}</span>
                            </div>
                        </template>

                        <div class="notif-panel">
                            <!-- Header -->
                            <div class="notif-panel-header">
                                <div class="d-flex align-center gap-2">
                                    <v-icon size="16" class="header-icon">mdi-bell-ring-outline</v-icon>
                                    <span class="header-title">Thông báo</span>
                                    <span v-if="totalUnread > 0" class="unread-chip">{{ totalUnread }} mới</span>
                                </div>
                                <button class="mark-all-btn" :disabled="totalUnread === 0" @click="markAllRead">
                                    <v-icon size="12">mdi-check-all</v-icon>
                                    Đánh dấu đã đọc
                                </button>
                            </div>

                            <!-- Tabs -->
                            <div class="notif-tab-bar">
                                <button v-for="tab in notifTabs" :key="tab.value"
                                    :class="['notif-tab', notifTab === tab.value && 'active']"
                                    @click="notifTab = tab.value">
                                    <v-icon v-if="tab.icon" size="12">{{ tab.icon }}</v-icon>
                                    {{ tab.label }}
                                    <span v-if="tab.count > 0"
                                        :class="['tab-badge', tab.value === 'stock' ? 'tab-badge--warn' : 'tab-badge--danger']">
                                        {{ tab.count }}
                                    </span>
                                </button>
                            </div>

                            <!-- List -->
                            <div class="notif-list">
                                <template v-if="filteredNotifs.length">
                                    <div v-for="n in filteredNotifs" :key="n.id"
                                        :class="['notif-item', isUnread(n) && 'notif-item--unread']"
                                        @click="handleNotifClick(n)">
                                        <div :class="['notif-icon-wrap', `notif-icon--${n.type}`]">
                                            <v-icon size="16">{{ n.icon }}</v-icon>
                                        </div>
                                        <div class="notif-content">
                                            <p class="notif-title">{{ n.title }}</p>
                                            <p class="notif-sub">{{ n.subtitle }}</p>
                                            <p class="notif-time">{{ n.time }}</p>
                                        </div>
                                        <div v-if="isUnread(n)" class="unread-dot" />
                                    </div>
                                </template>
                                <div v-else class="notif-empty">
                                    <v-icon size="32"
                                        style="color: rgba(201,169,130,0.2); margin-bottom:8px">mdi-bell-sleep-outline</v-icon>
                                    <p>Không có thông báo</p>
                                </div>
                            </div>

                            <!-- Footer -->
                            <div class="notif-panel-footer">
                                <button class="view-all-btn" @click="navigateToOrders">
                                    Xem tất cả đơn hàng
                                    <v-icon size="13">mdi-arrow-right</v-icon>
                                </button>
                            </div>
                        </div>
                    </v-menu>
                    <!-- END NOTIFICATION BELL -->

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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import { useAppSettings } from '@/composables/useAppSettings'
// @ts-ignore
import paymentApi from '@/api/paymentApi'
// @ts-ignore
import productApi from '@/api/productApi'

const router = useRouter()
const { t } = useI18n()

const {
    appTheme,
    toggleTheme,
} = useAppSettings()

// ─── Layout state ────────────────────────────────────────────────────────────
const drawer = ref(true)
const username = ref('')
const userAvatar = ref('')

// ─── Notification state ──────────────────────────────────────────────────────
interface NotifItem {
    id: string
    type: 'order' | 'review' | 'stock' | 'account' | 'return'
    title: string
    subtitle: string
    time: string
    route: string
    icon: string
    unread: boolean
}

const notifItems = ref<NotifItem[]>([])
const notifTab = ref('all')

// Lưu danh sách ID đã đọc vào localStorage
const readNotifIds = ref<Set<string>>(
    new Set(JSON.parse(localStorage.getItem('readNotifIds') || '[]'))
)

// Kept for backward compat
const newOrderCount = ref(0)
const outOfStockCount = ref(0)
const returnOrderCount = ref(0)
const reviewCount = ref(0)
const newAccountCount = ref(0)
const lowStockCount = ref(0)

// ─── Computed ────────────────────────────────────────────────────────────────
const isUnread = (n: NotifItem): boolean =>
    n.unread && !readNotifIds.value.has(n.id)

const totalUnread = computed(() =>
    notifItems.value.filter(n => isUnread(n)).length
)

const countByType = (type: string): number =>
    notifItems.value.filter(n => n.type === type && isUnread(n)).length

const filteredNotifs = computed(() =>
    notifTab.value === 'all'
        ? notifItems.value
        : notifItems.value.filter(n => n.type === notifTab.value)
)

const notifTabs = computed(() => [
    { value: 'all', label: 'Tất cả', icon: '', count: totalUnread.value },
    { value: 'order', label: 'Đơn hàng', icon: 'mdi-cart', count: countByType('order') },
    { value: 'review', label: 'Đánh giá', icon: 'mdi-star', count: countByType('review') },
    { value: 'stock', label: 'Tồn kho', icon: 'mdi-alert', count: countByType('stock') },
    { value: 'account', label: 'Tài khoản', icon: 'mdi-account-plus', count: countByType('account') },
    { value: 'return', label: 'Trả hàng', icon: 'mdi-keyboard-return', count: countByType('return') },
])

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatTimeAgo = (dateStr: string): string => {
    if (!dateStr) return 'Vừa xong'
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Vừa xong'
    if (mins < 60) return `${mins} phút trước`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} giờ trước`
    return `${Math.floor(hours / 24)} ngày trước`
}

// ─── Load user info ───────────────────────────────────────────────────────────
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
            headers: { Authorization: `Bearer ${token}` },
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

// ─── Load notifications ───────────────────────────────────────────────────────
const loadNotifications = async () => {
    try {
        const token = localStorage.getItem('token')
        const items: NotifItem[] = []

        // ── 1. Đơn hàng MỚI ─────────────────────────────────────────────────
        try {
            const ordersRes = await paymentApi.getAllOrders(token)
            const orders: any[] = ordersRes.data || []

            // ✅ Log để xem status thực tế — xóa sau khi fix xong
            console.log('[DEBUG] Order statuses:', [...new Set(orders.map((o: any) => o.status))])

            // Lọc đơn mới đặt trong 7 ngày gần đây
            const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
            const newOrders = orders.filter((o: any) => {
                const created = new Date(o.createdAt || o.orderDate || 0).getTime()
                return created > sevenDaysAgo
            })

            newOrderCount.value = newOrders.length

            newOrders.slice(0, 5).forEach((o: any) => {
                items.push({
                    id: `order-${o.id || o.orderId}`,
                    type: 'order',
                    title: `Đơn hàng mới #${o.id || o.orderId}`,
                    subtitle: `${o.customerName || o.receiverName || o.accountName || 'Khách hàng'} — ${Number(o.totalAmount || o.total || 0).toLocaleString('vi-VN')} ₫`,
                    time: formatTimeAgo(o.createdAt || o.orderDate),
                    route: 'AdminPayments',
                    icon: 'mdi-cart-plus',
                    unread: true,
                })
            })

            // Đơn trả hàng
            const returnOrders = orders.filter((o: any) => {
                const s = (o.status || '').toUpperCase()
                return s.includes('RETURN') || s.includes('TRẢ') || s.includes('HOÀN') || s === 'REFUND'
            })
            returnOrderCount.value = returnOrders.length
            returnOrders.slice(0, 3).forEach((o: any) => {
                items.push({
                    id: `return-${o.id || o.orderId}`,
                    type: 'return',
                    title: `Yêu cầu trả hàng #${o.id || o.orderId}`,
                    subtitle: o.returnReason || o.note || 'Khách yêu cầu trả hàng',
                    time: formatTimeAgo(o.updatedAt || o.createdAt),
                    route: 'AdminReturnOrder',
                    icon: 'mdi-keyboard-return',
                    unread: true,
                })
            })
        } catch (err) {
            console.error('[NOTIF] Lỗi tải đơn hàng:', err)
        }

        // ── 2. Tồn kho thấp ──────────────────────────────────────────────────
        try {
            const productsRes = await productApi.getAllCard('')
            const raw = productsRes.data
            const products: any[] = Array.isArray(raw)
                ? raw
                : raw?.content || raw?.data || []

            // ✅ Log để xem structure thực tế
            console.log('[DEBUG] Product sample:', products[0])

            // Tính tổng tồn kho: ưu tiên mảng productColors, fallback field trực tiếp
            const getQty = (p: any): number => {
                if (Array.isArray(p.productColors) && p.productColors.length > 0) {
                    return p.productColors.reduce((sum: number, pc: any) =>
                        sum + Number(pc.stockQuantity ?? pc.quantity ?? 0), 0)
                }
                if (Array.isArray(p.colors) && p.colors.length > 0) {
                    return p.colors.reduce((sum: number, pc: any) =>
                        sum + Number(pc.stockQuantity ?? pc.quantity ?? 0), 0)
                }
                return Number(p.stockQuantity ?? p.totalQuantity ?? p.quantity ?? p.stock ?? 0)
            }

            const LOW_THRESHOLD = 10  // ✅ ngưỡng cảnh báo, chỉnh tùy ý
            const outOfStock = products.filter(p => getQty(p) === 0)
            const lowStock = products.filter(p => getQty(p) > 0 && getQty(p) <= LOW_THRESHOLD)

            outOfStockCount.value = outOfStock.length
            lowStockCount.value = lowStock.length

                ;[...outOfStock.slice(0, 3), ...lowStock.slice(0, 4)].forEach((p: any) => {
                    const qty = getQty(p)
                    const isOut = qty === 0
                    const name = p.productName || p.name || p.tenSanPham || `SP#${p.id}`
                    items.push({
                        id: `stock-${p.id}`,
                        type: 'stock',
                        title: isOut ? `Hết hàng: ${name}` : `Sắp hết: ${name}`,
                        subtitle: isOut
                            ? 'Còn 0 sản phẩm — cần nhập hàng ngay'
                            : `Còn ${qty} sản phẩm — cần nhập thêm`,
                        time: 'Vừa cập nhật',
                        route: 'AdminProducts',
                        icon: isOut ? 'mdi-package-variant-closed' : 'mdi-alert-circle-outline',
                        unread: true,
                    })
                })
        } catch (err) {
            console.error('[NOTIF] Lỗi tải sản phẩm:', err)
        }

        // ── 3. Đánh giá MỚI (trong 7 ngày) ──────────────────────────────────
        try {
            let reviews: any[] = []
            // Thử lần lượt các endpoint
            for (const url of [
                'http://localhost:8080/api/review',
                'http://localhost:8080/api/reviews',
                'http://localhost:8080/api/product/reviews',
            ]) {
                try {
                    const res = await axios.get(url, {
                        headers: { Authorization: `Bearer ${token}` },
                        params: { page: 0, size: 20, sort: 'createdAt,desc' },
                    })
                    const data = res.data?.content || res.data?.data || res.data || []
                    if (Array.isArray(data) && data.length > 0) {
                        reviews = data
                        console.log('[DEBUG] Review endpoint OK:', url, 'sample:', data[0])
                        break
                    }
                } catch { /* thử endpoint tiếp theo */ }
            }

            // Chỉ lấy đánh giá trong 7 ngày gần đây
            const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
            const newReviews = reviews.filter((r: any) => {
                const created = new Date(r.createdAt || r.ngayTao || 0).getTime()
                return created > sevenDaysAgo
            })

            reviewCount.value = newReviews.length

            newReviews.slice(0, 4).forEach((r: any) => {
                const rating = Number(r.rating || r.star || r.score || 0)
                const stars = '★'.repeat(Math.min(5, rating)) + '☆'.repeat(Math.max(0, 5 - rating))
                const comment = r.comment || r.content || r.noiDung || ''
                const snippet = comment.slice(0, 45)
                const productName = r.productName || r.product?.name || r.tenSanPham || 'Sản phẩm'
                items.push({
                    id: `review-${r.id || r.reviewId}`,
                    type: 'review',
                    title: `Đánh giá mới: ${productName}`,
                    subtitle: `${stars}  "${snippet}${snippet.length === 45 ? '…' : ''}"`,
                    time: formatTimeAgo(r.createdAt || r.ngayTao),
                    route: 'AdminProducts',
                    icon: 'mdi-star-outline',
                    unread: true,
                })
            })
        } catch (err) {
            reviewCount.value = 0
        }

        // ── 4. Tài khoản MỚI đăng ký (trong 24h) ────────────────────────────
        try {
            let allAccounts: any[] = []
            for (const url of [
                'http://localhost:8080/api/account/getAll',
                'http://localhost:8080/api/account',
                'http://localhost:8080/api/accounts',
            ]) {
                try {
                    const res = await axios.get(url, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                    const data = res.data?.content || res.data?.data || res.data || []
                    if (Array.isArray(data) && data.length > 0) {
                        allAccounts = data
                        console.log('[DEBUG] Account endpoint OK:', url)
                        break
                    }
                } catch { /* thử endpoint tiếp theo */ }
            }

            // Lấy tài khoản đăng ký trong 24h
            const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
            const newAccounts = allAccounts.filter((a: any) => {
                const created = new Date(a.createdAt || a.ngayTao || a.registeredAt || 0).getTime()
                return created > oneDayAgo
            })

            newAccountCount.value = newAccounts.length

            newAccounts.slice(0, 3).forEach((a: any) => {
                items.push({
                    id: `account-${a.id || a.accountId}`,
                    type: 'account',
                    title: 'Tài khoản mới đăng ký',
                    subtitle: `${a.email || a.username || 'Người dùng'} — vừa đăng ký`,
                    time: formatTimeAgo(a.createdAt || a.ngayTao),
                    route: 'AdminAccounts',
                    icon: 'mdi-account-plus-outline',
                    unread: true,
                })
            })

            console.log('[DEBUG] New accounts (24h):', newAccounts.length)
        } catch (err) {
            newAccountCount.value = 0
        }

        // ── Sắp xếp: unread lên đầu, sau đó theo thời gian ───────────────────
        notifItems.value = items.sort((a, b) => {
            if (isUnread(a) !== isUnread(b)) return isUnread(b) ? 1 : -1
            return 0
        })

        console.log('[NOTIF] Tổng:', items.length, '| Đơn:', newOrderCount.value,
            '| Tồn kho:', outOfStockCount.value + lowStockCount.value,
            '| Review:', reviewCount.value, '| Tài khoản:', newAccountCount.value)

    } catch (error) {
        console.error('[NOTIF] Lỗi chung:', error)
    }
}

// ─── Notification actions ─────────────────────────────────────────────────────
const handleNotifClick = (n: NotifItem) => {
    markAsRead(n.id)
    router.push({ name: n.route })
}

const markAsRead = (id: string) => {
    readNotifIds.value.add(id)
    localStorage.setItem('readNotifIds', JSON.stringify([...readNotifIds.value]))
}

const markAllRead = () => {
    notifItems.value.forEach(n => readNotifIds.value.add(n.id))
    localStorage.setItem('readNotifIds', JSON.stringify([...readNotifIds.value]))
    readNotifIds.value = new Set(readNotifIds.value)
}

// ─── Navigation helpers ───────────────────────────────────────────────────────
const navigateToOrders = () => router.push({ name: 'AdminPayments' })
const navigateToProducts = () => router.push({ name: 'AdminProducts' })
const navigateToReturns = () => router.push({ name: 'AdminReturnOrder' })

// ─── Logout ───────────────────────────────────────────────────────────────────
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

// ─── Polling ──────────────────────────────────────────────────────────────────
let pollingTimer: ReturnType<typeof setInterval> | null = null

const startPolling = () => {
    pollingTimer = setInterval(() => {
        loadNotifications()
    }, 30000)
}

const stopPolling = () => {
    if (pollingTimer) {
        clearInterval(pollingTimer)
        pollingTimer = null
    }
}

const handleVisibilityChange = () => {
    if (document.hidden) {
        stopPolling()
    } else {
        loadNotifications()
        startPolling()
    }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
    loadUserInfo()
    loadNotifications()
    startPolling()
    document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
    stopPolling()
    document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
/* ── CSS Variables ──────────────────────────────────────────────────────────── */
:root {
    --gold: #C9A982;
    --gold-dim: rgba(201, 169, 130, 0.08);
    --gold-dim-hover: rgba(201, 169, 130, 0.13);
    --gold-border: rgba(201, 169, 130, 0.15);
}

/* ── Logo / Layout ──────────────────────────────────────────────────────────── */
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

.page-content {
    flex: 1;
    min-width: 0;
    background-color: rgb(var(--v-theme-background));
    color: rgb(var(--v-theme-on-background));
}

.w-100 {
    width: 100%;
}

/* ── Sidebar nav ────────────────────────────────────────────────────────────── */
:deep(.v-list-item__content) {
    color: #C9A982 !important;
}

:deep(.v-list-item) {
    color: #C9A982 !important;
}

:deep(.v-list-item:hover) {
    background-color: rgba(201, 169, 130, 0.1) !important;
}

:deep(.v-list-item-title) {
    color: #C9A982 !important;
}

:deep(.v-icon) {
    color: #C9A982 !important;
}

/* ── Notification bell trigger ───────────────────────────────────────────────  */
.notif-trigger {
    position: relative;
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 10px;
    background: rgba(201, 169, 130, 0.06);
    border: 1px solid var(--gold-border);
    transition: background 0.2s;
}

.notif-trigger:hover {
    background: var(--gold-dim-hover);
}

.notif-bell-icon {
    color: #C9A982 !important;
    font-size: 20px !important;
}

.notif-trigger-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    min-width: 18px;
    height: 18px;
    background: #E53E3E;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    border: 2px solid rgb(var(--v-theme-surface));
    box-shadow: 0 2px 8px rgba(229, 62, 62, 0.5);
    line-height: 1;
}

/* ── Notification panel ──────────────────────────────────────────────────────  */
.notif-panel {
    width: 400px;
    background: rgb(var(--v-theme-surface));
    border: 1px solid var(--gold-border);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18), 0 0 0 0.5px rgba(201, 169, 130, 0.08) inset;
}

/* Header */
.notif-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px 12px;
    background: linear-gradient(180deg, rgba(201, 169, 130, 0.06) 0%, transparent 100%);
    border-bottom: 1px solid var(--gold-border);
}

.header-icon {
    color: var(--gold) !important;
}

.header-title {
    font-size: 13.5px;
    font-weight: 650;
    color: var(--gold);
    letter-spacing: 0.015em;
}

.unread-chip {
    font-size: 10px;
    font-weight: 700;
    background: rgba(229, 62, 62, 0.15);
    color: #FC8181;
    padding: 2px 8px;
    border-radius: 20px;
    border: 1px solid rgba(229, 62, 62, 0.25);
    letter-spacing: 0.04em;
}

.mark-all-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: 1px solid var(--gold-border);
    border-radius: 8px;
    padding: 5px 11px;
    font-size: 11px;
    font-weight: 500;
    color: rgba(201, 169, 130, 0.55);
    cursor: pointer;
    transition: all 0.18s;
    font-family: inherit;
}

.mark-all-btn:hover:not(:disabled) {
    background: var(--gold-dim);
    color: var(--gold);
    border-color: rgba(201, 169, 130, 0.3);
}

.mark-all-btn:disabled {
    opacity: 0.25;
    cursor: not-allowed;
}

/* Tab bar */
.notif-tab-bar {
    display: flex;
    gap: 3px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--gold-border);
    background: rgba(var(--v-theme-on-surface), 0.03);
    overflow-x: auto;
    scrollbar-width: none;
}

.notif-tab-bar::-webkit-scrollbar {
    display: none;
}

.notif-tab {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 5px 10px;
    border-radius: 8px;
    border: 1px solid transparent;
    background: none;
    font-size: 11px;
    font-weight: 500;
    color: rgba(201, 169, 130, 0.4);
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
    font-family: inherit;
}

.notif-tab:hover {
    background: var(--gold-dim);
    color: rgba(201, 169, 130, 0.75);
}

.notif-tab.active {
    background: rgba(201, 169, 130, 0.12);
    color: var(--gold);
    border-color: rgba(201, 169, 130, 0.25);
}

.tab-badge {
    font-size: 9.5px;
    font-weight: 700;
    min-width: 15px;
    height: 15px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
}

.tab-badge--danger {
    background: rgba(229, 62, 62, 0.18);
    color: #FC8181;
}

.tab-badge--warn {
    background: rgba(237, 137, 54, 0.18);
    color: #F6AD55;
}

/* Notification list */
.notif-list {
    max-height: 340px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(201, 169, 130, 0.15) transparent;
}

.notif-list::-webkit-scrollbar {
    width: 3px;
}

.notif-list::-webkit-scrollbar-thumb {
    background: rgba(201, 169, 130, 0.2);
    border-radius: 4px;
}

/* Notification item */
.notif-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 18px;
    cursor: pointer;
    transition: background 0.15s;
    border-bottom: 1px solid rgba(201, 169, 130, 0.06);
    position: relative;
}

.notif-item:last-child {
    border-bottom: none;
}

.notif-item:hover {
    background: rgba(201, 169, 130, 0.05);
}

.notif-item--unread {
    background: rgba(201, 169, 130, 0.04);
}

.notif-item--unread:hover {
    background: rgba(201, 169, 130, 0.08);
}

/* Icon wrap per type */
.notif-icon-wrap {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
}

.notif-icon--order {
    background: rgba(66, 153, 225, 0.12);
    border: 1px solid rgba(66, 153, 225, 0.2);
}

.notif-icon--review {
    background: rgba(72, 187, 120, 0.12);
    border: 1px solid rgba(72, 187, 120, 0.2);
}

.notif-icon--stock {
    background: rgba(237, 137, 54, 0.12);
    border: 1px solid rgba(237, 137, 54, 0.2);
}

.notif-icon--account {
    background: rgba(159, 122, 234, 0.12);
    border: 1px solid rgba(159, 122, 234, 0.2);
}

.notif-icon--return {
    background: rgba(252, 129, 129, 0.12);
    border: 1px solid rgba(252, 129, 129, 0.2);
}

.notif-icon--order :deep(.v-icon) {
    color: #63B3ED !important;
}

.notif-icon--review :deep(.v-icon) {
    color: #68D391 !important;
}

.notif-icon--stock :deep(.v-icon) {
    color: #F6AD55 !important;
}

.notif-icon--account :deep(.v-icon) {
    color: #B794F4 !important;
}

.notif-icon--return :deep(.v-icon) {
    color: #FC8181 !important;
}

/* Text */
.notif-content {
    flex: 1;
    min-width: 0;
}

.notif-title {
    font-size: 12.5px;
    font-weight: 600;
    color: rgba(201, 169, 130, 0.92);
    margin: 0 0 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.notif-sub {
    font-size: 11.5px;
    color: rgba(201, 169, 130, 0.5);
    margin: 0 0 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.notif-time {
    font-size: 10.5px;
    color: rgba(201, 169, 130, 0.28);
    margin: 0;
}

/* Unread dot */
.unread-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #E53E3E;
    flex-shrink: 0;
    margin-top: 5px;
    box-shadow: 0 0 6px rgba(229, 62, 62, 0.5);
}

/* Empty state */
.notif-empty {
    padding: 40px 16px;
    text-align: center;
    color: rgba(201, 169, 130, 0.25);
    font-size: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.notif-empty p {
    margin: 0;
}

/* Footer */
.notif-panel-footer {
    padding: 10px 16px;
    border-top: 1px solid var(--gold-border);
    background: rgba(var(--v-theme-on-surface), 0.02);
}

.view-all-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    background: rgba(201, 169, 130, 0.06);
    border: 1px solid var(--gold-border);
    border-radius: 9px;
    padding: 9px 16px;
    font-size: 12px;
    font-weight: 500;
    color: rgba(201, 169, 130, 0.55);
    cursor: pointer;
    transition: all 0.18s;
    font-family: inherit;
    letter-spacing: 0.03em;
}

.view-all-btn:hover {
    background: var(--gold-dim-hover);
    color: var(--gold);
    border-color: rgba(201, 169, 130, 0.3);
}
</style>