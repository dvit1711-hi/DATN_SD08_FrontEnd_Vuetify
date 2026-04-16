<template>
    <v-container fluid class="pa-4">
        <v-row class="mb-4" align="center">
            <v-col cols="12" md="6">
                <div class="text-h5 font-weight-bold">Báo cáo bán hàng</div>
            </v-col>

            <v-col cols="12" md="6">
                <v-text-field v-model="keyword" label="Tìm khách / SĐT / mã vận đơn / mã đơn" variant="outlined"
                    density="comfortable" clearable @keyup.enter="loadAll" @click:clear="loadAll">
                    <template #append-inner>
                        <v-btn icon="mdi-magnify" variant="text" @click="loadAll" />
                    </template>
                </v-text-field>
            </v-col>
        </v-row>

        <v-row class="mb-4">
            <v-col cols="12" md="4">
                <v-card rounded="xl" elevation="2">
                    <v-card-text>
                        <div class="text-subtitle-2 text-medium-emphasis">Đơn hôm nay</div>
                        <div class="text-h4 font-weight-bold mt-2">{{ dashboard.totalOrdersToday || 0 }}</div>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="4">
                <v-card rounded="xl" elevation="2">
                    <v-card-text>
                        <div class="text-subtitle-2 text-medium-emphasis">Sản phẩm đã bán</div>
                        <div class="text-h4 font-weight-bold mt-2">{{ dashboard.totalProductsToday || 0 }}</div>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="4">
                <v-card rounded="xl" elevation="2">
                    <v-card-text>
                        <div class="text-subtitle-2 text-medium-emphasis">Doanh thu hôm nay</div>
                        <div class="text-h4 font-weight-bold mt-2">{{ formatCurrency(dashboard.totalRevenueToday) }}
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-row>
            <v-col cols="12" md="4">
                <v-card rounded="xl" elevation="2" min-height="460">
                    <v-card-title class="font-weight-bold">Khách hàng</v-card-title>
                    <v-divider />

                    <v-list v-if="customers.length">
                        <v-list-item v-for="customer in customers"
                            :key="`${customer.customerType}-${customer.customerId}-${customer.customerName}`"
                            class="py-3">
                            <template #title>
                                <div class="font-weight-medium">{{ customer.customerName || 'Khách lẻ' }}</div>
                            </template>

                            <template #subtitle>
                                <div>{{ customer.customerPhone || 'Chưa có SĐT' }}</div>
                                <div class="mt-1">
                                    {{ customer.customerType === 'ACCOUNT' ? 'Khách có tài khoản' : 'Khách tại quầy' }}
                                </div>
                                <div class="mt-1">Số đơn: {{ customer.totalOrders }}</div>
                                <div>Tổng chi: {{ formatCurrency(customer.totalSpent) }}</div>
                            </template>
                        </v-list-item>
                    </v-list>

                    <v-card-text v-else class="text-medium-emphasis">
                        Chưa có dữ liệu khách hàng
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="8">
                <v-card rounded="xl" elevation="2">
                    <v-card-title class="font-weight-bold">Lịch sử mua hàng</v-card-title>

                    <v-data-table :headers="historyHeaders" :items="purchaseHistory" :loading="loading"
                        item-value="orderId" show-expand class="elevation-0">
                        <template #item.orderDate="{ item }">
                            {{ formatDateTime(item.orderDate) }}
                        </template>

                        <template #item.customerName="{ item }">
                            <div>{{ item.customerName || 'Khách lẻ' }}</div>
                            <div class="text-caption text-medium-emphasis">
                                {{ item.customerPhone || 'Không có SĐT' }}
                            </div>
                        </template>

                        <template #item.totalAmount="{ item }">
                            {{ formatCurrency(item.totalAmount) }}
                        </template>

                        <template #expanded-row="{ columns, item }">
                            <tr>
                                <td :colspan="columns.length" class="bg-grey-lighten-5">
                                    <div class="pa-4">
                                        <div class="text-subtitle-1 font-weight-bold mb-2">
                                            Đơn #{{ item.orderId }} - {{ item.trackingCode || 'Chưa có mã vận đơn' }}
                                        </div>

                                        <div class="mb-2">
                                            Thanh toán: {{ item.paymentMethod || '-' }} / {{ item.paymentStatus || '-'
                                            }}
                                        </div>

                                        <v-table density="comfortable">
                                            <thead>
                                                <tr>
                                                    <th>Sản phẩm</th>
                                                    <th>Màu</th>
                                                    <th>Size</th>
                                                    <th>SL</th>
                                                    <th>Giá</th>
                                                    <th>Thành tiền</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="detail in item.items || []" :key="detail.orderDetailId">
                                                    <td>{{ detail.productName }}</td>
                                                    <td>{{ detail.colorName }}</td>
                                                    <td>{{ detail.sizeName }}</td>
                                                    <td>{{ detail.quantity }}</td>
                                                    <td>{{ formatCurrency(detail.price) }}</td>
                                                    <td>{{ formatCurrency(detail.lineTotal) }}</td>
                                                </tr>
                                            </tbody>
                                        </v-table>
                                    </div>
                                </td>
                            </tr>
                        </template>
                    </v-data-table>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { onMounted, ref } from "vue"
import reportApi from "@/api/reportApi"

const loading = ref(false)
const keyword = ref("")

const dashboard = ref({
    employeeId: null,
    employeeName: "",
    totalOrdersToday: 0,
    totalProductsToday: 0,
    totalRevenueToday: 0,
})

const customers = ref([])
const purchaseHistory = ref([])

const historyHeaders = [
    { title: "Mã đơn", key: "orderId" },
    { title: "Mã vận đơn", key: "trackingCode" },
    { title: "Ngày mua", key: "orderDate" },
    { title: "Khách hàng", key: "customerName" },
    { title: "SL SP", key: "totalItems" },
    { title: "Tổng tiền", key: "totalAmount" },
    { title: "Trạng thái", key: "orderStatus" },
]

async function loadAll() {
    loading.value = true
    try {
        const [todayRes, customerRes, historyRes] = await Promise.all([
            reportApi.getMyTodayReport(),
            reportApi.getMyCustomerSummary(keyword.value),
            reportApi.getMyPurchaseHistory(keyword.value),
        ])

        dashboard.value = todayRes.data || {
            employeeId: null,
            employeeName: "",
            totalOrdersToday: 0,
            totalProductsToday: 0,
            totalRevenueToday: 0,
        }
        customers.value = customerRes.data || []
        purchaseHistory.value = historyRes.data || []
    } catch (error) {
        console.error("loadAll staff report error", error)
    } finally {
        loading.value = false
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(Number(value || 0))
}

function formatDateTime(value) {
    if (!value) return "-"
    return new Date(value).toLocaleString("vi-VN")
}

onMounted(loadAll)
</script>