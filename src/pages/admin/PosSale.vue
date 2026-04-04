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
                            <v-text-field v-model="customerKeyword" label="Tìm khách hàng"
                                placeholder="Nhập tên, email, số điện thoại..." density="comfortable" variant="outlined"
                                prepend-inner-icon="mdi-magnify" @input="searchCustomers" />

                            <v-list v-if="customers.length" class="border rounded">
                                <v-list-item v-for="customer in customers" :key="getCustomerId(customer)"
                                    @click="selectCustomer(customer)">
                                    <template #prepend>
                                        <v-icon>mdi-account</v-icon>
                                    </template>

                                    <v-list-item-title>{{ getCustomerName(customer) }}</v-list-item-title>
                                    <v-list-item-subtitle>
                                        {{ getCustomerPhone(customer) }} - {{ customer.email || "" }}
                                    </v-list-item-subtitle>
                                </v-list-item>
                            </v-list>
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

                        <v-text-field v-model="guest.shippingAddress" label="Địa chỉ giao hàng" variant="outlined"
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

                                                    <v-chip size="x-small" color="error" variant="flat"
                                                        v-if="product.discountLabel">
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
                                :variant="getCurrentOrderId(order) === getCurrentOrderId(currentOrder) ? 'flat' : 'outlined'"
                                @click="switchOrder(order)">
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
                            {{ getCurrentOrderId(currentOrder) ? `#${getCurrentOrderId(currentOrder)}` : "Chưa tạo đơn"
                            }}
                        </v-chip>
                    </v-card-title>

                    <v-card-text>
                        <div class="mb-2"><strong>Trạng thái:</strong> {{ currentOrder?.status || "-" }}</div>
                        <div class="mb-2"><strong>Loại đơn:</strong> {{ currentOrder?.orderType || "OFFLINE" }}</div>
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

                        <v-text-field v-model="couponCode" label="Mã giảm giá" variant="outlined" density="comfortable">
                            <template #append>
                                <v-btn color="primary" variant="tonal" @click="handleApplyCoupon">
                                    Áp dụng
                                </v-btn>
                            </template>
                        </v-text-field>

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

                        <v-select v-model="checkoutForm.method" :items="paymentMethods" label="Phương thức thanh toán"
                            variant="outlined" density="comfortable" />

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

                        <v-btn class="mt-2" color="secondary" size="large" block variant="tonal"
                            :disabled="!getCurrentOrderId(currentOrder)" @click="printReceipt()">
                            In hóa đơn
                        </v-btn>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="2500">
            {{ snackbar.text }}
        </v-snackbar>

        <v-overlay :model-value="loading" class="align-center justify-center">
            <v-progress-circular indeterminate size="64" />
        </v-overlay>
    </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import posApi from "@/api/posApi"

const loading = ref(false)
const productKeyword = ref("")
const customerKeyword = ref("")
const products = ref([])
const customers = ref([])
const pendingOrders = ref([])
const currentOrder = ref(null)
const selectedCustomer = ref(null)
const customerMode = ref("guest")
const couponCode = ref("")

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

const paymentMethods = ["CASH", "BANKING", "QR"]

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

function getCustomerId(customer) {
    return customer.accountId || customer.id || customer.accountID
}

function getCustomerName(customer) {
    return customer?.fullName || customer?.username || customer?.name || ""
}

function getCustomerPhone(customer) {
    return customer?.phoneNumber || customer?.phone || ""
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

function resetOrderForm() {
    selectedCustomer.value = null
    customerMode.value = "guest"
    couponCode.value = ""

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

    couponCode.value = order.couponCode || ""
    customerMode.value = order.customerId ? "account" : "guest"
}

function selectCustomer(customer) {
    selectedCustomer.value = customer
    customerMode.value = "account"
    guest.value.customerName = getCustomerName(customer)
    guest.value.customerPhone = getCustomerPhone(customer)
}

async function saveOrderInfo() {
    try {
        const orderId = getCurrentOrderId(currentOrder.value)
        if (!orderId) {
            showMessage("Bạn cần tạo đơn chờ trước", "warning")
            return
        }

        loading.value = true

        const payload = {
            accountId:
                customerMode.value === "account"
                    ? (selectedCustomer.value
                        ? getCustomerId(selectedCustomer.value)
                        : (currentOrder.value?.customerId || null))
                    : null,
            customerName: guest.value.customerName || null,
            customerPhone: guest.value.customerPhone || null,
            note: guest.value.note || null,
            shippingAddress: guest.value.shippingAddress || null,
        }

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

async function searchCustomers() {
    try {
        const { data } = await posApi.searchCustomers(customerKeyword.value)
        customers.value = data || []
    } catch (error) {
        showMessage(error.response?.data?.message || "Không tải được khách hàng", "error")
    }
}

async function loadPendingOrders(preferredOrderId = null) {
    try {
        const { data } = await posApi.getPendingOrders()
        pendingOrders.value = data || []

        const targetId = preferredOrderId || getCurrentOrderId(currentOrder.value)

        if (targetId) {
            const matched = pendingOrders.value.find(
                (x) => getCurrentOrderId(x) === targetId
            )
            if (matched) {
                currentOrder.value = matched
                syncFormFromOrder(matched)
                return
            }
        }

        currentOrder.value = pendingOrders.value.length ? pendingOrders.value[0] : null
        syncFormFromOrder(currentOrder.value)
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

        const payload = {
            accountId:
                customerMode.value === "account" && selectedCustomer.value
                    ? getCustomerId(selectedCustomer.value)
                    : null,
            customerName: guest.value.customerName || null,
            customerPhone: guest.value.customerPhone || null,
            note: guest.value.note || null,
            shippingAddress: guest.value.shippingAddress || null,
        }

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

    const payload = {
        accountId:
            customerMode.value === "account" && selectedCustomer.value
                ? getCustomerId(selectedCustomer.value)
                : null,
        customerName: guest.value.customerName || null,
        customerPhone: guest.value.customerPhone || null,
        note: guest.value.note || null,
        shippingAddress: guest.value.shippingAddress || null,
    }

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

        loading.value = true
        const { data } = await posApi.applyCoupon(orderId, {
            couponCode: couponCode.value || "",
        })

        currentOrder.value = data
        await loadPendingOrders(orderId)
        showMessage(couponCode.value ? "Áp mã giảm giá thành công" : "Đã bỏ mã giảm giá")
    } catch (error) {
        showMessage(error.response?.data?.message || "Không áp dụng được mã giảm giá", "error")
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

        printReceipt(data)
        await loadPendingOrders()
        showMessage("Thanh toán thành công")
    } catch (error) {
        showMessage(error.response?.data?.message || "Thanh toán thất bại", "error")
    } finally {
        loading.value = false
    }
}

function printReceipt(order = currentOrder.value) {
    const orderId = getCurrentOrderId(order)
    if (!order || !orderId) return

    const items = order.items || order.orderDetails || []

    const htmlItems = items
        .map((item, index) => {
            return `
        <tr>
          <td>${index + 1}</td>
          <td>${getItemProductName(item)}</td>
          <td>${getItemColorName(item)}</td>
          <td>${getItemSizeName(item)}</td>
          <td>${getItemQuantity(item)}</td>
          <td>${formatCurrency(getItemPrice(item))}</td>
          <td>${formatCurrency(getItemLineTotal(item))}</td>
        </tr>
      `
        })
        .join("")

    const orderSubtotal = Number(order.subtotal || 0)
    const orderDiscount = Number(order.discountAmount || 0)
    const orderTotal = Number(order.totalAmount || 0)

    const html = `
    <html>
      <head>
        <title>Hoa don #${orderId}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          h2, p { margin: 6px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          table, th, td { border: 1px solid #333; }
          th, td { padding: 8px; text-align: left; font-size: 14px; }
          .summary { margin-top: 16px; width: 320px; margin-left: auto; }
          .summary div { display: flex; justify-content: space-between; margin: 6px 0; }
        </style>
      </head>
      <body>
        <h2>HOA DON BAN HANG</h2>
        <p><strong>Ma don:</strong> #${orderId}</p>
        <p><strong>Khach hang:</strong> ${order.customerName || "Khach le"}</p>
        <p><strong>So dien thoai:</strong> ${order.customerPhone || ""}</p>
        <p><strong>Trang thai:</strong> ${order.status || ""}</p>
        <p><strong>Phuong thuc thanh toan:</strong> ${checkoutForm.value.method}</p>

        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>San pham</th>
              <th>Mau</th>
              <th>Size</th>
              <th>SL</th>
              <th>Don gia</th>
              <th>Thanh tien</th>
            </tr>
          </thead>
          <tbody>
            ${htmlItems}
          </tbody>
        </table>

        <div class="summary">
          <div><span>Tam tinh:</span><strong>${formatCurrency(orderSubtotal)}</strong></div>
          <div><span>Giam gia:</span><strong>${formatCurrency(orderDiscount)}</strong></div>
          <div><span>Tong tien:</span><strong>${formatCurrency(orderTotal)}</strong></div>
          ${checkoutForm.value.method === "CASH"
            ? `<div><span>Tien khach dua:</span><strong>${formatCurrency(checkoutForm.value.cashReceived || 0)}</strong></div>
               <div><span>Tien thua:</span><strong>${formatCurrency(changeAmount.value)}</strong></div>`
            : ""
        }
        </div>
      </body>
    </html>
  `

    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
}

onMounted(async () => {
    await loadProducts()
    await loadPendingOrders()
})
</script>

<style scoped>
.border {
    border: 1px solid #e0e0e0;
}
</style>