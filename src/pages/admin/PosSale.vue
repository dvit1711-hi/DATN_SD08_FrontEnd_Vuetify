<template>
    <v-container fluid class="pa-4">
        <v-row>
            <v-col cols="12">
                <div class="text-h4 font-weight-bold mb-4">Bán hàng tại quầy</div>
            </v-col>
        </v-row>

        <v-row>
            <v-col cols="12" md="7">
                <v-card class="mb-4" rounded="lg">
                    <v-card-title>Thông tin khách hàng</v-card-title>
                    <v-card-text>
                        <v-radio-group v-model="customerMode" inline>
                            <v-radio label="Khách có tài khoản" value="account" />
                            <v-radio label="Khách lẻ" value="guest" />
                        </v-radio-group>

                        <div v-if="customerMode === 'account'">
                            <v-row>
                                <v-col cols="12" md="5">
                                    <v-text-field v-model="customerKeyword" label="Tìm khách có tài khoản"
                                        placeholder="Nhập tên, email, số điện thoại..." density="comfortable"
                                        variant="outlined" prepend-inner-icon="mdi-magnify" clearable
                                        :loading="customerLoading" @update:model-value="handleCustomerSearch"
                                        @click:clear="clearCustomerSearch" />
                                </v-col>

                                <v-col cols="12" md="7">
                                    <v-autocomplete v-model="selectedCustomer" :items="customers" item-title="plainName"
                                        item-value="accountId" label="Chọn khách hàng"
                                        placeholder="Chọn khách có tài khoản" density="comfortable" variant="outlined"
                                        prepend-inner-icon="mdi-account" return-object clearable no-filter hide-no-data
                                        :loading="customerLoading" no-data-text="Không có khách hàng phù hợp"
                                        class="customer-account-select" :menu-props="{ maxHeight: 320 }"
                                        @focus="openCustomerSearch" @update:model-value="handleCustomerSelect">
                                        <template #item="{ props, item }">
                                            <v-list-item v-bind="props" :title="getCustomerOptionName(item)"
                                                :subtitle="getCustomerOptionSubtitle(item)">
                                                <template #prepend>
                                                    <v-avatar size="34" color="grey-lighten-3">
                                                        <v-icon size="18">mdi-account</v-icon>
                                                    </v-avatar>
                                                </template>
                                            </v-list-item>
                                        </template>
                                    </v-autocomplete>
                                </v-col>
                            </v-row>
                        </div>

                        <div v-else>
                            <v-row>
                                <v-col cols="12" md="6">
                                    <v-text-field v-model="guest.customerName" label="Tên khách hàng" variant="outlined"
                                        density="comfortable" />
                                </v-col>
                                <v-col cols="12" md="6">
                                    <v-text-field v-model="guest.customerPhone" label="Số điện thoại" variant="outlined"
                                        density="comfortable" />
                                </v-col>
                            </v-row>
                        </div>

                        <v-textarea v-model="guest.note" label="Ghi chú" variant="outlined" rows="2"
                            density="comfortable" class="mt-2" />

                        <v-btn color="primary" variant="tonal" class="mt-2" block
                            :disabled="!getCurrentOrderId(currentOrder)" @click="saveOrderInfo">
                            Lưu thông tin đơn
                        </v-btn>
                    </v-card-text>
                </v-card>

                <v-card rounded="lg">
                    <v-card-title class="d-flex justify-space-between align-center">
                        <span>Danh sách sản phẩm</span>
                        <v-btn color="primary" variant="tonal" @click="loadProducts">Làm mới</v-btn>
                    </v-card-title>

                    <v-card-text>
                        <v-text-field v-model="productKeyword" label="Tìm sản phẩm" variant="outlined"
                            density="comfortable" prepend-inner-icon="mdi-magnify" @input="searchProducts" />

                        <v-row>
                            <v-col v-for="product in products" :key="getProductColorId(product)" cols="12" sm="6">
                                <v-card variant="outlined" class="h-100">
                                    <v-img :src="product.imageUrl || defaultImage" height="180" cover />
                                    <v-card-title class="text-subtitle-1">
                                        {{ product.productName }}
                                    </v-card-title>
                                    <v-card-subtitle>
                                        Màu: {{ product.colorName || "-" }} | Size: {{ product.sizeName || "-" }}
                                    </v-card-subtitle>

                                    <v-card-text>
                                        <div class="mb-2">
                                            <template v-if="product.discounted">
                                                <div class="text-caption text-grey text-decoration-line-through">
                                                    Giá gốc: {{ formatCurrency(product.originalPrice) }}
                                                </div>

                                                <div class="d-flex align-center ga-2">
                                                    <strong class="text-red-darken-1">
                                                        {{ formatCurrency(product.finalPrice || product.price) }}
                                                    </strong>

                                                    <v-chip v-if="product.discountLabel" size="x-small" color="error"
                                                        variant="flat">
                                                        {{ product.discountLabel }}
                                                    </v-chip>
                                                </div>
                                            </template>

                                            <template v-else>
                                                <div>
                                                    Giá:
                                                    <strong class="text-red-darken-1">
                                                        {{ formatCurrency(product.price) }}
                                                    </strong>
                                                </div>
                                            </template>
                                        </div>

                                        <div>
                                            Tồn kho:
                                            <strong>{{ product.stockQuantity ?? 0 }}</strong>
                                        </div>
                                    </v-card-text>

                                    <v-card-actions>
                                        <v-text-field v-model.number="product.tempQty" type="number" min="1"
                                            density="compact" variant="outlined" style="max-width: 100px"
                                            hide-details />
                                        <v-spacer />
                                        <v-btn color="primary" :disabled="(product.stockQuantity ?? 0) <= 0"
                                            @click="handleAddItem(product)">
                                            Thêm
                                        </v-btn>
                                    </v-card-actions>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="5">
                <v-card rounded="lg" class="mb-4">
                    <v-card-title class="d-flex justify-space-between align-center">
                        <span>Đơn hàng chờ</span>
                        <v-btn color="primary" @click="createPendingOrder" :disabled="pendingOrders.length >= 10">
                            Thêm đơn chờ
                        </v-btn>
                    </v-card-title>

                    <v-card-text>
                        <div v-if="pendingOrders.length" class="d-flex flex-wrap ga-2">
                            <v-chip v-for="order in pendingOrders" :key="getCurrentOrderId(order)"
                                :color="getCurrentOrderId(order) === getCurrentOrderId(currentOrder) ? 'primary' : ''"
                                :variant="getCurrentOrderId(order) === getCurrentOrderId(currentOrder)
                                    ? 'flat'
                                    : 'outlined'" @click="switchOrder(order)">
                                #{{ getCurrentOrderId(order) }} - {{ order.customerName || "Khách lẻ" }}
                                <v-icon end size="18" @click.stop="closePendingOrder(order)">
                                    mdi-close-circle
                                </v-icon>
                            </v-chip>
                        </div>

                        <div v-else class="text-grey">Chưa có đơn hàng chờ</div>

                        <div class="text-caption text-medium-emphasis mt-2">
                            Đã dùng {{ pendingOrders.length }}/10 đơn hàng chờ
                        </div>
                    </v-card-text>
                </v-card>

                <v-card rounded="lg" class="mb-4">
                    <v-card-title class="d-flex justify-space-between align-center">
                        <span>Đơn hàng hiện tại</span>
                        <v-chip color="primary" variant="tonal">
                            {{
                                getCurrentOrderId(currentOrder)
                                    ? `#${getCurrentOrderId(currentOrder)}`
                                    : "Chưa tạo đơn"
                            }}
                        </v-chip>
                    </v-card-title>

                    <v-card-text>
                        <div class="mb-2"><strong>Trạng thái:</strong> {{ currentOrder?.status || "-" }}</div>
                        <div class="mb-2"><strong>Loại đơn:</strong> {{ currentOrder?.orderType || "OFFLINE" }}</div>
                        <div class="mb-2">
                            <strong>PT thanh toán:</strong>
                            {{ getPaymentMethodLabel(currentOrder?.paymentMethod) }}
                        </div>
                        <div class="mb-2">
                            <strong>TT thanh toán:</strong>
                            {{ getPaymentStatusLabel(currentOrder?.paymentStatus) }}
                        </div>
                        <div class="mb-2">
                            <strong>Khách hàng:</strong>
                            {{ currentOrder?.customerName || guest.customerName || "Khách lẻ" }}
                        </div>
                        <div class="mb-4">
                            <strong>Số điện thoại:</strong>
                            {{ currentOrder?.customerPhone || guest.customerPhone || "-" }}
                        </div>

                        <v-divider class="mb-4" />

                        <div class="text-subtitle-1 font-weight-bold mb-2">Sản phẩm trong đơn</div>

                        <div v-if="orderItems.length">
                            <v-card v-for="item in orderItems" :key="getOrderDetailId(item)" variant="outlined"
                                class="mb-3">
                                <v-card-text>
                                    <div class="font-weight-bold">{{ getItemProductName(item) }}</div>

                                    <div class="text-body-2 text-grey-darken-1 mb-2">
                                        Màu: {{ getItemColorName(item) }} | Size: {{ getItemSizeName(item) }}
                                    </div>

                                    <div class="d-flex align-center ga-2 mb-2">
                                        <v-btn icon="mdi-minus" size="small" variant="outlined"
                                            @click="changeQty(item, getItemQuantity(item) - 1)" />
                                        <v-text-field :model-value="getItemQuantity(item)" type="number"
                                            density="compact" variant="outlined" style="max-width: 90px" hide-details
                                            @update:model-value="changeQty(item, Number($event))" />
                                        <v-btn icon="mdi-plus" size="small" variant="outlined"
                                            @click="changeQty(item, getItemQuantity(item) + 1)" />
                                        <v-spacer />
                                        <v-btn color="error" variant="text" @click="removeItem(item)">Xóa</v-btn>
                                    </div>

                                    <div class="d-flex justify-space-between">
                                        <span>Đơn giá:</span>
                                        <strong>{{ formatCurrency(getItemPrice(item)) }}</strong>
                                    </div>
                                    <div class="d-flex justify-space-between">
                                        <span>Thành tiền:</span>
                                        <strong>{{ formatCurrency(getItemLineTotal(item)) }}</strong>
                                    </div>
                                </v-card-text>
                            </v-card>
                        </div>

                        <div v-else class="text-grey mb-4">Chưa có sản phẩm trong đơn</div>

                        <v-divider class="my-4" />

                        <v-card variant="outlined" class="mb-4">
                            <v-card-title>Ưu đãi đơn hàng</v-card-title>

                            <v-card-text>
                                <div class="mb-3">
                                    <div class="text-subtitle-2 font-weight-medium mb-2">Chọn ưu đãi có sẵn</div>

                                    <v-select v-model="selectedPromotionCode" :items="promotionComboItems"
                                        item-title="title" item-value="value" label="Chọn ưu đãi" variant="outlined"
                                        density="comfortable" clearable return-object
                                        :disabled="!getCurrentOrderId(currentOrder)"
                                        no-data-text="Chưa có ưu đãi khả dụng">
                                        <template #item="{ props, item }">
                                            <v-list-item v-bind="props" :subtitle="item.raw.subtitle">
                                                <template #append>
                                                    <v-chip v-if="item.raw.applied" color="success" size="x-small"
                                                        variant="flat">
                                                        Đang áp dụng
                                                    </v-chip>

                                                    <v-chip v-else-if="item.raw.eligible" color="primary" size="x-small"
                                                        variant="tonal">
                                                        Có thể áp dụng
                                                    </v-chip>

                                                    <v-chip v-else color="grey" size="x-small" variant="outlined">
                                                        Chưa đủ điều kiện
                                                    </v-chip>
                                                </template>
                                            </v-list-item>
                                        </template>
                                    </v-select>

                                    <div class="d-flex ga-2 mt-2">
                                        <v-btn color="primary" variant="tonal"
                                            :disabled="!getCurrentOrderId(currentOrder) || !selectedPromotionCode"
                                            @click="handlePromotionCombobox">
                                            Áp dụng ưu đãi đã chọn
                                        </v-btn>

                                        <v-btn color="error" variant="text" :disabled="!currentOrder?.couponCode"
                                            @click="removePromotion">
                                            Bỏ ưu đãi
                                        </v-btn>
                                    </div>
                                </div>

                                <v-divider class="my-4" />

                                <div>
                                    <div class="text-subtitle-2 font-weight-medium mb-2">Nhập mã đặc biệt</div>

                                    <v-text-field v-model="couponCode" label="Mã giảm giá"
                                        placeholder="Nhập mã rồi bấm áp dụng" variant="outlined" density="comfortable"
                                        :disabled="!getCurrentOrderId(currentOrder)">
                                        <template #append>
                                            <v-btn color="primary" variant="tonal" :disabled="!getCurrentOrderId(currentOrder) ||
                                                !String(couponCode || '').trim()" @click="handleApplyCoupon">
                                                Áp dụng mã
                                            </v-btn>
                                        </template>
                                    </v-text-field>
                                </div>

                                <div v-if="currentOrder?.couponCode" class="text-caption mt-2">
                                    Mã đang áp dụng:
                                    <strong>{{ currentOrder.couponCode }}</strong>
                                </div>
                            </v-card-text>
                        </v-card>

                        <div class="d-flex justify-space-between mb-2">
                            <span>Tạm tính:</span>
                            <strong>{{ formatCurrency(subtotal) }}</strong>
                        </div>
                        <div class="d-flex justify-space-between mb-2">
                            <span>Giảm giá:</span>
                            <strong class="text-green-darken-2">{{ formatCurrency(discountAmount) }}</strong>
                        </div>
                        <div class="d-flex justify-space-between text-h6">
                            <span>Tổng thanh toán:</span>
                            <strong class="text-red-darken-1">{{ formatCurrency(totalAmount) }}</strong>
                        </div>

                        <v-divider class="my-4" />

                        <v-select v-model="checkoutForm.method" :items="paymentMethods" item-title="title"
                            item-value="value" label="Phương thức thanh toán" variant="outlined"
                            density="comfortable" />

                        <v-text-field v-if="checkoutForm.method === 'CASH'" v-model.number="checkoutForm.cashReceived"
                            type="number" label="Tiền khách đưa" variant="outlined" density="comfortable" />

                        <div v-if="checkoutForm.method === 'CASH' && checkoutForm.cashReceived"
                            class="d-flex justify-space-between mb-4">
                            <span>Tiền thừa:</span>
                            <strong>{{ formatCurrency(changeAmount) }}</strong>
                        </div>

                        <v-btn color="success" size="large" block :disabled="!canCheckout" @click="handleCheckout">
                            Xác nhận thanh toán
                        </v-btn>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-dialog v-model="bankingDialog" max-width="520">
            <v-card rounded="lg">
                <v-card-title>Thanh toán chuyển khoản</v-card-title>

                <v-card-text v-if="bankingInfo">
                    <div class="text-center mb-4">
                        <v-img :src="bankingInfo.qrUrl" max-width="280" class="mx-auto" contain />
                    </div>

                    <div class="mb-2">
                        <strong>Ngân hàng:</strong> {{ bankingInfo.bankName }}
                    </div>
                    <div class="mb-2">
                        <strong>Số tài khoản:</strong> {{ bankingInfo.accountNumber }}
                    </div>
                    <div class="mb-2">
                        <strong>Chủ tài khoản:</strong> {{ bankingInfo.accountName }}
                    </div>
                    <div class="mb-2">
                        <strong>Số tiền:</strong> {{ formatCurrency(bankingInfo.amount) }}
                    </div>
                    <div class="mb-2">
                        <strong>Nội dung CK:</strong> {{ bankingInfo.transferContent }}
                    </div>

                    <div class="text-caption text-medium-emphasis mt-3">
                        Khách quét QR để chuyển khoản. Sau đó admin xác nhận ở màn hình quản lý thanh toán.
                    </div>
                </v-card-text>

                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="bankingDialog = false">Đóng</v-btn>
                    <v-btn color="success" variant="flat" :loading="confirmingBankingPayment"
                        @click="confirmBankingPayment">
                        Xác nhận thanh toán
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="2500">
            {{ snackbar.text }}
        </v-snackbar>

        <v-overlay :model-value="loading" class="align-center justify-center">
            <v-progress-circular indeterminate size="64" />
        </v-overlay>
    </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from "vue"
import JsBarcode from "jsbarcode"
import posApi from "@/api/posApi"
import paymentApi from "@/api/paymentApi"

const loading = ref(false)
const customerLoading = ref(false)
const productKeyword = ref("")
const customerKeyword = ref("")
const products = ref([])
const customers = ref([])
const pendingOrders = ref([])
const currentOrder = ref(null)
const selectedCustomer = ref(null)
const customerMode = ref("guest")
const couponCode = ref("")
const promotionOptions = ref([])
const selectedPromotionCode = ref(null)
const bankingDialog = ref(false)
const bankingInfo = ref(null)
const confirmingBankingPayment = ref(false)
let customerSearchTimer = null

const guest = ref({
    customerName: "",
    customerPhone: "",
    note: "",
    shippingAddress: "",
})

const checkoutForm = ref({
    method: "CASH",
    cashReceived: null,
})

const paymentMethods = [
    { title: "Tiền mặt", value: "CASH" },
    { title: "Chuyển khoản MB Bank", value: "BANKING" },
]

const snackbar = ref({
    show: false,
    text: "",
    color: "success",
})

const defaultImage = "https://via.placeholder.com/400x250?text=No+Image"

function getCurrentOrderId(order) {
    return order?.orderId || order?.id || null
}

const orderItems = computed(() => {
    return currentOrder.value?.items || currentOrder.value?.orderDetails || []
})

const subtotal = computed(() => {
    if (currentOrder.value?.subtotal != null) return Number(currentOrder.value.subtotal)
    return orderItems.value.reduce((sum, item) => sum + getItemLineTotal(item), 0)
})

const totalAmount = computed(() => Number(currentOrder.value?.totalAmount || 0))

const discountAmount = computed(() => {
    if (currentOrder.value?.discountAmount != null) {
        return Number(currentOrder.value.discountAmount)
    }
    const diff = subtotal.value - totalAmount.value
    return diff > 0 ? diff : 0
})

const changeAmount = computed(() => {
    if (checkoutForm.value.method !== "CASH") return 0
    const cash = Number(checkoutForm.value.cashReceived || 0)
    const total = Number(totalAmount.value || 0)
    const change = cash - total
    return change > 0 ? change : 0
})

const canCheckout = computed(() => {
    if (!getCurrentOrderId(currentOrder.value)) return false
    if (!orderItems.value.length) return false
    if (checkoutForm.value.method === "CASH") {
        return Number(checkoutForm.value.cashReceived || 0) >= Number(totalAmount.value || 0)
    }
    return true
})

function showMessage(text, color = "success") {
    snackbar.value = { show: true, text, color }
}

function formatCurrency(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(Number(value || 0))
}

function getPaymentMethodLabel(method) {
    switch (String(method || "").toUpperCase()) {
        case "CASH":
            return "Tiền mặt"
        case "BANKING":
            return "Chuyển khoản"
        default:
            return method || "-"
    }
}

function getPaymentStatusLabel(status) {
    switch (String(status || "").toUpperCase()) {
        case "PAID":
            return "Đã thanh toán"
        case "UNPAID":
            return "Chưa thanh toán"
        case "CANCELLED":
            return "Đã hủy"
        default:
            return status || "-"
    }
}

function stripPhoneFromDisplayName(value) {
    if (!value) return ""

    return String(value)
        .replace(/\s*[-–]\s*\+?\d{8,15}\s*$/, "")
        .trim()
}

function normalizeCustomer(customer) {
    const accountId =
        customer?.accountId ??
        customer?.id ??
        customer?.accountID ??
        null

    const rawName =
        customer?.fullName ||
        customer?.username ||
        customer?.name ||
        customer?.customerName ||
        customer?.displayName ||
        customer?.email ||
        ""

    const plainName =
        stripPhoneFromDisplayName(rawName) ||
        (accountId ? `Khách hàng #${accountId}` : "Khách hàng")

    const displayPhone =
        customer?.phoneNumber ||
        customer?.phone ||
        customer?.displayPhone ||
        ""

    const displayEmail =
        customer?.email ||
        customer?.displayEmail ||
        ""

    return {
        ...customer,
        accountId,
        plainName,
        displayPhone,
        displayEmail,
        displayName: plainName,
        displayLabel: [plainName, displayPhone].filter(Boolean).join(" - "),
        displaySubtitle: [displayPhone, displayEmail].filter(Boolean).join(" • "),
    }
}

function getCustomerId(customer) {
    return customer?.accountId || customer?.id || customer?.accountID || null
}

function getCustomerName(customer) {
    return (
        customer?.plainName ||
        customer?.displayName ||
        customer?.fullName ||
        customer?.username ||
        customer?.name ||
        customer?.customerName ||
        stripPhoneFromDisplayName(customer?.displayName) ||
        customer?.email ||
        ""
    )
}

function getCustomerPhone(customer) {
    return customer?.displayPhone || customer?.phoneNumber || customer?.phone || ""
}

function getCustomerOptionName(item) {
    const raw = item?.raw || item || {}
    return getCustomerName(raw) || "Khách hàng"
}

function getCustomerOptionSubtitle(item) {
    const raw = item?.raw || item || {}

    return (
        [getCustomerPhone(raw), raw?.displayEmail || raw?.email]
            .filter(Boolean)
            .join(" • ") ||
        "Chưa có số điện thoại / email"
    )
}

function getProductColorId(product) {
    return product.productColorId || product.id || product.productColorID
}

function getOrderDetailId(item) {
    return item.orderDetailId || item.id || item.orderDetailsID
}

function getItemQuantity(item) {
    return Number(item.quantity || 0)
}

function getItemPrice(item) {
    return Number(item.price || item.unitPrice || 0)
}

function getItemLineTotal(item) {
    if (item.lineTotal != null) return Number(item.lineTotal)
    return getItemPrice(item) * getItemQuantity(item)
}

function getItemProductName(item) {
    return item.productName || "Sản phẩm"
}

function getItemColorName(item) {
    return item.colorName || "-"
}

function getItemSizeName(item) {
    return item.sizeName || "-"
}

function buildPromotionComboItem(promo) {
    const statusText = promo.applied
        ? "Đang áp dụng"
        : promo.eligible
            ? "Có thể áp dụng"
            : "Chưa đủ điều kiện"

    const missingText =
        !promo.eligible && Number(promo.missingAmount || 0) > 0
            ? ` - Cần thêm ${formatCurrency(promo.missingAmount)}`
            : ""

    return {
        title: `${promo.name || promo.couponCode} (${promo.couponCode})`,
        value: promo.couponCode,
        subtitle: `${statusText} - Giảm dự kiến ${formatCurrency(promo.estimatedDiscount)}${missingText}`,
        eligible: promo.eligible,
        applied: promo.applied,
        raw: promo,
    }
}

const promotionComboItems = computed(() => {
    return (promotionOptions.value || []).map(buildPromotionComboItem)
})

function getSelectedPromotionCodeValue() {
    const selected = selectedPromotionCode.value

    if (!selected) return ""

    if (typeof selected === "string") {
        return selected.trim()
    }

    if (typeof selected === "object") {
        return String(
            selected.value ||
            selected.couponCode ||
            selected.raw?.couponCode ||
            ""
        ).trim()
    }

    return String(selected).trim()
}

function buildCustomerPayload() {
    const isAccountCustomer = customerMode.value === "account"

    return {
        accountId: isAccountCustomer
            ? (selectedCustomer.value
                ? getCustomerId(selectedCustomer.value)
                : (currentOrder.value?.customerId || null))
            : null,
        customerName: isAccountCustomer
            ? (selectedCustomer.value
                ? getCustomerName(selectedCustomer.value)
                : (guest.value.customerName || null))
            : (guest.value.customerName || null),
        customerPhone: isAccountCustomer
            ? (selectedCustomer.value
                ? getCustomerPhone(selectedCustomer.value)
                : (guest.value.customerPhone || null))
            : (guest.value.customerPhone || null),
        note: guest.value.note || null,
        shippingAddress: guest.value.shippingAddress || null,
    }
}

function resetOrderForm() {
    selectedCustomer.value = null
    customerMode.value = "guest"
    couponCode.value = ""
    selectedPromotionCode.value = null
    promotionOptions.value = []
    bankingDialog.value = false
    bankingInfo.value = null
    customerKeyword.value = ""
    customers.value = []

    guest.value = {
        customerName: "",
        customerPhone: "",
        note: "",
        shippingAddress: "",
    }

    checkoutForm.value = {
        method: "CASH",
        cashReceived: null,
    }
}

function syncFormFromOrder(order) {
    if (!order) {
        resetOrderForm()
        return
    }

    guest.value.customerName = order.customerName || ""
    guest.value.customerPhone = order.customerPhone || ""
    guest.value.note = order.note || ""
    guest.value.shippingAddress = order.shippingAddress || ""

    couponCode.value = ""
    customerKeyword.value = ""
    customerMode.value = order.customerId ? "account" : "guest"

    if (order.customerId) {
        selectedCustomer.value = normalizeCustomer({
            accountId: order.customerId,
            fullName: order.customerName || "",
            phoneNumber: order.customerPhone || "",
            email: order.email || "",
        })
    } else {
        selectedCustomer.value = null
    }

    if (order.paymentMethod) {
        checkoutForm.value.method = order.paymentMethod
    } else {
        checkoutForm.value.method = "CASH"
    }

    if (checkoutForm.value.method !== "CASH") {
        checkoutForm.value.cashReceived = null
    }
}

function handleCustomerSelect(customer) {
    if (!customer || typeof customer !== "object") {
        selectedCustomer.value = null
        guest.value.customerName = ""
        guest.value.customerPhone = ""
        return
    }

    const normalizedCustomer = normalizeCustomer(customer)
    selectedCustomer.value = normalizedCustomer
    guest.value.customerName = normalizedCustomer.plainName || ""
    guest.value.customerPhone = normalizedCustomer.displayPhone || ""
}

async function loadCustomers(keyword = "") {
    try {
        customerLoading.value = true
        const { data } = await posApi.searchCustomers(String(keyword || "").trim())
        customers.value = Array.isArray(data) ? data.map(normalizeCustomer) : []
    } catch (error) {
        customers.value = []
        showMessage(error.response?.data?.message || "Không tải được khách hàng", "error")
    } finally {
        customerLoading.value = false
    }
}

function handleCustomerSearch(value) {
    customerKeyword.value = value || ""

    if (customerSearchTimer) {
        clearTimeout(customerSearchTimer)
    }

    customerSearchTimer = setTimeout(() => {
        loadCustomers(customerKeyword.value)
    }, 300)
}

function clearCustomerSearch() {
    customerKeyword.value = ""
    loadCustomers("")
}

async function openCustomerSearch() {
    if (!customers.value.length) {
        await loadCustomers(customerKeyword.value)
    }
}

async function saveOrderInfo() {
    try {
        const orderId = getCurrentOrderId(currentOrder.value)
        if (!orderId) {
            showMessage("Bạn cần tạo đơn chờ trước", "warning")
            return
        }

        loading.value = true

        const payload = buildCustomerPayload()

        const { data } = await posApi.updateOrderInfo(orderId, payload)
        currentOrder.value = data
        syncFormFromOrder(data)
        await loadPendingOrders(orderId)

        showMessage("Đã lưu thông tin đơn hàng")
    } catch (error) {
        showMessage(error.response?.data?.message || "Không lưu được thông tin đơn hàng", "error")
    } finally {
        loading.value = false
    }
}

async function loadProducts() {
    try {
        loading.value = true
        const { data } = await posApi.searchProducts(productKeyword.value)
        products.value = (data || []).map((item) => ({
            ...item,
            tempQty: 1,
        }))
    } catch (error) {
        showMessage(error.response?.data?.message || "Không tải được sản phẩm", "error")
    } finally {
        loading.value = false
    }
}

async function searchProducts() {
    await loadProducts()
}

async function loadPromotions() {
    try {
        const orderId = getCurrentOrderId(currentOrder.value)
        if (!orderId) {
            promotionOptions.value = []
            selectedPromotionCode.value = null
            return
        }

        const { data } = await posApi.getAvailablePromotions(orderId)
        promotionOptions.value = Array.isArray(data) ? data : []

        const appliedPromo = promotionOptions.value.find((x) => x.applied)
        selectedPromotionCode.value = appliedPromo ? buildPromotionComboItem(appliedPromo) : null
    } catch (error) {
        showMessage(error.response?.data?.message || "Không tải được ưu đãi", "error")
        promotionOptions.value = []
        selectedPromotionCode.value = null
    }
}

async function loadPendingOrders(preferredOrderId = null) {
    try {
        const { data } = await posApi.getPendingOrders()

        const allOrders = Array.isArray(data) ? data : []
        pendingOrders.value = allOrders.filter(isPendingOrder)

        const targetId = preferredOrderId || getCurrentOrderId(currentOrder.value)

        if (targetId) {
            const matched = pendingOrders.value.find(
                (x) => getCurrentOrderId(x) === targetId
            )
            if (matched) {
                currentOrder.value = matched
                syncFormFromOrder(matched)
                await loadPromotions()
                return
            }
        }

        currentOrder.value = pendingOrders.value.length ? pendingOrders.value[0] : null
        syncFormFromOrder(currentOrder.value)
        await loadPromotions()
    } catch (error) {
        showMessage(error.response?.data?.message || "Không tải được đơn hàng chờ", "error")
    }
}

async function createPendingOrder() {
    try {
        if (pendingOrders.value.length >= 10) {
            showMessage("Chỉ được tạo tối đa 10 đơn hàng chờ", "warning")
            return
        }

        loading.value = true

        const payload = buildCustomerPayload()

        const { data } = await posApi.createOfflineOrder(payload)
        currentOrder.value = data
        syncFormFromOrder(data)

        await loadPendingOrders(getCurrentOrderId(data))
        showMessage("Tạo đơn hàng chờ thành công")
    } catch (error) {
        showMessage(error.response?.data?.message || "Không thể tạo đơn hàng chờ", "error")
    } finally {
        loading.value = false
    }
}

async function switchOrder(order) {
    try {
        loading.value = true
        const { data } = await posApi.getOrder(getCurrentOrderId(order))
        currentOrder.value = data
        syncFormFromOrder(data)
        await loadPromotions()
    } catch (error) {
        showMessage(error.response?.data?.message || "Không tải được đơn hàng", "error")
    } finally {
        loading.value = false
    }
}

async function closePendingOrder(order) {
    try {
        loading.value = true
        const orderId = getCurrentOrderId(order)

        await posApi.cancelPendingOrder(orderId)
        await loadPendingOrders()

        showMessage("Đã đóng đơn hàng chờ")
    } catch (error) {
        showMessage(error.response?.data?.message || "Không đóng được đơn hàng chờ", "error")
    } finally {
        loading.value = false
    }
}

async function ensureOrderCreated() {
    const existedOrderId = getCurrentOrderId(currentOrder.value)
    if (existedOrderId) return existedOrderId

    if (pendingOrders.value.length >= 10) {
        throw new Error("Bạn đã đạt tối đa 10 đơn hàng chờ")
    }

    const payload = buildCustomerPayload()

    const { data } = await posApi.createOfflineOrder(payload)
    currentOrder.value = data
    syncFormFromOrder(data)
    await loadPendingOrders(getCurrentOrderId(data))

    return getCurrentOrderId(data)
}

async function handleAddItem(product) {
    try {
        loading.value = true
        const orderId = await ensureOrderCreated()

        await posApi.addItem(orderId, {
            productColorId: getProductColorId(product),
            quantity: Number(product.tempQty || 1),
        })

        const { data } = await posApi.getOrder(orderId)
        currentOrder.value = data
        await loadPendingOrders(orderId)
        showMessage("Thêm sản phẩm vào đơn thành công")
    } catch (error) {
        showMessage(error.response?.data?.message || error.message || "Không thể thêm sản phẩm", "error")
    } finally {
        loading.value = false
    }
}

async function changeQty(item, newQty) {
    try {
        const quantity = Number(newQty)
        if (!quantity || quantity <= 0) return

        const orderId = getCurrentOrderId(currentOrder.value)
        if (!orderId) return

        loading.value = true
        await posApi.updateItem(orderId, getOrderDetailId(item), { quantity })

        const { data } = await posApi.getOrder(orderId)
        currentOrder.value = data
        await loadPendingOrders(orderId)
    } catch (error) {
        showMessage(error.response?.data?.message || "Không cập nhật được số lượng", "error")
    } finally {
        loading.value = false
    }
}

async function removeItem(item) {
    try {
        const orderId = getCurrentOrderId(currentOrder.value)
        if (!orderId) return

        loading.value = true
        await posApi.removeItem(orderId, getOrderDetailId(item))

        const { data } = await posApi.getOrder(orderId)
        currentOrder.value = data
        await loadPendingOrders(orderId)
        showMessage("Đã xóa sản phẩm khỏi đơn")
    } catch (error) {
        showMessage(error.response?.data?.message || "Không xóa được sản phẩm", "error")
    } finally {
        loading.value = false
    }
}

async function handleApplyCoupon() {
    try {
        const orderId = getCurrentOrderId(currentOrder.value)
        if (!orderId) {
            showMessage("Bạn cần tạo đơn trước", "warning")
            return
        }

        const code = String(couponCode.value || "").trim()
        if (!code) {
            showMessage("Vui lòng nhập mã giảm giá", "warning")
            return
        }

        loading.value = true
        const { data } = await posApi.applyCoupon(orderId, {
            couponCode: code,
        })

        currentOrder.value = data
        couponCode.value = ""
        await loadPendingOrders(orderId)
        await loadPromotions()
        showMessage("Áp mã giảm giá thành công")
    } catch (error) {
        showMessage(error.response?.data?.message || "Không áp dụng được mã giảm giá", "error")
    } finally {
        loading.value = false
    }
}

async function handlePromotionCombobox() {
    const orderId = getCurrentOrderId(currentOrder.value)
    if (!orderId) {
        showMessage("Bạn cần tạo đơn trước", "warning")
        return
    }

    const code = getSelectedPromotionCodeValue()

    if (!code) {
        showMessage("Vui lòng chọn ưu đãi", "warning")
        return
    }

    const promo = promotionOptions.value.find((x) => x.couponCode === code)

    if (!promo) {
        showMessage("Không tìm thấy ưu đãi đã chọn", "warning")
        return
    }

    if (!promo.eligible && !promo.applied) {
        showMessage("Ưu đãi này chưa đủ điều kiện áp dụng", "warning")
        return
    }

    await applyPromotion(promo)
}

async function applyPromotion(promo) {
    try {
        const orderId = getCurrentOrderId(currentOrder.value)
        if (!orderId) return

        loading.value = true
        const { data } = await posApi.applyCoupon(orderId, {
            couponCode: promo.couponCode,
        })

        currentOrder.value = data
        couponCode.value = ""
        await loadPendingOrders(orderId)
        await loadPromotions()
        showMessage("Áp dụng ưu đãi thành công")
    } catch (error) {
        showMessage(error.response?.data?.message || "Không áp dụng được ưu đãi", "error")
    } finally {
        loading.value = false
    }
}

async function removePromotion() {
    try {
        const orderId = getCurrentOrderId(currentOrder.value)
        if (!orderId) return

        loading.value = true
        const { data } = await posApi.applyCoupon(orderId, {
            couponCode: "",
        })

        currentOrder.value = data
        couponCode.value = ""
        selectedPromotionCode.value = null
        await loadPendingOrders(orderId)
        await loadPromotions()
        showMessage("Đã bỏ ưu đãi")
    } catch (error) {
        showMessage(error.response?.data?.message || "Không bỏ được ưu đãi", "error")
    } finally {
        loading.value = false
    }
}

async function handleCheckout() {
    try {
        const orderId = getCurrentOrderId(currentOrder.value)
        if (!orderId) {
            showMessage("Chưa có đơn hàng", "warning")
            return
        }

        if (!orderItems.value.length) {
            showMessage("Đơn hàng chưa có sản phẩm", "warning")
            return
        }

        loading.value = true

        const { data } = await posApi.checkout(orderId, {
            method: checkoutForm.value.method,
            cashReceived:
                checkoutForm.value.method === "CASH"
                    ? Number(checkoutForm.value.cashReceived || 0)
                    : null,
        })

        if (checkoutForm.value.method === "CASH") {
            currentOrder.value = data
            printReceipt(data)
            await loadPendingOrders()
            showMessage("Thanh toán thành công")
            return
        }

        if (checkoutForm.value.method === "BANKING") {
            currentOrder.value = data

            const bankRes = await posApi.getMBBankInfo(orderId)
            bankingInfo.value = bankRes.data
            bankingDialog.value = true

            showMessage("Đã tạo yêu cầu chuyển khoản")
            return
        }
    } catch (error) {
        showMessage(error.response?.data?.message || "Thanh toán thất bại", "error")
    } finally {
        loading.value = false
    }
}

async function confirmBankingPayment() {
    try {
        const orderId = getCurrentOrderId(currentOrder.value)
        if (!orderId) {
            showMessage("Không tìm thấy đơn hàng", "warning")
            return
        }

        confirmingBankingPayment.value = true

        await paymentApi.confirmPayment(orderId)

        const { data: fullOrder } = await posApi.getOrder(orderId)
        currentOrder.value = fullOrder

        printReceipt(fullOrder)

        bankingDialog.value = false
        bankingInfo.value = null

        checkoutForm.value = {
            method: "CASH",
            cashReceived: null,
        }

        await loadPendingOrders()
        showMessage("Xác nhận thanh toán thành công")
    } catch (error) {
        showMessage(error.response?.data?.message || "Xác nhận thanh toán thất bại", "error")
    } finally {
        confirmingBankingPayment.value = false
    }
}

function isPendingOrder(order) {
    return String(order?.status || "")
        .trim()
        .toUpperCase() === "PENDING"
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
}

function formatDateTime(value) {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    const pad = (n) => String(n).padStart(2, "0")
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function getEmployeeName(order) {
    return (
        order?.employeeName ||
        order?.staffName ||
        order?.createdByName ||
        order?.employee?.fullName ||
        order?.employee?.name ||
        "Nhân viên cửa hàng"
    )
}

function getOrderCode(order) {
    const rawId = getCurrentOrderId(order)

    if (order?.trackingCode) return order.trackingCode
    if (order?.tracking_code) return order.tracking_code
    if (order?.orderCode) return order.orderCode
    if (order?.code) return order.code

    return `HD${String(rawId || 0).padStart(6, "0")}`
}

function getOrderCreatedAt(order) {
    return (
        order?.orderDate ||
        order?.createdAt ||
        order?.createdDate ||
        order?.paymentTime ||
        new Date().toISOString()
    )
}

function getReceiptStoreInfo() {
    return {
        phone: "0123456789",
        email: "fshoesweb@gmail.com",
        address: "Địa chỉ cửa hàng của bạn",
        logoUrl: "/images/logo1.jpg",
    }
}

function buildReceiptHtml(order, options = {}) {
    const store = getReceiptStoreInfo()

    const items =
        (Array.isArray(order?.items) && order.items) ||
        (Array.isArray(order?.orderDetails) && order.orderDetails) ||
        (Array.isArray(order?.details) && order.details) ||
        []

    const orderId = getCurrentOrderId(order)
    const orderCode = getOrderCode(order)
    const orderDate = formatDateTime(getOrderCreatedAt(order))
    const employeeName = getEmployeeName(order)

    const paymentMethod = String(order?.paymentMethod || checkoutForm.value.method || "").toUpperCase()
    const paymentStatus = String(order?.paymentStatus || "").toUpperCase()

    const orderSubtotal = Number(
        order?.subtotal ??
        order?.subTotal ??
        order?.totalBeforeDiscount ??
        0
    )

    const orderDiscount = Number(
        order?.discountAmount ??
        order?.discount ??
        0
    )

    const shippingFee = Number(
        order?.shippingFee ??
        order?.deliveryFee ??
        0
    )

    const orderTotal = Number(
        order?.totalAmount ??
        order?.total ??
        0
    )

    const cashReceived = Number(options.cashReceived ?? 0)
    const cashChange = Number(options.cashChange ?? 0)

    const transferContent = bankingInfo.value?.transferContent || orderCode
    const transferAmount = Number(bankingInfo.value?.amount || orderTotal)

    const itemRows = items.length
        ? items.map((item, index) => `
            <tr>
                <td class="center">${index + 1}</td>
                <td>
                    <div class="product-name">${escapeHtml(getItemProductName(item))}</div>
                    <div class="product-sub">
                        ${escapeHtml(getItemColorName(item))} / ${escapeHtml(getItemSizeName(item))}
                    </div>
                </td>
                <td class="center">${getItemQuantity(item)}</td>
                <td class="right">${formatCurrency(getItemPrice(item))}</td>
                <td class="right">${formatCurrency(getItemLineTotal(item))}</td>
                <td class="center">${escapeHtml(order?.status || "")}</td>
            </tr>
        `).join("")
        : `
            <tr>
                <td colspan="6" class="center empty-row">Không có sản phẩm</td>
            </tr>
        `

    const headerLogoBlock = store.logoUrl
        ? `<img src="${store.logoUrl}" alt="logo" class="header-logo" />`
        : `<div class="header-logo-empty"></div>`

    const watermarkBlock = store.logoUrl
        ? `<img src="${store.logoUrl}" alt="logo" class="watermark-logo" />`
        : ""

    const barcodeBlock = `
        <div class="barcode-box">
            <svg id="barcode-order"></svg>
            <div class="barcode-label">Mã hóa đơn: ${escapeHtml(orderCode)}</div>
        </div>
    `

    const cashBlock = paymentMethod === "CASH"
        ? `
            <div class="summary-row">
                <span>Tiền khách đưa:</span>
                <strong>${formatCurrency(cashReceived)}</strong>
            </div>
            <div class="summary-row">
                <span>Tiền thừa:</span>
                <strong>${formatCurrency(cashChange)}</strong>
            </div>
        `
        : ""

    const bankingBlock = paymentMethod === "BANKING"
        ? `
            <div class="banking-box">
                <div><strong>Ngân hàng:</strong> ${escapeHtml(bankingInfo.value?.bankName || "MB Bank")}</div>
                <div><strong>Số tài khoản:</strong> ${escapeHtml(bankingInfo.value?.accountNumber || "")}</div>
                <div><strong>Chủ tài khoản:</strong> ${escapeHtml(bankingInfo.value?.accountName || "")}</div>
                <div><strong>Nội dung CK:</strong> ${escapeHtml(transferContent)}</div>
                <div><strong>Số tiền CK:</strong> ${formatCurrency(transferAmount)}</div>
            </div>
        `
        : ""

    return `
    <html>
        <head>
            <title>Hóa đơn bán hàng #${orderId}</title>
            <style>
                @page {
                    size: A5 portrait;
                    margin: 10mm;
                }

                * {
                    box-sizing: border-box;
                }

                body {
                    margin: 0;
                    font-family: Arial, Helvetica, sans-serif;
                    background: #fff;
                    color: #111;
                    font-size: 13px;
                }

                .receipt {
                    position: relative;
                    width: 100%;
                    min-height: 100vh;
                    padding: 8px 8px 0;
                }

                .content {
                    position: relative;
                    z-index: 1;
                }

                .top-header {
                    display: grid;
                    grid-template-columns: 150px 1fr 220px;
                    gap: 12px;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .logo-box {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .header-logo {
                    width: 140px;
                    max-height: 80px;
                    object-fit: contain;
                }

                .header-logo-empty {
                    width: 140px;
                    height: 80px;
                }

                .shop-info {
                    text-align: center;
                }

                .shop-name {
                    font-size: 28px;
                    font-weight: 700;
                    margin-bottom: 6px;
                }

                .shop-line {
                    margin: 2px 0;
                    font-size: 13px;
                }

                .barcode-box {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }

                .barcode-label {
                    margin-top: 6px;
                    font-size: 12px;
                    font-weight: 700;
                    text-align: center;
                }

                .title {
                    text-align: center;
                    font-size: 30px;
                    font-weight: 800;
                    margin: 14px 0 12px;
                    text-transform: uppercase;
                }

                .meta {
                    display: flex;
                    justify-content: space-between;
                    gap: 16px;
                    margin-bottom: 10px;
                }

                .meta-col {
                    width: 48%;
                    line-height: 1.55;
                }

                .section-title {
                    text-align: center;
                    font-size: 15px;
                    font-weight: 700;
                    margin: 10px 0 6px;
                    text-transform: uppercase;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 4px;
                    background: transparent;
                }

                th, td {
                    border: 1px solid #111;
                    padding: 6px 7px;
                    vertical-align: top;
                    font-size: 12.5px;
                }

                th {
                    text-align: center;
                    font-weight: 700;
                }

                .center {
                    text-align: center;
                }

                .right {
                    text-align: right;
                    white-space: nowrap;
                }

                .product-name {
                    font-weight: 700;
                    line-height: 1.35;
                }

                .product-sub {
                    margin-top: 2px;
                    color: #444;
                    font-size: 11px;
                }

                .empty-row {
                    padding: 14px 0;
                }

                .bottom-area {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 20px;
                    margin-top: 12px;
                }

                .left-note {
                    flex: 1;
                    min-height: 120px;
                }

                .summary {
                    width: 270px;
                    margin-left: auto;
                }

                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    gap: 12px;
                    margin: 4px 0;
                    font-size: 14px;
                }

                .summary-row.total {
                    font-size: 18px;
                    font-weight: 800;
                    margin-top: 8px;
                }

                .banking-box {
                    margin-top: 10px;
                    padding-top: 8px;
                    border-top: 1px dashed #444;
                    line-height: 1.55;
                    font-size: 12.5px;
                }

                .watermark-logo {
                    position: absolute;
                    left: 50%;
                    top: 57%;
                    transform: translate(-50%, -50%);
                    width: 320px;
                    opacity: 0.06;
                    z-index: 0;
                    pointer-events: none;
                }

                .footer {
                    text-align: center;
                    margin-top: 16px;
                    font-size: 12px;
                    color: #333;
                }
            </style>
        </head>
        <body>
            <div class="receipt">
                ${watermarkBlock}
                <div class="content">
                    <div class="top-header">
                        <div class="logo-box">
                            ${headerLogoBlock}
                        </div>

                        <div class="shop-info">
                            <div class="shop-name">${escapeHtml(store.name)}</div>
                            <div class="shop-line"><strong>Số điện thoại:</strong> ${escapeHtml(store.phone)}</div>
                            <div class="shop-line"><strong>Email:</strong> ${escapeHtml(store.email)}</div>
                            <div class="shop-line">${escapeHtml(store.address)}</div>
                        </div>

                        ${barcodeBlock}
                    </div>

                    <div class="title">HÓA ĐƠN BÁN HÀNG</div>

                    <div class="meta">
                        <div class="meta-col">
                            <div><strong>Khách hàng:</strong> ${escapeHtml(order?.customerName || "Khách lẻ")}</div>
                            <div><strong>Địa chỉ nhận hàng:</strong> ${escapeHtml(order?.shippingAddress || "Tại cửa hàng")}</div>
                            <div><strong>Nhân viên:</strong> ${escapeHtml(employeeName)}</div>
                        </div>

                        <div class="meta-col" style="text-align:right;">
                            <div><strong>Mã hóa đơn:</strong> ${escapeHtml(orderCode)}</div>
                            <div><strong>Ngày tạo:</strong> ${escapeHtml(orderDate)}</div>
                            <div><strong>Trạng thái:</strong> ${escapeHtml(order?.status || (paymentStatus === "PAID" ? "Hoàn thành" : ""))}</div>
                        </div>
                    </div>

                    <div class="section-title">Danh sách sản phẩm</div>

                    <table>
                        <thead>
                            <tr>
                                <th style="width: 40px;">STT</th>
                                <th>Tên sản phẩm</th>
                                <th style="width: 70px;">Số lượng</th>
                                <th style="width: 110px;">Đơn giá</th>
                                <th style="width: 120px;">Thành tiền</th>
                                <th style="width: 90px;">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemRows}
                        </tbody>
                    </table>

                    <div class="bottom-area">
                        <div class="left-note"></div>

                        <div class="summary">
                            <div class="summary-row">
                                <span>Tổng tiền hàng:</span>
                                <strong>${formatCurrency(orderSubtotal)}</strong>
                            </div>
                            <div class="summary-row">
                                <span>Giảm giá:</span>
                                <strong>${formatCurrency(orderDiscount)}</strong>
                            </div>
                            <div class="summary-row">
                                <span>Phí giao hàng:</span>
                                <strong>${formatCurrency(shippingFee)}</strong>
                            </div>
                            <div class="summary-row total">
                                <span>Tổng tiền cần thanh toán:</span>
                                <strong>${formatCurrency(orderTotal)}</strong>
                            </div>

                            ${cashBlock}
                            ${bankingBlock}
                        </div>
                    </div>

                    <div class="footer">
                        Cảm ơn quý khách đã mua hàng
                    </div>
                </div>
            </div>
        </body>
    </html>
    `
}

function printReceipt(order = currentOrder.value) {
    const orderId = getCurrentOrderId(order)
    if (!order || !orderId) return

    const html = buildReceiptHtml(order, {
        cashReceived: checkoutForm.value.method === "CASH"
            ? Number(checkoutForm.value.cashReceived || 0)
            : 0,
        cashChange: checkoutForm.value.method === "CASH"
            ? Number(changeAmount.value || 0)
            : 0,
    })

    const printWindow = window.open("", "_blank", "width=900,height=1200")
    if (!printWindow) return

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()

    printWindow.onload = () => {
        const barcodeEl = printWindow.document.getElementById("barcode-order")

        if (barcodeEl) {
            JsBarcode(barcodeEl, getOrderCode(order), {
                format: "CODE128",
                width: 1.5,
                height: 42,
                displayValue: false,
                margin: 0,
            })
        }

        setTimeout(() => {
            printWindow.focus()
            printWindow.print()
        }, 200)
    }
}

watch(customerMode, async (mode) => {
    if (mode === "account") {
        await loadCustomers(customerKeyword.value)
    } else {
        customerKeyword.value = ""
        customers.value = []
        selectedCustomer.value = null
    }
})

onBeforeUnmount(() => {
    if (customerSearchTimer) {
        clearTimeout(customerSearchTimer)
    }
})

onMounted(async () => {
    await loadProducts()
    await loadPendingOrders()
})
</script>

<style scoped>
.border {
    border: 1px solid #e0e0e0;
}

.customer-account-select :deep(.v-field) {
    border-radius: 12px;
}
</style>