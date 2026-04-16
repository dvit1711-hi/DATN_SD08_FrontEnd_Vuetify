<template>
    <v-container fluid class="pa-4">
        <v-row class="mb-4" align="center">
            <v-col cols="12" md="4">
                <div class="text-h5 font-weight-bold">Báo cáo nhân viên bán hàng</div>
            </v-col>

            <v-col cols="12" md="2">
                <v-select v-model="selectedEmployeeId" :items="staffOptions" item-title="displayName"
                    item-value="employeeId" label="Lọc theo nhân viên" variant="outlined" density="comfortable"
                    clearable @update:model-value="loadAll" />
            </v-col>

            <v-col cols="12" md="3">
                <v-menu v-model="dateMenu" :close-on-content-click="false" location="bottom">
                    <template #activator="{ props }">
                        <v-text-field v-bind="props" :model-value="displaySelectedDate" label="Chọn ngày"
                            variant="outlined" density="comfortable" prepend-inner-icon="mdi-calendar" readonly
                            clearable @click:clear="resetDate" />
                    </template>

                    <v-card>
                        <v-date-picker v-model="selectedDate" @update:model-value="handleDateChange" />
                    </v-card>
                </v-menu>
            </v-col>

            <v-col cols="12" md="3">
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
                        <div class="text-subtitle-2 text-medium-emphasis">
                            Đơn ngày {{ displaySelectedDate || "hôm nay" }}
                        </div>
                        <div class="text-h4 font-weight-bold mt-2">
                            {{ dashboard.totalOrdersToday || 0 }}
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="4">
                <v-card rounded="xl" elevation="2">
                    <v-card-text>
                        <div class="text-subtitle-2 text-medium-emphasis">
                            Tổng sản phẩm ngày {{ displaySelectedDate || "hôm nay" }}
                        </div>
                        <div class="text-h4 font-weight-bold mt-2">
                            {{ dashboard.totalProductsToday || 0 }}
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="4">
                <v-card rounded="xl" elevation="2">
                    <v-card-text>
                        <div class="text-subtitle-2 text-medium-emphasis">
                            Doanh thu ngày {{ displaySelectedDate || "hôm nay" }}
                        </div>
                        <div class="text-h4 font-weight-bold mt-2">
                            {{ formatCurrency(dashboard.totalRevenueToday) }}
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-row class="mb-4">
            <v-col cols="12">
                <v-card rounded="xl" elevation="2">
                    <v-card-title class="font-weight-bold">
                        Danh sách nhân viên ngày {{ displaySelectedDate || "hôm nay" }}
                    </v-card-title>

                    <v-data-table :headers="staffHeaders" :items="staffOverview" :loading="loading"
                        item-value="employeeId" class="elevation-0">
                        <template #item.totalRevenueToday="{ item }">
                            {{ formatCurrency(item.totalRevenueToday) }}
                        </template>

                        <template #item.actions="{ item }">
                            <v-btn color="primary" variant="tonal" size="small" @click="viewStaff(item)">
                                Xem
                            </v-btn>
                        </template>
                    </v-data-table>
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
                                <div class="font-weight-medium">{{ customer.customerName || "Khách lẻ" }}</div>
                            </template>

                            <template #subtitle>
                                <div>{{ customer.customerPhone || "Chưa có SĐT" }}</div>
                                <div class="mt-1">
                                    {{ customer.customerType === "ACCOUNT" ? "Khách có tài khoản" : "Khách tại quầy" }}
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
                            <div>{{ item.customerName || "Khách lẻ" }}</div>
                            <div class="text-caption text-medium-emphasis">
                                {{ item.customerPhone || "Không có SĐT" }}
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
                                            Đơn #{{ item.orderId }} - {{ item.trackingCode || "Chưa có mã vận đơn" }}
                                        </div>

                                        <div class="mb-2">
                                            Thanh toán: {{ item.paymentMethod || "-" }} / {{ item.paymentStatus || "-"
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
import { computed, onMounted, ref } from "vue"
import reportApi from "@/api/reportApi"

const loading = ref(false)
const keyword = ref("")
const selectedEmployeeId = ref(null)

const dateMenu = ref(false)
const selectedDate = ref(new Date())

const staffOptions = ref([
    { employeeId: null, displayName: "Tất cả nhân viên" },
])

const staffOverview = ref([])
const customers = ref([])
const purchaseHistory = ref([])

const dashboard = ref({
    employeeId: null,
    employeeName: "Tất cả nhân viên",
    totalOrdersToday: 0,
    totalProductsToday: 0,
    totalRevenueToday: 0,
})

const staffHeaders = [
    { title: "Tên nhân viên", key: "employeeName" },
    { title: "Email", key: "email" },
    { title: "Đơn", key: "totalOrdersToday" },
    { title: "Sản phẩm bán", key: "totalProductsToday" },
    { title: "Doanh thu", key: "totalRevenueToday" },
    { title: "Thao tác", key: "actions", sortable: false },
]

const historyHeaders = [
    { title: "Mã đơn", key: "orderId" },
    { title: "Mã vận đơn", key: "trackingCode" },
    { title: "Ngày mua", key: "orderDate" },
    { title: "Khách hàng", key: "customerName" },
    { title: "Nhân viên", key: "employeeName" },
    { title: "SL SP", key: "totalItems" },
    { title: "Tổng tiền", key: "totalAmount" },
    { title: "Trạng thái", key: "orderStatus" },
]

function toApiDate(value) {
    if (!value) return null

    if (typeof value === "string") return value

    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return null

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

const displaySelectedDate = computed(() => {
    const apiDate = toApiDate(selectedDate.value)
    if (!apiDate) return ""

    const [year, month, day] = apiDate.split("-")
    return `${day}/${month}/${year}`
})

async function loadStaffOptions() {
    try {
        const { data } = await reportApi.getAdminStaffOptions()
        staffOptions.value = [
            { employeeId: null, displayName: "Tất cả staff" },
            ...(data || []),
        ]
    } catch (error) {
        console.error("loadStaffOptions error", error)
    }
}

async function loadAll() {
    loading.value = true
    try {
        const employeeId = selectedEmployeeId.value || null
        const date = toApiDate(selectedDate.value)

        console.log("date gửi lên:", date)

        const [overviewRes, dashboardRes, customerRes, historyRes] = await Promise.all([
            reportApi.getAdminStaffOverviewToday(employeeId, date),
            reportApi.getAdminStaffToday(employeeId, date),
            reportApi.getAdminCustomerSummary(keyword.value, employeeId, date),
            reportApi.getAdminPurchaseHistory(keyword.value, employeeId, date),
        ])

        staffOverview.value = overviewRes.data || []
        dashboard.value = dashboardRes.data || {
            employeeId: null,
            employeeName: "Tất cả nhân viên",
            totalOrdersToday: 0,
            totalProductsToday: 0,
            totalRevenueToday: 0,
        }
        customers.value = customerRes.data || []
        purchaseHistory.value = historyRes.data || []
    } catch (error) {
        console.error("loadAll admin report error", error)
    } finally {
        loading.value = false
    }
}

function handleDateChange(value) {
    selectedDate.value = value
    dateMenu.value = false
    loadAll()
}

function resetDate() {
    selectedDate.value = new Date()
    loadAll()
}

function viewStaff(item) {
    selectedEmployeeId.value = item.employeeId
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
    return new Date(value).toLocaleString("vi-VN")
}

onMounted(async () => {
    await loadStaffOptions()
    await loadAll()
})
</script>