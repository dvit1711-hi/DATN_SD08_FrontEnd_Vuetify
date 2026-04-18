<template>
    <v-container fluid class="stats-page pa-6">
        <!-- Header -->
        <div class="page-header mb-6">
            <div>
                <h1 class="page-title">Trang thống kê</h1>
                <p class="page-subtitle">
                    Báo cáo toàn diện: tài khoản, đơn hàng, sản phẩm, khách hàng, thanh toán, đánh giá.
                </p>
            </div>

            <v-btn color="primary" variant="elevated" prepend-icon="mdi-download" class="export-btn"
                @click="exportStats">
                Export
            </v-btn>
        </div>

        <!-- Tổng quan -->
        <v-row class="mb-6" dense>
            <v-col cols="12" sm="6" md="3" v-for="item in overviewCards" :key="item.title">
                <v-card rounded="xl" elevation="0" class="dashboard-card summary-card">
                    <div class="summary-label">{{ item.title }}</div>
                    <div class="summary-value">{{ item.value }}</div>
                    <div v-if="item.subtitle" class="summary-subtitle">{{ item.subtitle }}</div>
                </v-card>
            </v-col>
        </v-row>

        <!-- Trend -->
        <v-card rounded="xl" elevation="0" class="dashboard-card trend-card mb-6">
            <div class="section-header">
                <div>
                    <h3 class="section-title">Trend đơn hàng</h3>
                    <p class="section-subtitle">Biểu đồ đơn hàng theo tháng</p>
                </div>

                <v-menu v-model="dateMenu" :close-on-content-click="false">
                    <template #activator="{ props }">
                        <v-text-field v-bind="props" readonly label="Chọn khoảng" :model-value="rangeLabel"
                            variant="outlined" density="comfortable" class="range-field" />
                    </template>

                    <v-card rounded="xl">
                        <v-card-text>
                            <v-date-picker v-model="selectedRange" />
                            <v-row class="mt-3" justify="space-around">
                                <v-btn variant="text" size="small" color="primary" @click="selectQuickRange('7d')">
                                    7 ngày
                                </v-btn>
                                <v-btn variant="text" size="small" color="primary" @click="selectQuickRange('30d')">
                                    30 ngày
                                </v-btn>
                                <v-btn variant="text" size="small" color="primary" @click="selectQuickRange('90d')">
                                    90 ngày
                                </v-btn>
                            </v-row>
                        </v-card-text>
                        <v-card-actions>
                            <v-spacer />
                            <v-btn variant="text" @click="dateMenu = false">Đóng</v-btn>
                        </v-card-actions>
                    </v-card>
                </v-menu>
            </div>

            <div class="chart-wrap">
                <ApexCharts type="line" height="320" :options="trendOptions" :series="trendSeries" />
            </div>
        </v-card>

        <!-- Đơn hàng -->
        <v-card rounded="xl" elevation="0" class="dashboard-card mb-6">
            <div class="section-header mb-4">
                <div>
                    <h3 class="section-title">Đơn hàng</h3>
                    <p class="section-subtitle">Theo dõi trạng thái, số lượng và giá trị đơn</p>
                </div>
            </div>

            <v-row dense>
                <v-col cols="12" md="4">
                    <div class="inner-box">
                        <div class="inner-title">Đơn theo trạng thái</div>
                        <v-list density="compact" class="clean-list">
                            <v-list-item v-for="(count, status) in stats.ordersByStatus" :key="status">
                                <v-list-item-title>{{ status }}</v-list-item-title>
                                <template #append>
                                    <v-chip size="small" color="primary" variant="tonal">{{ count }}</v-chip>
                                </template>
                            </v-list-item>
                        </v-list>
                    </div>
                </v-col>

                <v-col cols="12" md="5">
                    <div class="inner-box">
                        <div class="inner-title">Đơn theo ngày</div>
                        <div class="table-wrap">
                            <v-table density="compact" class="custom-table">
                                <thead>
                                    <tr>
                                        <th>Ngày</th>
                                        <th class="text-right">Đơn</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(c, date) in stats.ordersByDay" :key="date">
                                        <td>{{ date }}</td>
                                        <td class="text-right">{{ c }}</td>
                                    </tr>
                                </tbody>
                            </v-table>
                        </div>
                    </div>
                </v-col>

                <v-col cols="12" md="3">
                    <div class="inner-box metric-box">
                        <div class="inner-title">Giá trị đơn trung bình</div>
                        <div class="metric-value">{{ formatCurrency(stats.averageOrderValue) }}</div>
                    </div>
                </v-col>
            </v-row>
        </v-card>

        <!-- Sản phẩm -->
        <v-card rounded="xl" elevation="0" class="dashboard-card mb-6">
            <div class="section-header mb-4">
                <div>
                    <h3 class="section-title">Sản phẩm</h3>
                    <p class="section-subtitle">Hiệu suất bán hàng và tình trạng tồn kho</p>
                </div>
            </div>

            <v-row dense>
                <v-col cols="12" md="4">
                    <div class="inner-box">
                        <div class="inner-title">Top sản phẩm bán chạy</div>
                        <v-list density="compact" class="clean-list">
                            <v-list-item v-for="p in stats.topProducts || []" :key="p.productId">
                                <v-list-item-title>{{ p.productName }}</v-list-item-title>
                                <v-list-item-subtitle>{{ p.quantitySold }} sản phẩm</v-list-item-subtitle>
                            </v-list-item>
                        </v-list>
                    </div>
                </v-col>

                <v-col cols="12" md="4">
                    <div class="inner-box">
                        <div class="inner-title">Top brand bán chạy</div>
                        <v-list density="compact" class="clean-list">
                            <v-list-item v-for="b in stats.topBrands || []" :key="b.brandName">
                                <v-list-item-title>{{ b.brandName }}</v-list-item-title>
                                <v-list-item-subtitle>{{ b.quantitySold }} sản phẩm</v-list-item-subtitle>
                            </v-list-item>
                        </v-list>
                    </div>
                </v-col>

                <v-col cols="12" md="4">
                    <div class="inner-box">
                        <div class="inner-title">Tồn kho theo màu</div>
                        <v-list density="compact" class="clean-list">
                            <v-list-item v-for="c in stats.inventoryByColor || []" :key="c.colorName">
                                <v-list-item-title>{{ c.colorName }}</v-list-item-title>
                                <template #append>
                                    <v-chip size="small" color="indigo" variant="tonal">
                                        {{ c.stockQuantity }}
                                    </v-chip>
                                </template>
                            </v-list-item>
                        </v-list>
                    </div>
                </v-col>
            </v-row>

            <div class="inner-box mt-4">
                <div class="inner-title">Sản phẩm sắp hết</div>
                <div class="table-wrap">
                    <v-table density="compact" class="custom-table">
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Màu</th>
                                <th class="text-right">Tồn kho</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="x in stats.lowStockProducts || []" :key="x.productName + '-' + x.colorName">
                                <td>{{ x.productName }}</td>
                                <td>{{ x.colorName }}</td>
                                <td class="text-right">
                                    <v-chip size="small" :color="x.stockQuantity <= 5 ? 'error' : 'warning'"
                                        variant="tonal">
                                        {{ x.stockQuantity }}
                                    </v-chip>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </div>
            </div>
        </v-card>

        <!-- Khách hàng -->
        <v-card rounded="xl" elevation="0" class="dashboard-card mb-6">
            <div class="section-header mb-4">
                <div>
                    <h3 class="section-title">Khách hàng</h3>
                    <p class="section-subtitle">Thói quen mua hàng và trạng thái tài khoản</p>
                </div>
            </div>

            <v-row dense>
                <v-col cols="12" md="6">
                    <div class="inner-box">
                        <div class="inner-title">Khách hàng nổi bật</div>

                        <div class="detail-item">
                            <span class="detail-label">Mua nhiều nhất</span>
                            <strong>{{ stats.topCustomerByOrders?.username || 'N/A' }}</strong>
                            <span class="detail-value">({{ stats.topCustomerByOrders?.orderCount || 0 }} đơn)</span>
                        </div>

                        <div class="detail-item">
                            <span class="detail-label">Chi nhiều nhất</span>
                            <strong>{{ stats.topCustomerBySpending?.username || 'N/A' }}</strong>
                            <span class="detail-value">
                                ({{ formatCurrency(stats.topCustomerBySpending?.totalSpent || 0) }})
                            </span>
                        </div>
                    </div>
                </v-col>

                <v-col cols="12" md="6">
                    <div class="inner-box">
                        <div class="inner-title">Tài khoản theo trạng thái</div>
                        <v-list density="compact" class="clean-list">
                            <v-list-item v-for="(count, status) in stats.accountStatusCounts || {}" :key="status">
                                <v-list-item-title>{{ status }}</v-list-item-title>
                                <template #append>
                                    <v-chip size="small" color="secondary" variant="tonal">{{ count }}</v-chip>
                                </template>
                            </v-list-item>
                        </v-list>
                    </div>
                </v-col>
            </v-row>
        </v-card>

        <!-- Thanh toán -->
        <v-card rounded="xl" elevation="0" class="dashboard-card mb-6">
            <div class="section-header mb-4">
                <div>
                    <h3 class="section-title">Thanh toán</h3>
                    <p class="section-subtitle">Theo dõi phương thức, trạng thái và doanh số thanh toán</p>
                </div>
            </div>

            <v-row dense>
                <v-col cols="12" md="4">
                    <div class="inner-box">
                        <div class="inner-title">Phương thức</div>
                        <v-list density="compact" class="clean-list">
                            <v-list-item v-for="(count, method) in stats.paymentMethodCounts || {}" :key="method">
                                <v-list-item-title>{{ method }}</v-list-item-title>
                                <template #append>
                                    <v-chip size="small" color="primary" variant="tonal">{{ count }}</v-chip>
                                </template>
                            </v-list-item>
                        </v-list>
                    </div>
                </v-col>

                <v-col cols="12" md="4">
                    <div class="inner-box">
                        <div class="inner-title">Trạng thái</div>
                        <v-list density="compact" class="clean-list">
                            <v-list-item v-for="(count, status) in stats.paymentStatusCounts || {}" :key="status">
                                <v-list-item-title>{{ status }}</v-list-item-title>
                                <template #append>
                                    <v-chip size="small" color="success" variant="tonal">{{ count }}</v-chip>
                                </template>
                            </v-list-item>
                        </v-list>
                    </div>
                </v-col>

                <v-col cols="12" md="4">
                    <div class="inner-box metric-box">
                        <div class="inner-title">Tổng tiền đã thanh toán</div>
                        <div class="metric-value">{{ formatCurrency(stats.totalPaidAmount || 0) }}</div>
                    </div>
                </v-col>
            </v-row>
        </v-card>

        <!-- Đánh giá -->
        <v-card rounded="xl" elevation="0" class="dashboard-card mb-6">
            <div class="section-header mb-4">
                <div>
                    <h3 class="section-title">Đánh giá</h3>
                    <p class="section-subtitle">Mức độ hài lòng và phân bố số sao</p>
                </div>
            </div>

            <v-row dense>
                <v-col cols="12" md="4">
                    <div class="inner-box">
                        <div class="inner-title">Tổng quan đánh giá</div>
                        <div class="detail-item">
                            <span class="detail-label">Rating trung bình</span>
                            <strong>{{ stats.averageRating || 0 }}</strong>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Sản phẩm tốt nhất</span>
                            <strong>{{ stats.topRatedProduct?.productName || 'N/A' }}</strong>
                            <span class="detail-value">({{ stats.topRatedProduct?.averageRating || 0 }})</span>
                        </div>
                    </div>
                </v-col>

                <v-col cols="12" md="8">
                    <div class="inner-box">
                        <div class="inner-title">Phân bố số sao</div>
                        <div class="table-wrap">
                            <v-table density="compact" class="custom-table">
                                <thead>
                                    <tr>
                                        <th>Sao</th>
                                        <th class="text-right">Số lượng</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="star in [5, 4, 3, 2, 1]" :key="star">
                                        <td>{{ star }}</td>
                                        <td class="text-right">{{ stats.starDistribution?.[star] || 0 }}</td>
                                    </tr>
                                </tbody>
                            </v-table>
                        </div>
                    </div>
                </v-col>
            </v-row>
        </v-card>
    </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import ApexCharts from 'vue3-apexcharts'
import statisticsApi from '@/api/statisticsApi'

const dateMenu = ref(false)
const selectedRange = ref(null)

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

const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0))
}

const rangeLabel = computed(() => {
    if (!selectedRange.value) return 'Chưa chọn'
    if (Array.isArray(selectedRange.value)) return selectedRange.value.join(' - ')
    return selectedRange.value
})

const overviewCards = computed(() => [
    { title: 'Tổng tài khoản', value: stats.value.totalCustomers || 0 },
    { title: 'Tổng sản phẩm', value: stats.value.totalProducts || 0 },
    { title: 'Tổng đơn hàng', value: stats.value.totalOrders || 0 },
    { title: 'Tổng doanh thu', value: formatCurrency(stats.value.totalRevenue || 0) },
])

const trendSeries = computed(() => {
    const months = Object.keys(stats.value.ordersByMonth || {}).sort((a, b) => Number(a) - Number(b))
    const values = months.map(m => Number(stats.value.ordersByMonth[m] || 0))

    return [
        {
            name: 'Đơn hàng',
            type: 'column',
            data: values,
        },
        {
            name: 'Xu hướng',
            type: 'line',
            data: values,
        },
    ]
})

const trendOptions = computed(() => {
    const months = Object.keys(stats.value.ordersByMonth || {}).sort((a, b) => Number(a) - Number(b))

    return {
        chart: {
            type: 'line',
            stacked: false,
            toolbar: { show: false },
            zoom: { enabled: false },
        },
        xaxis: {
            categories: months.map(m => `Tháng ${m}`),
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        stroke: {
            curve: 'smooth',
            width: [0, 3],
        },
        plotOptions: {
            bar: {
                columnWidth: '35%',
                borderRadius: 4,
                borderRadiusApplication: 'end',
            },
        },
        dataLabels: {
            enabled: false,
        },
        fill: {
            opacity: [0.75, 1],
        },
        markers: {
            size: [0, 4],
            hover: {
                size: 6,
            },
        },
        legend: {
            show: true,
            position: 'bottom',
            horizontalAlign: 'center',
        },
        tooltip: {
            shared: true,
            intersect: false,
        },
        colors: ['#f59e0b', '#ef4444'],
        grid: {
            borderColor: '#e5e7eb',
            strokeDashArray: 4,
        },
    }
})

const selectQuickRange = (type) => {
    selectedRange.value = type
    dateMenu.value = false
}

const loadStatistics = async () => {
    try {
        const res = await statisticsApi.getDashboard()
        if (res?.data) {
            stats.value = {
                ...stats.value,
                ...res.data,
            }
        }
    } catch (error) {
        console.error('Lỗi tải dữ liệu thống kê:', error)
    }
}

const exportStats = () => {
    const text = `BÁO CÁO THỐNG KÊ

Tổng tài khoản: ${stats.value.totalCustomers}
Tổng sản phẩm: ${stats.value.totalProducts}
Tổng đơn hàng: ${stats.value.totalOrders}
Tổng doanh thu: ${formatCurrency(stats.value.totalRevenue)}
`
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `statistics-${new Date().toISOString()}.txt`
    link.click()
    URL.revokeObjectURL(link.href)
}

onMounted(loadStatistics)
</script>

<style scoped>
.stats-page {
    min-height: 100vh;
    background:
        radial-gradient(circle at top left, rgba(59, 130, 246, 0.08), transparent 28%),
        linear-gradient(180deg, #f6f9ff 0%, #eef4ff 100%);
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;
}

.page-title {
    font-size: 28px;
    font-weight: 800;
    color: #172554;
    margin: 0 0 6px;
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
}

.dashboard-card {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(148, 163, 184, 0.18);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
    padding: 20px;
}

.trend-card {
    padding: 20px 20px 12px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;
}

.section-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
}

.section-subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    color: #64748b;
}

.range-field {
    min-width: 220px;
}

.chart-wrap {
    margin-top: 8px;
}

.summary-card {
    min-height: 132px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.summary-label {
    color: #64748b;
    font-size: 14px;
    margin-bottom: 8px;
}

.summary-value {
    font-size: 28px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.2;
}

.summary-subtitle {
    margin-top: 10px;
    font-size: 12px;
    color: #94a3b8;
}

.inner-box {
    height: 100%;
    background: #f8fbff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 16px;
}

.inner-title {
    font-size: 14px;
    font-weight: 700;
    color: #334155;
    margin-bottom: 12px;
}

.metric-box {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 180px;
}

.metric-value {
    font-size: 26px;
    font-weight: 800;
    color: #1d4ed8;
    margin-top: 6px;
    word-break: break-word;
}

.clean-list {
    background: transparent;
    padding: 0;
}

.table-wrap {
    overflow-x: auto;
    border-radius: 14px;
    border: 1px solid #e5e7eb;
    background: white;
}

.custom-table {
    background: white;
}

.custom-table thead th {
    background: #f8fafc;
    color: #334155;
    font-weight: 700;
    white-space: nowrap;
}

.custom-table tbody td {
    color: #334155;
    white-space: nowrap;
}

.detail-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 14px;
    margin-bottom: 12px;
    border-radius: 14px;
    background: white;
    border: 1px solid #e2e8f0;
}

.detail-label {
    font-size: 13px;
    color: #64748b;
}

.detail-value {
    font-size: 13px;
    color: #475569;
}

:deep(.apexcharts-legend) {
    justify-content: center !important;
}

@media (max-width: 960px) {
    .page-title {
        font-size: 24px;
    }

    .summary-value,
    .metric-value {
        font-size: 22px;
    }

    .dashboard-card {
        padding: 16px;
    }

    .inner-box {
        padding: 14px;
    }
}
</style>