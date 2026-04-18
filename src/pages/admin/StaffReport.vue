<template>
    <v-container fluid class="pa-4">
        <v-row class="mb-4" align="center">
            <v-col cols="12" md="4">
                <div class="text-h5 font-weight-bold">Báo cáo bán hàng</div>
                <div class="text-body-2 text-medium-emphasis" v-if="dashboard.employeeName">
                    Nhân viên: {{ dashboard.employeeName }}
                </div>
            </v-col>

            <v-col cols="12" md="3">
                <v-text-field v-model="selectedDate" label="Chọn ngày" type="date" variant="outlined"
                    density="comfortable" hide-details @change="loadAll" />
            </v-col>

            <v-col cols="12" md="1">
                <v-btn block color="primary" variant="tonal" class="h-100" @click="setToday">
                    Hôm nay
                </v-btn>
            </v-col>

            <v-col cols="12" md="4">
                <v-text-field v-model="keyword" label="Tìm khách / SĐT / mã vận đơn / mã đơn" variant="outlined"
                    density="comfortable" clearable hide-details @keyup.enter="loadAll"
                    @click:clear="handleClearKeyword">
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
                        <div class="text-h4 font-weight-bold mt-2">
                            {{ dashboard.totalOrdersToday || 0 }}
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="4">
                <v-card rounded="xl" elevation="2">
                    <v-card-text>
                        <div class="text-subtitle-2 text-medium-emphasis">Sản phẩm đã bán</div>
                        <div class="text-h4 font-weight-bold mt-2">
                            {{ dashboard.totalProductsToday || 0 }}
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="4">
                <v-card rounded="xl" elevation="2">
                    <v-card-text>
                        <div class="text-subtitle-2 text-medium-emphasis">Doanh thu hôm nay</div>
                        <div class="text-h4 font-weight-bold mt-2">
                            {{ formatCurrency(dashboard.totalRevenueToday) }}
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
                        <v-list-item v-for="(customer, index) in customers" :key="customerKey(customer, index)"
                            class="py-3">
                            <template #title>
                                <div class="font-weight-medium">
                                    {{ customer.customerName || "Khách lẻ" }}
                                </div>
                            </template>

                            <template #subtitle>
                                <div>{{ customer.customerPhone || "Chưa có SĐT" }}</div>
                                <div class="mt-1">
                                    {{
                                        customer.customerType === "ACCOUNT"
                                            ? "Khách có tài khoản"
                                            : "Khách tại quầy"
                                    }}
                                </div>
                                <div class="mt-1">Số đơn: {{ customer.totalOrders || 0 }}</div>
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
                        item-value="orderId" show-expand class="elevation-0" no-data-text="Chưa có lịch sử mua hàng"
                        loading-text="Đang tải dữ liệu...">
                        <template #item.orderDate="{ item }">
                            {{ formatDateTime(getRow(item).orderDate) }}
                        </template>

                        <template #item.customerName="{ item }">
                            <div>{{ getRow(item).customerName || "Khách lẻ" }}</div>
                            <div class="text-caption text-medium-emphasis">
                                {{ getRow(item).customerPhone || "Không có SĐT" }}
                            </div>
                        </template>

                        <template #item.totalItems="{ item }">
                            {{ getRow(item).totalItems || 0 }}
                        </template>

                        <template #item.totalAmount="{ item }">
                            {{ formatCurrency(getRow(item).totalAmount) }}
                        </template>

                        <template #item.orderStatus="{ item }">
                            {{ getRow(item).orderStatus || "-" }}
                        </template>

                        <template #expanded-row="{ columns, item }">
                            <tr>
                                <td :colspan="columns.length" class="bg-grey-lighten-5">
                                    <div class="pa-4">
                                        <div class="text-subtitle-1 font-weight-bold mb-2">
                                            Đơn #{{ getRow(item).orderId }} -
                                            {{ getRow(item).trackingCode || "Chưa có mã vận đơn" }}
                                        </div>

                                        <div class="mb-2">
                                            Thanh toán:
                                            {{ getRow(item).paymentMethod || "-" }} /
                                            {{ getRow(item).paymentStatus || "-" }}
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
                                                <tr v-for="detail in getRow(item).items || []"
                                                    :key="detail.orderDetailId">
                                                    <td>{{ detail.productName || "-" }}</td>
                                                    <td>{{ detail.colorName || "-" }}</td>
                                                    <td>{{ detail.sizeName || "-" }}</td>
                                                    <td>{{ detail.quantity || 0 }}</td>
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
import staffReportApi from "@/api/staffReportApi"

const loading = ref(false)
const keyword = ref("")
const selectedDate = ref(getTodayString())

const defaultDashboard = () => ({
    employeeId: null,
    employeeName: "",
    totalOrdersToday: 0,
    totalProductsToday: 0,
    totalRevenueToday: 0,
})

const dashboard = ref(defaultDashboard())
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

function getTodayString() {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, "0")
    const dd = String(today.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
}

function unwrapResponse(res, fallback) {
    return res?.data?.data ?? res?.data ?? fallback
}

function getRow(item) {
    return item?.raw ?? item ?? {}
}

function customerKey(customer, index) {
    return [
        customer?.customerType ?? "UNKNOWN",
        customer?.customerId ?? "NULL",
        customer?.customerName ?? "NO_NAME",
        customer?.customerPhone ?? "NO_PHONE",
        index,
    ].join("-")
}

async function loadAll() {
    loading.value = true

    try {
        const date = selectedDate.value || null

        const [todayRes, customerRes, historyRes] = await Promise.allSettled([
            staffReportApi.getMyTodayDashboard(date),
            staffReportApi.getMyCustomerSummary(keyword.value, date),
            staffReportApi.getMyPurchaseHistory(keyword.value, date),
        ])

        dashboard.value =
            todayRes.status === "fulfilled"
                ? unwrapResponse(todayRes.value, defaultDashboard())
                : defaultDashboard()

        customers.value =
            customerRes.status === "fulfilled"
                ? unwrapResponse(customerRes.value, [])
                : []

        purchaseHistory.value =
            historyRes.status === "fulfilled"
                ? unwrapResponse(historyRes.value, [])
                : []

        if (todayRes.status === "rejected") {
            console.error("getMyTodayDashboard error:", todayRes.reason?.response?.data || todayRes.reason)
        }

        if (customerRes.status === "rejected") {
            console.error("getMyCustomerSummary error:", customerRes.reason?.response?.data || customerRes.reason)
        }

        if (historyRes.status === "rejected") {
            console.error("getMyPurchaseHistory error:", historyRes.reason?.response?.data || historyRes.reason)
        }
    } catch (error) {
        console.error("loadAll staff report error:", error)
        dashboard.value = defaultDashboard()
        customers.value = []
        purchaseHistory.value = []
    } finally {
        loading.value = false
    }
}

function handleClearKeyword() {
    keyword.value = ""
    loadAll()
}

function setToday() {
    selectedDate.value = getTodayString()
    loadAll()
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

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    return date.toLocaleString("vi-VN")
}

onMounted(() => {
    loadAll()
})
</script>