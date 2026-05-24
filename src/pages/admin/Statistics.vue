<template>
    <v-container fluid class="stats-page pa-6">

        <!-- ── Header ── -->
        <div class="page-header mb-6">
            <div>
                <div class="page-eyebrow">Dashboard</div>
                <h1 class="page-title">Thống kê tổng quan</h1>
                <p class="page-subtitle">Báo cáo toàn diện: tài khoản, đơn hàng, sản phẩm, khách hàng, thanh toán, đánh
                    giá.</p>
            </div>
            <v-btn color="primary" variant="elevated" prepend-icon="mdi-download-outline" class="export-btn"
                @click="exportStats" :loading="exporting">
                Xuất báo cáo
            </v-btn>
        </div>

        <!-- ── Bộ lọc thời gian ── -->
        <v-card rounded="xl" elevation="0" class="filter-bar mb-6">
            <div class="filter-inner">
                <!-- Quick tabs -->
                <div class="filter-tabs">
                    <button v-for="tab in timeTabs" :key="tab.value" class="filter-tab"
                        :class="{ active: activeTab === tab.value }" @click="selectTab(tab.value)">
                        <v-icon size="14" class="mr-1">{{ tab.icon }}</v-icon>
                        {{ tab.label }}
                    </button>
                </div>

                <!-- Custom range -->
                <transition name="slide-fade">
                    <div v-if="activeTab === 'custom'" class="custom-range">
                        <v-text-field v-model="customFrom" type="date" label="Từ ngày" variant="outlined"
                            density="compact" rounded="lg" hide-details class="date-field" :max="customTo || today" />
                        <span class="range-sep">→</span>
                        <v-text-field v-model="customTo" type="date" label="Đến ngày" variant="outlined"
                            density="compact" rounded="lg" hide-details class="date-field" :min="customFrom"
                            :max="today" />
                        <v-btn color="primary" variant="elevated" rounded="lg" size="small"
                            :disabled="!customFrom || !customTo" :loading="loading" @click="applyCustomRange">
                            Áp dụng
                        </v-btn>
                    </div>
                </transition>

                <!-- Period label -->
                <div class="filter-period-label">
                    <v-icon size="14" color="primary" class="mr-1">mdi-calendar-check-outline</v-icon>
                    {{ periodLabel }}
                </div>
            </div>
        </v-card>

        <!-- ── Skeleton ── -->
        <template v-if="loading">
            <v-row class="mb-6" dense>
                <v-col cols="12" sm="6" md="3" v-for="i in 4" :key="i">
                    <v-card rounded="xl" elevation="0" class="dashboard-card pa-5">
                        <v-skeleton-loader type="text" class="mb-3" />
                        <v-skeleton-loader type="heading" />
                    </v-card>
                </v-col>
            </v-row>
            <v-card rounded="xl" elevation="0" class="dashboard-card mb-6">
                <v-skeleton-loader type="image" height="300" />
            </v-card>
            <v-row dense>
                <v-col cols="12" md="7"><v-card rounded="xl" elevation="0" class="dashboard-card"><v-skeleton-loader
                            type="image" height="240" /></v-card></v-col>
                <v-col cols="12" md="5"><v-card rounded="xl" elevation="0" class="dashboard-card"><v-skeleton-loader
                            type="image" height="240" /></v-card></v-col>
            </v-row>
        </template>

        <template v-else>
            <!-- ── Overview cards ── -->
            <v-row class="mb-6" dense>
                <v-col cols="12" sm="6" md="3" v-for="item in overviewCards" :key="item.title">
                    <v-card rounded="xl" elevation="0" class="dashboard-card summary-card">
                        <div class="summary-icon-wrap" :style="{ background: item.iconBg }">
                            <v-icon :color="item.iconColor" size="22">{{ item.icon }}</v-icon>
                        </div>
                        <div class="summary-label">{{ item.title }}</div>
                        <div class="summary-value">{{ item.value }}</div>
                        <div class="summary-period">
                            <v-icon size="12" color="primary" class="mr-1">mdi-calendar-clock-outline</v-icon>
                            {{ periodLabel }}
                        </div>
                    </v-card>
                </v-col>
            </v-row>

            <!-- ── Trend chart ── -->
            <v-card rounded="xl" elevation="0" class="dashboard-card mb-6">
                <div class="section-header mb-4">
                    <div>
                        <h3 class="section-title">Trend đơn hàng</h3>
                        <p class="section-subtitle">Số lượng đơn hàng và xu hướng biến động — {{ periodLabel }}</p>
                    </div>
                    <v-btn-toggle v-model="chartGranularity" density="comfortable" rounded="lg" variant="outlined"
                        color="primary" class="range-toggle">
                        <v-btn value="day" size="small">Ngày</v-btn>
                        <v-btn value="month" size="small">Tháng</v-btn>
                    </v-btn-toggle>
                </div>
                <div class="chart-wrap">
                    <ApexCharts type="line" height="300" :options="trendOptions" :series="trendSeries" />
                </div>
            </v-card>

            <!-- ── Đơn hàng + Thanh toán ── -->
            <v-row class="mb-6" dense>
                <v-col cols="12" md="7">
                    <v-card rounded="xl" elevation="0" class="dashboard-card h-100">
                        <div class="section-header mb-4">
                            <div>
                                <h3 class="section-title">Đơn hàng</h3>
                                <p class="section-subtitle">Trạng thái, số lượng và giá trị đơn</p>
                            </div>
                        </div>
                        <v-row dense>
                            <v-col cols="12" md="6">
                                <div class="inner-box">
                                    <div class="inner-title">Đơn theo trạng thái</div>
                                    <ApexCharts type="donut" height="200" :options="orderStatusChartOptions"
                                        :series="orderStatusSeries" />
                                </div>
                            </v-col>
                            <v-col cols="12" md="6">
                                <div class="inner-box">
                                    <div class="inner-title">Giá trị trung bình / đơn</div>
                                    <div class="metric-value">{{ formatCurrency(stats.averageOrderValue) }}</div>
                                    <div class="divider-line my-3"></div>
                                    <div class="inner-title">Đơn gần nhất</div>
                                    <div class="table-wrap mt-2">
                                        <v-table density="compact" class="custom-table">
                                            <thead>
                                                <tr>
                                                    <th>Ngày</th>
                                                    <th class="text-right">Đơn</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="(c, date) in recentOrdersByDay" :key="date">
                                                    <td>{{ date }}</td>
                                                    <td class="text-right">
                                                        <v-chip size="x-small" color="primary" variant="tonal">{{ c
                                                        }}</v-chip>
                                                    </td>
                                                </tr>
                                                <tr v-if="!Object.keys(recentOrdersByDay).length">
                                                    <td colspan="2" class="text-center text-medium-emphasis py-3">Chưa
                                                        có dữ liệu</td>
                                                </tr>
                                            </tbody>
                                        </v-table>
                                    </div>
                                </div>
                            </v-col>
                        </v-row>
                    </v-card>
                </v-col>

                <v-col cols="12" md="5">
                    <v-card rounded="xl" elevation="0" class="dashboard-card h-100">
                        <div class="section-header mb-4">
                            <div>
                                <h3 class="section-title">Thanh toán</h3>
                                <p class="section-subtitle">Phương thức & trạng thái</p>
                            </div>
                        </div>
                        <div class="inner-box mb-3">
                            <div class="inner-title">Phương thức thanh toán</div>
                            <ApexCharts type="bar" height="150" :options="paymentMethodChartOptions"
                                :series="paymentMethodSeries" />
                        </div>
                        <div class="inner-box">
                            <div class="inner-title">Tổng đã thu</div>
                            <div class="metric-value">{{ formatCurrency(stats.totalPaidAmount || 0) }}</div>
                            <div class="divider-line my-3"></div>
                            <div class="d-flex flex-wrap gap-2 mt-1">
                                <v-chip v-for="(count, status) in stats.paymentStatusCounts || {}" :key="status"
                                    size="small" :color="paymentStatusColor(status)" variant="tonal">
                                    {{ translatePaymentStatus(status) }}: {{ count }}
                                </v-chip>
                            </div>
                        </div>
                    </v-card>
                </v-col>
            </v-row>

            <!-- ── Sản phẩm ── -->
            <v-card rounded="xl" elevation="0" class="dashboard-card mb-6">
                <div class="section-header mb-4">
                    <div>
                        <h3 class="section-title">Sản phẩm</h3>
                        <p class="section-subtitle">Hiệu suất bán hàng và tình trạng tồn kho</p>
                    </div>
                </div>
                <v-row dense>
                    <v-col cols="12" md="5">
                        <div class="inner-box">
                            <div class="inner-title">Top sản phẩm & brand bán chạy</div>
                            <ApexCharts type="bar" height="220" :options="topProductsChartOptions"
                                :series="topProductsSeries" />
                        </div>
                    </v-col>
                    <v-col cols="12" md="3">
                        <div class="inner-box h-100">
                            <div class="inner-title">Tồn kho theo màu</div>
                            <v-list density="compact" class="clean-list">
                                <v-list-item v-for="c in stats.inventoryByColor || []" :key="c.colorName" class="px-0">
                                    <template #prepend>
                                        <div class="color-dot mr-2" :style="{ background: colorHex(c.colorName) }">
                                        </div>
                                    </template>
                                    <v-list-item-title class="text-body-2">{{ c.colorName }}</v-list-item-title>
                                    <template #append>
                                        <v-chip size="x-small" color="indigo" variant="tonal">{{ c.stockQuantity
                                        }}</v-chip>
                                    </template>
                                </v-list-item>
                                <v-list-item v-if="!stats.inventoryByColor?.length" class="px-0">
                                    <v-list-item-title class="text-medium-emphasis">Chưa có dữ liệu</v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </div>
                    </v-col>
                    <v-col cols="12" md="4">
                        <div class="inner-box h-100">
                            <div class="inner-title d-flex align-center gap-2">
                                Sản phẩm sắp hết hàng
                                <v-chip size="x-small" color="error" variant="tonal">{{ stats.lowStockProducts?.length
                                    || 0 }}</v-chip>
                            </div>
                            <div class="table-wrap mt-2">
                                <v-table density="compact" class="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Sản phẩm</th>
                                            <th>Màu</th>
                                            <th class="text-right">Tồn</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="x in stats.lowStockProducts || []"
                                            :key="x.productName + x.colorName">
                                            <td class="text-truncate" style="max-width:120px">{{ x.productName }}</td>
                                            <td>{{ x.colorName }}</td>
                                            <td class="text-right">
                                                <v-chip size="x-small"
                                                    :color="x.stockQuantity <= 5 ? 'error' : 'warning'"
                                                    variant="tonal">{{ x.stockQuantity }}</v-chip>
                                            </td>
                                        </tr>
                                        <tr v-if="!stats.lowStockProducts?.length">
                                            <td colspan="3" class="text-center text-medium-emphasis py-4">Tồn kho ổn
                                                định</td>
                                        </tr>
                                    </tbody>
                                </v-table>
                            </div>
                        </div>
                    </v-col>
                </v-row>
            </v-card>

            <!-- ── Khách hàng + Đánh giá ── -->
            <v-row class="mb-6" dense>
                <v-col cols="12" md="5">
                    <v-card rounded="xl" elevation="0" class="dashboard-card h-100">
                        <div class="section-header mb-4">
                            <div>
                                <h3 class="section-title">Khách hàng</h3>
                                <p class="section-subtitle">Thói quen mua hàng và trạng thái tài khoản</p>
                            </div>
                        </div>
                        <div class="inner-box mb-3">
                            <div class="inner-title">Khách hàng nổi bật</div>
                            <div class="customer-highlight-item">
                                <div class="customer-avatar">
                                    <v-icon size="20" color="primary">mdi-crown-outline</v-icon>
                                </div>
                                <div class="flex-grow-1">
                                    <div class="text-caption text-medium-emphasis">Mua nhiều nhất</div>
                                    <div class="font-weight-bold text-body-2">{{ stats.topCustomerByOrders?.username ||
                                        'N/A' }}
                                    </div>
                                </div>
                                <v-chip size="small" color="primary" variant="tonal">
                                    {{ stats.topCustomerByOrders?.orderCount || 0 }} đơn
                                </v-chip>
                            </div>
                            <div class="customer-highlight-item mt-2">
                                <div class="customer-avatar amber">
                                    <v-icon size="20" color="amber-darken-2">mdi-cash-multiple</v-icon>
                                </div>
                                <div class="flex-grow-1">
                                    <div class="text-caption text-medium-emphasis">Chi tiêu nhiều nhất</div>
                                    <div class="font-weight-bold text-body-2">{{ stats.topCustomerBySpending?.username
                                        || 'N/A' }}
                                    </div>
                                </div>
                                <v-chip size="small" color="amber-darken-2" variant="tonal">
                                    {{ formatCurrencyShort(stats.topCustomerBySpending?.totalSpent || 0) }}
                                </v-chip>
                            </div>
                        </div>
                        <div class="inner-box">
                            <div class="inner-title">Tài khoản theo trạng thái</div>
                            <ApexCharts type="donut" height="180" :options="accountStatusChartOptions"
                                :series="accountStatusSeries" />
                        </div>
                    </v-card>
                </v-col>

                <v-col cols="12" md="7">
                    <v-card rounded="xl" elevation="0" class="dashboard-card h-100">
                        <div class="section-header mb-4">
                            <div>
                                <h3 class="section-title">Đánh giá sản phẩm</h3>
                                <p class="section-subtitle">Mức độ hài lòng và phân bố số sao</p>
                            </div>
                        </div>
                        <v-row dense>
                            <v-col cols="12" md="5">
                                <div class="inner-box d-flex flex-column align-center justify-center"
                                    style="min-height:180px">
                                    <div class="rating-score">{{ stats.averageRating || 0 }}</div>
                                    <v-rating :model-value="Number(stats.averageRating || 0)" readonly half-increments
                                        color="amber" size="22" density="compact" />
                                    <div class="text-caption text-medium-emphasis mt-2">Rating trung bình</div>
                                    <div class="divider-line my-3 w-100"></div>
                                    <div class="text-caption text-medium-emphasis">🏆 Tốt nhất</div>
                                    <div class="font-weight-bold text-body-2 text-center mt-1">
                                        {{ stats.topRatedProduct?.productName || 'N/A' }}
                                    </div>
                                    <v-chip size="x-small" color="amber" variant="tonal" class="mt-1">
                                        ★ {{ stats.topRatedProduct?.averageRating || 0 }}
                                    </v-chip>
                                </div>
                            </v-col>
                            <v-col cols="12" md="7">
                                <div class="inner-box">
                                    <div class="inner-title">Phân bố số sao</div>
                                    <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="star-row">
                                        <span class="star-label">{{ star }}★</span>
                                        <v-progress-linear :model-value="starPercent(star)" :color="starColor(star)"
                                            rounded height="10" class="star-bar" bg-color="grey-lighten-3" />
                                        <span class="star-count">{{ stats.starDistribution?.[star] || 0 }}</span>
                                    </div>
                                </div>
                            </v-col>
                        </v-row>
                    </v-card>
                </v-col>
            </v-row>
        </template>

    </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ApexCharts from 'vue3-apexcharts'
import statisticsApi from '@/api/statisticsApi'

// ─── Label maps ─────────────────────────────────────────────────────────────

// Trạng thái đơn hàng
const ORDER_STATUS_LABELS = {
    PENDING: 'Chờ xác nhận',
    PENDING_PAYMENT: 'Chờ thanh toán',
    CONFIRMED: 'Đã xác nhận',
    PROCESSING: 'Đang xử lý',
    SHIPPING: 'Đang giao hàng',
    SHIPPED: 'Đã giao hàng',
    DELIVERED: 'Đã nhận hàng',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
    RETURNED: 'Đã trả hàng',
    REFUNDED: 'Đã hoàn tiền',
    FAILED: 'Thất bại',
    OFFLINE: 'Tại quầy',
}

// Trạng thái thanh toán
const PAYMENT_STATUS_LABELS = {
    PAID: 'Đã thanh toán',
    UNPAID: 'Chưa thanh toán',
    PENDING: 'Chờ thanh toán',
    PENDING_PAYMENT: 'Chờ thanh toán',
    FAILED: 'Thất bại',
    REFUNDED: 'Đã hoàn tiền',
    CANCELLED: 'Đã hủy',
    // Trường hợp API đã trả về tiếng Việt — giữ nguyên
    'Đã thanh toán': 'Đã thanh toán',
    'Chờ thanh toán': 'Chờ thanh toán',
    'Chưa thanh toán': 'Chưa thanh toán',
}

// Trạng thái tài khoản
const ACCOUNT_STATUS_LABELS = {
    ACTIVE: 'Đang hoạt động',
    INACTIVE: 'Không hoạt động',
    BANNED: 'Bị cấm',
    LOCKED: 'Bị khóa',
    PENDING: 'Chờ xác minh',
    UNVERIFIED: 'Chưa xác minh',
}

// Phương thức thanh toán
const PAYMENT_METHOD_LABELS = {
    CASH: 'Tiền mặt',
    BANKING: 'Chuyển khoản',
    CARD: 'Thẻ',
    MOMO: 'MoMo',
    VNPAY: 'VNPay',
    ZALOPAY: 'ZaloPay',
    COD: 'Thanh toán khi nhận',
}

const translateOrderStatus = (key) => ORDER_STATUS_LABELS[key] || key
const translatePaymentStatus = (key) => PAYMENT_STATUS_LABELS[key] || key
const translateAccountStatus = (key) => ACCOUNT_STATUS_LABELS[key] || key
const translatePaymentMethod = (key) => PAYMENT_METHOD_LABELS[key] || key

// Map object keys sang tiếng Việt, giữ nguyên value
const translateKeys = (obj, labelMap) => {
    if (!obj) return {}
    return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [labelMap[k] || k, v])
    )
}

// Color cho payment status chips
const paymentStatusColor = (status) => {
    const normalized = String(status).toUpperCase()
    if (['PAID', 'ĐÃ THANH TOÁN'].includes(normalized)) return 'success'
    if (['PENDING', 'PENDING_PAYMENT', 'CHỜ THANH TOÁN'].includes(normalized)) return 'warning'
    if (['UNPAID', 'CHƯA THANH TOÁN'].includes(normalized)) return 'orange'
    if (['FAILED', 'THẤT BẠI', 'CANCELLED', 'ĐÃ HỦY'].includes(normalized)) return 'error'
    if (['REFUNDED', 'ĐÃ HOÀN TIỀN'].includes(normalized)) return 'info'
    return 'grey'
}

// ─── State ─────────────────────────────────────────────────────────────────
const loading = ref(true)
const exporting = ref(false)
const chartGranularity = ref('month')

// ─── Time filter ────────────────────────────────────────────────────────────
const activeTab = ref('month')
const customFrom = ref('')
const customTo = ref('')
const today = new Date().toISOString().slice(0, 10)

const timeTabs = [
    { value: 'today', label: 'Hôm nay', icon: 'mdi-weather-sunny' },
    { value: 'month', label: 'Tháng này', icon: 'mdi-calendar-month-outline' },
    { value: 'year', label: 'Năm này', icon: 'mdi-calendar-outline' },
    { value: 'all', label: 'Tất cả', icon: 'mdi-infinity' },
    { value: 'custom', label: 'Tùy chọn', icon: 'mdi-calendar-range-outline' },
]

const getDateRange = (tab) => {
    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

    if (tab === 'today') { const t = fmt(now); return { dateFrom: t, dateTo: t } }
    if (tab === 'month') {
        return {
            dateFrom: fmt(new Date(now.getFullYear(), now.getMonth(), 1)),
            dateTo: fmt(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
        }
    }
    if (tab === 'year') return { dateFrom: `${now.getFullYear()}-01-01`, dateTo: `${now.getFullYear()}-12-31` }
    if (tab === 'custom') return { dateFrom: customFrom.value, dateTo: customTo.value }
    return { dateFrom: null, dateTo: null }
}

const periodLabel = computed(() => {
    const now = new Date()
    if (activeTab.value === 'today') return `Hôm nay, ${now.toLocaleDateString('vi-VN')}`
    if (activeTab.value === 'month') return `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`
    if (activeTab.value === 'year') return `Năm ${now.getFullYear()}`
    if (activeTab.value === 'custom' && customFrom.value && customTo.value)
        return `${customFrom.value.split('-').reverse().join('/')} → ${customTo.value.split('-').reverse().join('/')}`
    return 'Toàn bộ thời gian'
})

const selectTab = (val) => { activeTab.value = val; if (val !== 'custom') loadStatistics() }
const applyCustomRange = () => { if (customFrom.value && customTo.value) loadStatistics() }

// ─── Stats data ─────────────────────────────────────────────────────────────
const stats = ref({
    ordersByStatus: {},
    ordersByDay: {},
    ordersByMonth: {},
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    averageOrderValue: 0,
    topProducts: [],
    topBrands: [],
    inventoryByColor: [],
    lowStockProducts: [],
    topCustomerByOrders: null,
    topCustomerBySpending: null,
    accountStatusCounts: {},
    paymentMethodCounts: {},
    paymentStatusCounts: {},
    totalPaidAmount: 0,
    averageRating: 0,
    topRatedProduct: null,
    starDistribution: {},
})

// ─── Translated computed (dùng cho charts & chips) ───────────────────────────
const ordersByStatusVN = computed(() => translateKeys(stats.value.ordersByStatus, ORDER_STATUS_LABELS))
const accountStatusCountsVN = computed(() => translateKeys(stats.value.accountStatusCounts, ACCOUNT_STATUS_LABELS))
const paymentMethodCountsVN = computed(() => translateKeys(stats.value.paymentMethodCounts, PAYMENT_METHOD_LABELS))

// ─── Formatters ─────────────────────────────────────────────────────────────
const formatCurrency = (value) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0))

const formatCurrencyShort = (value) => {
    const n = Number(value || 0)
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
    return formatCurrency(n)
}

// ─── Overview cards ─────────────────────────────────────────────────────────
const overviewCards = computed(() => [
    {
        title: 'Tổng tài khoản',
        value: (stats.value.totalCustomers || 0).toLocaleString('vi-VN'),
        icon: 'mdi-account-group-outline',
        iconBg: 'rgba(99,102,241,0.1)', iconColor: 'indigo',
    },
    {
        title: 'Tổng sản phẩm',
        value: (stats.value.totalProducts || 0).toLocaleString('vi-VN'),
        icon: 'mdi-package-variant-closed',
        iconBg: 'rgba(16,185,129,0.1)', iconColor: 'success',
    },
    {
        title: 'Tổng đơn hàng',
        value: (stats.value.totalOrders || 0).toLocaleString('vi-VN'),
        icon: 'mdi-receipt-text-outline',
        iconBg: 'rgba(245,158,11,0.1)', iconColor: 'amber-darken-2',
    },
    {
        title: 'Tổng doanh thu',
        value: formatCurrencyShort(stats.value.totalRevenue || 0),
        icon: 'mdi-cash-check',
        iconBg: 'rgba(239,68,68,0.1)', iconColor: 'error',
    },
])

// ─── Trend chart ─────────────────────────────────────────────────────────────
const trendData = computed(() => {
    const src = chartGranularity.value === 'day' ? stats.value.ordersByDay : stats.value.ordersByMonth
    return src || {}
})

const trendKeys = computed(() =>
    Object.keys(trendData.value).sort((a, b) => a.localeCompare(b))
)

const trendSeries = computed(() => {
    const values = trendKeys.value.map(k => Number(trendData.value[k] || 0))
    const movingAvg = values.map((_, i) => {
        const slice = values.slice(Math.max(0, i - 2), i + 1)
        return Math.round(slice.reduce((s, v) => s + v, 0) / slice.length)
    })
    return [
        { name: 'Đơn hàng', type: 'column', data: values },
        { name: 'TB 3 kỳ trước', type: 'line', data: movingAvg },
    ]
})

const trendOptions = computed(() => {
    const labels = trendKeys.value.map(k =>
        chartGranularity.value === 'month' ? `T${k}` : k
    )
    return {
        chart: { type: 'line', stacked: false, toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit' },
        xaxis: {
            categories: labels,
            axisBorder: { show: false }, axisTicks: { show: false },
            labels: { style: { colors: '#94a3b8', fontSize: '12px' } },
        },
        yaxis: {
            labels: {
                style: { colors: '#94a3b8', fontSize: '12px' },
                formatter: (v) => v.toLocaleString('vi-VN'),
            },
        },
        stroke: { curve: 'smooth', width: [0, 3] },
        plotOptions: { bar: { columnWidth: '40%', borderRadius: 6, borderRadiusApplication: 'end' } },
        dataLabels: { enabled: false },
        fill: { opacity: [0.85, 1] },
        markers: { size: [0, 5], hover: { size: 7 } },
        legend: { show: true, position: 'top', horizontalAlign: 'right', fontSize: '13px' },
        tooltip: { shared: true, intersect: false, y: { formatter: (v) => `${v.toLocaleString('vi-VN')} đơn` } },
        colors: ['#6366f1', '#f59e0b'],
        grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
    }
})

// ─── Order status donut ─────────────────────────────────────────────────────
const orderStatusSeries = computed(() =>
    Object.values(ordersByStatusVN.value).map(Number)
)
const orderStatusChartOptions = computed(() => ({
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: Object.keys(ordersByStatusVN.value),
    colors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'],
    legend: { position: 'bottom', fontSize: '12px' },
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: '65%' } } },
    tooltip: { y: { formatter: (v) => `${v} đơn` } },
}))

const recentOrdersByDay = computed(() => {
    const entries = Object.entries(stats.value.ordersByDay || {})
    return Object.fromEntries(
        entries.sort((a, b) => b[0].localeCompare(a[0])).slice(0, 5)
    )
})

// ─── Payment method bar ─────────────────────────────────────────────────────
const paymentMethodSeries = computed(() => [{
    name: 'Số lượng',
    data: Object.values(paymentMethodCountsVN.value).map(Number),
}])
const paymentMethodChartOptions = computed(() => ({
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
    xaxis: {
        categories: Object.keys(paymentMethodCountsVN.value),
        labels: { style: { colors: '#94a3b8', fontSize: '11px' } },
        axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: '#94a3b8', fontSize: '11px' } } },
    plotOptions: { bar: { borderRadius: 6, columnWidth: '50%', borderRadiusApplication: 'end' } },
    dataLabels: { enabled: false },
    colors: ['#10b981'],
    grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
    tooltip: { y: { formatter: (v) => `${v} lần` } },
}))

// ─── Top products bar ────────────────────────────────────────────────────────
const topProductsSeries = computed(() => [
    { name: 'Sản phẩm', data: (stats.value.topProducts || []).slice(0, 5).map(p => p.quantitySold || 0) },
    { name: 'Brand', data: (stats.value.topBrands || []).slice(0, 5).map(b => b.quantitySold || 0) },
])
const topProductsChartOptions = computed(() => ({
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
    xaxis: {
        categories: (stats.value.topProducts || []).slice(0, 5).map(p =>
            (p.productName?.length > 12) ? p.productName.substring(0, 12) + '…' : p.productName
        ),
        labels: { style: { colors: '#94a3b8', fontSize: '11px' } },
        axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: '#94a3b8', fontSize: '11px' } } },
    plotOptions: { bar: { borderRadius: 5, columnWidth: '60%', borderRadiusApplication: 'end' } },
    dataLabels: { enabled: false },
    colors: ['#6366f1', '#f59e0b'],
    legend: { position: 'top', fontSize: '12px' },
    grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
    tooltip: { y: { formatter: (v) => `${v} sản phẩm` } },
}))

// ─── Account status donut ────────────────────────────────────────────────────
const accountStatusSeries = computed(() =>
    Object.values(accountStatusCountsVN.value).map(Number)
)
const accountStatusChartOptions = computed(() => ({
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: Object.keys(accountStatusCountsVN.value),
    colors: ['#10b981', '#f59e0b', '#ef4444', '#6366f1'],
    legend: { position: 'bottom', fontSize: '11px' },
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: '60%' } } },
    tooltip: { y: { formatter: (v) => `${v} tài khoản` } },
}))

// ─── Star distribution ───────────────────────────────────────────────────────
const totalReviews = computed(() =>
    Object.values(stats.value.starDistribution || {}).reduce((s, v) => s + Number(v), 0)
)
const starPercent = (star) => {
    const count = Number(stats.value.starDistribution?.[star] || 0)
    return totalReviews.value > 0 ? Math.round((count / totalReviews.value) * 100) : 0
}
const starColor = (star) => ({ 5: 'amber', 4: 'lime', 3: 'blue', 2: 'orange', 1: 'error' }[star] || 'grey')

// ─── Color dot ───────────────────────────────────────────────────────────────
const COLOR_MAP = {
    'đỏ': '#ef4444', 'red': '#ef4444', 'xanh lam': '#3b82f6', 'blue': '#3b82f6',
    'xanh lá': '#22c55e', 'green': '#22c55e', 'vàng': '#eab308', 'yellow': '#eab308',
    'đen': '#1e293b', 'black': '#1e293b', 'trắng': '#e2e8f0', 'white': '#e2e8f0',
    'hồng': '#ec4899', 'pink': '#ec4899', 'tím': '#8b5cf6', 'purple': '#8b5cf6',
    'cam': '#f97316', 'orange': '#f97316', 'nâu': '#92400e', 'brown': '#92400e',
}
const colorHex = (name) => COLOR_MAP[(name || '').toLowerCase()] || '#94a3b8'

// ─── API ─────────────────────────────────────────────────────────────────────
const loadStatistics = async () => {
    loading.value = true
    try {
        const { dateFrom, dateTo } = getDateRange(activeTab.value)
        const params = {}
        if (dateFrom) params.dateFrom = dateFrom
        if (dateTo) params.dateTo = dateTo
        const res = await statisticsApi.getDashboard(params)
        if (res?.data) stats.value = { ...stats.value, ...res.data }
    } catch (error) {
        console.error('Lỗi tải dữ liệu thống kê:', error)
    } finally {
        loading.value = false
    }
}

// ─── Export ──────────────────────────────────────────────────────────────────
const exportStats = async () => {
    exporting.value = true
    await new Promise(r => setTimeout(r, 400))

    const lines = [
        '═══════════════════════════════════════════',
        '       BÁO CÁO THỐNG KÊ TỔNG QUAN',
        `       Kỳ báo cáo : ${periodLabel.value}`,
        `       Ngày xuất  : ${new Date().toLocaleDateString('vi-VN')}`,
        '═══════════════════════════════════════════',
        '',
        '📊 TỔNG QUAN',
        `  Tổng tài khoản    : ${stats.value.totalCustomers}`,
        `  Tổng sản phẩm     : ${stats.value.totalProducts}`,
        `  Tổng đơn hàng     : ${stats.value.totalOrders}`,
        `  Tổng doanh thu    : ${formatCurrency(stats.value.totalRevenue)}`,
        `  Giá trị đơn TB    : ${formatCurrency(stats.value.averageOrderValue)}`,
        '',
        '📦 ĐƠN HÀNG THEO TRẠNG THÁI',
        ...Object.entries(ordersByStatusVN.value).map(([s, c]) => `  ${s}: ${c}`),
        '',
        '🏆 TOP SẢN PHẨM BÁN CHẠY',
        ...(stats.value.topProducts || []).map((p, i) =>
            `  ${i + 1}. ${p.productName} — ${p.quantitySold} sản phẩm`),
        '',
        '💳 THANH TOÁN',
        `  Tổng đã thu       : ${formatCurrency(stats.value.totalPaidAmount)}`,
        ...Object.entries(paymentMethodCountsVN.value).map(([m, c]) => `  ${m}: ${c} lần`),
        ...Object.entries(stats.value.paymentStatusCounts || {}).map(([s, c]) =>
            `  ${translatePaymentStatus(s)}: ${c}`),
        '',
        '⭐ ĐÁNH GIÁ',
        `  Rating trung bình : ${stats.value.averageRating}`,
        `  Sản phẩm tốt nhất : ${stats.value.topRatedProduct?.productName || 'N/A'}`,
        '',
        '═══════════════════════════════════════════',
    ]

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `bao-cao-${activeTab.value}-${today}.txt`
    link.click()
    URL.revokeObjectURL(link.href)
    exporting.value = false
}

onMounted(loadStatistics)
</script>

<style scoped>
.stats-page {
    min-height: 100vh;
    background:
        radial-gradient(ellipse at 0% 0%, rgba(99, 102, 241, 0.07) 0%, transparent 50%),
        radial-gradient(ellipse at 100% 100%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
        linear-gradient(180deg, #f6f9ff 0%, #eef4ff 100%);
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;
}

.page-eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #6366f1;
    margin-bottom: 6px;
}

.page-title {
    font-size: 28px;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 6px;
    letter-spacing: -0.5px;
}

.page-subtitle {
    margin: 0;
    color: #64748b;
    font-size: 14px;
}

.export-btn {
    border-radius: 14px;
    text-transform: none;
    font-weight: 600;
    letter-spacing: 0;
}

.filter-bar {
    background: rgba(255, 255, 255, 0.98) !important;
    border: 1px solid rgba(148, 163, 184, 0.18) !important;
    box-shadow: 0 2px 16px rgba(15, 23, 42, 0.06) !important;
    padding: 0;
}

.filter-inner {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 18px;
    flex-wrap: wrap;
}

.filter-tabs {
    display: flex;
    gap: 4px;
    background: #f1f1f1;
    border-radius: 14px;
    padding: 4px;
}

.filter-tab {
    display: inline-flex;
    align-items: center;
    padding: 7px 16px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    color: #64748b;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.18s ease;
    white-space: nowrap;
    line-height: 1;
}

.filter-tab:hover {
    background: rgba(255, 255, 255, 0.7);
    color: #334155;
}

.filter-tab.active {
    background: #ffffff;
    color: #6366f1;
    box-shadow: 0 2px 10px rgba(99, 102, 241, 0.15), 0 1px 3px rgba(15, 23, 42, 0.08);
}

.custom-range {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.date-field {
    min-width: 150px;
    max-width: 180px;
}

.range-sep {
    font-size: 16px;
    color: #94a3b8;
    font-weight: 600;
}

.filter-period-label {
    margin-left: auto;
    font-size: 12px;
    font-weight: 600;
    color: #6366f1;
    display: flex;
    align-items: center;
    background: rgba(99, 102, 241, 0.07);
    padding: 6px 12px;
    border-radius: 20px;
    white-space: nowrap;
}

.slide-fade-enter-active {
    transition: all 0.2s ease;
}

.slide-fade-leave-active {
    transition: all 0.15s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}

.dashboard-card {
    background: rgba(255, 255, 255, 0.97);
    border: 1px solid rgba(148, 163, 184, 0.15);
    box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06), 0 1px 4px rgba(15, 23, 42, 0.04);
    padding: 22px;
    transition: box-shadow 0.2s;
}

.dashboard-card:hover {
    box-shadow: 0 8px 32px rgba(15, 23, 42, 0.09);
}

.h-100 {
    height: 100%;
}

.summary-card {
    min-height: 140px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
}

.summary-icon-wrap {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
}

.summary-label {
    color: #64748b;
    font-size: 13px;
    font-weight: 500;
}

.summary-value {
    font-size: 26px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.2;
    letter-spacing: -0.5px;
}

.summary-period {
    margin-top: 4px;
    font-size: 11px;
    color: #94a3b8;
    display: flex;
    align-items: center;
}

.section-title {
    margin: 0;
    font-size: 17px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.3px;
}

.section-subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    color: #64748b;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;
}

.range-toggle {
    border-radius: 10px !important;
}

.inner-box {
    background: #f1f1f1;
    border: 1px solid #e8edf5;
    border-radius: 16px;
    padding: 16px;
    height: 100%;
}

.inner-title {
    font-size: 13px;
    font-weight: 700;
    color: #334155;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.divider-line {
    height: 1px;
    background: #e2e8f0;
    border-radius: 1px;
}

.metric-value {
    font-size: 22px;
    font-weight: 800;
    color: #6366f1;
    word-break: break-word;
    letter-spacing: -0.5px;
}

.table-wrap {
    overflow-x: auto;
    border-radius: 12px;
    border: 1px solid #e8edf5;
    background: white;
}

.custom-table {
    background: white;
}

.custom-table thead th {
    background: #f1f1f1;
    color: #475569;
    font-weight: 700;
    font-size: 12px;
    white-space: nowrap;
    border-bottom: 1px solid #e2e8f0 !important;
}

.custom-table tbody td {
    color: #334155;
    font-size: 13px;
    white-space: nowrap;
}

.clean-list {
    background: transparent;
    padding: 0;
}

.customer-highlight-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 12px;
    background: white;
    border: 1px solid #e2e8f0;
}

.customer-avatar {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(99, 102, 241, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.customer-avatar.amber {
    background: rgba(245, 158, 11, 0.1);
}

.rating-score {
    font-size: 52px;
    font-weight: 900;
    color: #0f172a;
    line-height: 1;
    letter-spacing: -2px;
}

.star-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
}

.star-label {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    width: 28px;
    text-align: right;
    flex-shrink: 0;
}

.star-bar {
    flex: 1;
}

.star-count {
    font-size: 12px;
    font-weight: 700;
    color: #334155;
    width: 28px;
    text-align: right;
    flex-shrink: 0;
}

.color-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
}

.chart-wrap {
    margin-top: 4px;
}

:deep(.apexcharts-legend) {
    justify-content: center !important;
}

:deep(.apexcharts-tooltip) {
    border-radius: 10px !important;
    box-shadow: 0 4px 20px rgba(15, 23, 42, 0.12) !important;
}

@media (max-width: 960px) {
    .page-title {
        font-size: 24px;
    }

    .summary-value {
        font-size: 22px;
    }

    .dashboard-card {
        padding: 16px;
    }

    .inner-box {
        padding: 14px;
    }

    .metric-value {
        font-size: 18px;
    }

    .rating-score {
        font-size: 40px;
    }

    .filter-period-label {
        margin-left: 0;
    }
}

@media (max-width: 600px) {
    .stats-page {
        padding: 12px !important;
    }

    .page-title {
        font-size: 20px;
    }

    .filter-tabs {
        flex-wrap: wrap;
    }

    .filter-tab {
        padding: 6px 12px;
        font-size: 12px;
    }
}
</style>