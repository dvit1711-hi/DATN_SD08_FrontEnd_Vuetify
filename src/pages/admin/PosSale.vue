<template>
    <div class="pos-root">

        <!-- Header -->
        <div class="pos-header">
            <div>
                <div class="pos-title">Bán hàng tại quầy</div>
            </div>
        </div>

        <!-- Body -->
        <div class="pos-layout">

            <!-- ═══ LEFT ═══ -->
            <div class="pos-col">

                <!-- Customer -->
                <div class="sc-card">
                    <div class="sc-card-header">
                        <div class="sc-card-icon">👤</div>
                        <span class="sc-card-title">Khách hàng</span>
                        <button class="sc-btn sc-btn-soft sc-btn-xs ml-auto"
                            :disabled="!getCurrentOrderId(currentOrder)" @click="saveOrderInfo">Lưu thông tin</button>
                    </div>
                    <div class="sc-card-body">

                        <!-- Radio pills -->
                        <div class="radio-pill-row">
                            <label :class="['radio-pill', customerMode === 'account' && 'active']">
                                <input type="radio" v-model="customerMode" value="account" />
                                Có tài khoản
                            </label>
                            <label :class="['radio-pill', customerMode === 'guest' && 'active']">
                                <input type="radio" v-model="customerMode" value="guest" />
                                Khách lẻ
                            </label>
                        </div>

                        <!-- Account mode -->
                        <div v-if="customerMode === 'account'" class="sc-row">
                            <div class="sc-field">
                                <label class="sc-label">Tìm khách hàng</label>
                                <v-text-field v-model="customerKeyword" placeholder="Tên, SĐT, email..."
                                    density="compact" variant="outlined" prepend-inner-icon="mdi-magnify" hide-details
                                    clearable :loading="customerLoading" class="sc-vuetify-field"
                                    @update:model-value="handleCustomerSearch" @click:clear="clearCustomerSearch" />
                            </div>
                            <div class="sc-field">
                                <label class="sc-label">Chọn khách</label>
                                <v-autocomplete v-model="selectedCustomer" :items="customers" item-title="plainName"
                                    item-value="accountId" placeholder="Chọn khách có tài khoản" density="compact"
                                    variant="outlined" prepend-inner-icon="mdi-account" return-object clearable
                                    no-filter hide-no-data hide-details :loading="customerLoading"
                                    no-data-text="Không có kết quả" class="sc-vuetify-field"
                                    :menu-props="{ maxHeight: 300 }" @focus="openCustomerSearch"
                                    @update:model-value="handleCustomerSelect">
                                    <template #item="{ props, item }">
                                        <v-list-item v-bind="props" :title="getCustomerOptionName(item)"
                                            :subtitle="getCustomerOptionSubtitle(item)" density="compact">
                                            <template #prepend>
                                                <v-avatar size="26" color="primary" variant="tonal">
                                                    <v-icon size="13">mdi-account</v-icon>
                                                </v-avatar>
                                            </template>
                                        </v-list-item>
                                    </template>
                                </v-autocomplete>
                            </div>
                        </div>

                        <!-- Guest mode -->
                        <div v-else class="sc-row">
                            <div class="sc-field">
                                <label class="sc-label">Tên khách</label>
                                <v-text-field v-model="guest.customerName" placeholder="Họ tên khách hàng"
                                    density="compact" variant="outlined" hide-details class="sc-vuetify-field" />
                            </div>
                            <div class="sc-field">
                                <label class="sc-label">Số điện thoại</label>
                                <v-text-field v-model="guest.customerPhone" placeholder="0901 234 567" density="compact"
                                    variant="outlined" :error="!!phoneErrors"
                                    @update:model-value="phoneErrors = validatePhone($event)"
                                    class="sc-vuetify-field" />
                                <div v-if="phoneErrors" style="color: #d32f2f; font-size: 12px; margin-top: 4px;">{{
                                    phoneErrors }}</div>
                            </div>
                        </div>

                        <div class="sc-field mt-2">
                            <label class="sc-label">Ghi chú</label>
                            <v-textarea v-model="guest.note" placeholder="Ghi chú đơn hàng..." density="compact"
                                variant="outlined" rows="2" hide-details class="sc-vuetify-field" />
                        </div>

                    </div>
                </div>

                <!-- Products -->
                <div class="sc-card">
                    <div class="sc-card-header">
                        <div class="sc-card-icon">📦</div>
                        <span class="sc-card-title">Sản phẩm</span>
                        <button class="sc-btn-icon ml-auto" @click="loadProducts" title="Làm mới">
                            <v-icon size="16">mdi-refresh</v-icon>
                        </button>
                    </div>
                    <div class="sc-card-body">
                        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                            <v-text-field v-model="productKeyword" placeholder="🔍  Tìm theo tên, mã, màu, hãng..."
                                density="compact" variant="outlined" clearable hide-details class="sc-vuetify-field"
                                @update:model-value="handleProductSearch" @keyup.enter="loadProducts" />
                            <v-btn icon="mdi-qrcode-scan" size="small" variant="tonal" @click="openQRScanner"
                                title="Quét mã QR" />
                        </div>

                        <div class="product-grid">
                            <div v-for="product in products" :key="getProductColorId(product)" class="product-card">
                                <div class="product-thumb">
                                    <v-img :src="product.imageUrl || defaultImage" height="130" cover />
                                    <span v-if="product.discounted && product.discountLabel" class="product-badge">
                                        {{ product.discountLabel }}
                                    </span>
                                </div>
                                <div class="product-info">
                                    <div class="product-name">{{ product.productName }}</div>
                                    <div class="product-meta-line">
                                        {{ product.colorName || '—' }} · {{ product.sizeName || '—' }} · {{
                                            product.productColorCode || '—' }}
                                    </div>
                                    <div class="product-price-row">
                                        <span class="price-main">{{ formatCurrency(product.finalPrice || product.price)
                                        }}</span>
                                        <span v-if="product.discounted" class="price-old">{{
                                            formatCurrency(product.originalPrice) }}</span>
                                    </div>
                                    <div class="stock-row">
                                        <span class="stock-label">Tồn kho</span>
                                        <span
                                            :class="['stock-count', (product.stockQuantity ?? 0) > 5 ? 'stock-ok' : (product.stockQuantity ?? 0) > 0 ? 'stock-low' : 'stock-out']">
                                            {{ product.stockQuantity ?? 0 }}
                                        </span>
                                    </div>
                                </div>
                                <div class="product-footer">
                                    <input v-model.number="product.tempQty" type="number" min="1"
                                        class="qty-input-sm" />
                                    <button
                                        :class="['sc-btn sc-btn-primary', (product.stockQuantity ?? 0) <= 0 && 'sc-btn-disabled']"
                                        style="flex:1;justify-content:center"
                                        :disabled="(product.stockQuantity ?? 0) <= 0" @click="handleAddItem(product)">+
                                        Thêm</button>
                                </div>
                            </div>
                        </div>

                        <div v-if="!products.length" class="empty-state">
                            <div class="empty-state-icon">📭</div>
                            <div class="empty-state-text">Không có sản phẩm</div>
                        </div>

                    </div>
                </div>
            </div>

            <!-- ═══ RIGHT ═══ -->
            <div class="pos-col">

                <!-- Pending orders -->
                <div class="sc-card">
                    <div class="sc-card-header">
                        <div class="sc-card-icon">🕐</div>
                        <span class="sc-card-title">Đơn chờ</span>
                        <span class="sc-chip sc-chip-primary" style="margin-left:6px">{{ pendingOrders.length
                        }}/10</span>
                        <button class="sc-btn sc-btn-primary sc-btn-xs ml-auto" :disabled="pendingOrders.length >= 10"
                            @click="createPendingOrder">+ Tạo đơn</button>
                    </div>
                    <div class="sc-card-body">
                        <div v-if="pendingOrders.length" class="pending-bar">
                            <div v-for="order in pendingOrders" :key="getCurrentOrderId(order)"
                                :class="['order-tab', getCurrentOrderId(order) === getCurrentOrderId(currentOrder) && 'active']"
                                @click="switchOrder(order)">
                                <span>#{{ getCurrentOrderId(order) }} · {{ order.customerName || 'Khách lẻ' }}</span>
                                <span class="order-tab-close" @click.stop="closePendingOrder(order)">✕</span>
                            </div>
                        </div>
                        <div v-else class="empty-inline">Chưa có đơn chờ nào</div>

                        <div class="usage-bar-wrap">
                            <div class="usage-bar-label">Đã dùng {{ pendingOrders.length }} / 10 đơn chờ</div>
                            <div class="usage-bar-track">
                                <div class="usage-bar-fill" :style="{ width: (pendingOrders.length / 10 * 100) + '%' }">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Current order -->
                <div class="sc-card">
                    <div class="sc-card-header">
                        <div class="sc-card-icon">🧾</div>
                        <span class="sc-card-title">Đơn hiện tại</span>
                        <span
                            :class="['sc-chip ml-auto', currentOrder?.status === 'PENDING_PAYMENT' ? 'sc-chip-amber' : 'sc-chip-grey']">
                            {{ getCurrentOrderId(currentOrder) ? `#${getCurrentOrderId(currentOrder)}` : 'Chưa tạo' }}
                        </span>
                    </div>
                    <div class="sc-card-body">

                        <!-- Meta pills -->
                        <div class="meta-pills">
                            <div class="meta-pill">
                                <span class="meta-pill-label">Khách hàng</span>
                                <span class="meta-pill-value">{{ currentOrder?.customerName || guest.customerName ||
                                    'Khách lẻ' }}</span>
                            </div>
                            <div class="meta-pill">
                                <span class="meta-pill-label">SĐT</span>
                                <span class="meta-pill-value">{{ currentOrder?.customerPhone || guest.customerPhone ||
                                    '—' }}</span>
                            </div>
                            <div class="meta-pill">
                                <span class="meta-pill-label">Loại đơn</span>
                                <span class="meta-pill-value">{{ currentOrder?.orderType || 'OFFLINE' }}</span>
                            </div>
                            <div class="meta-pill">
                                <span class="meta-pill-label">Thanh toán</span>
                                <span class="meta-pill-value">{{ getPaymentMethodLabel(currentOrder?.paymentMethod)
                                }}</span>
                            </div>
                        </div>

                        <div class="sc-divider" />

                        <!-- Order items -->
                        <div class="section-label">
                            <span>Sản phẩm trong đơn</span>
                        </div>

                        <div v-if="orderItems.length" class="order-items-list">
                            <div v-for="item in orderItems" :key="getOrderDetailId(item)" class="order-item">
                                <div class="order-item-info">
                                    <div class="order-item-name">{{ getItemProductName(item) }}</div>
                                    <div class="order-item-sub">{{ getItemColorName(item) }} / {{ getItemSizeName(item)
                                    }}</div>
                                </div>
                                <div class="qty-ctrl">
                                    <button class="qty-btn"
                                        @click="changeQty(item, getItemQuantity(item) - 1)">−</button>
                                    <span class="qty-val">{{ getItemQuantity(item) }}</span>
                                    <button class="qty-btn"
                                        @click="changeQty(item, getItemQuantity(item) + 1)">+</button>
                                </div>
                                <div class="order-item-price">
                                    <div class="price-line">{{ formatCurrency(getItemLineTotal(item)) }}</div>
                                    <div class="price-unit-small">{{ formatCurrency(getItemPrice(item)) }} / cái</div>
                                </div>
                                <button class="sc-btn-danger-ghost" @click="removeItem(item)">
                                    <v-icon size="16">mdi-trash-can-outline</v-icon>
                                </button>
                            </div>
                        </div>
                        <div v-else class="empty-inline">Chưa có sản phẩm trong đơn</div>

                        <div class="sc-divider" />

                        <!-- Promotions -->
                        <div class="section-label"><span>Ưu đãi</span></div>

                        <v-select v-model="selectedPromotionCode" :items="promotionComboItems" item-title="title"
                            item-value="value" placeholder="Chọn ưu đãi có sẵn..." density="compact" variant="outlined"
                            clearable return-object hide-details :disabled="!getCurrentOrderId(currentOrder)"
                            no-data-text="Chưa có ưu đãi" class="sc-vuetify-field mb-2">
                            <template #item="{ props, item }">
                                <v-list-item v-bind="props" :subtitle="item.raw.subtitle" density="compact">
                                    <template #append>
                                        <span v-if="item.raw.applied" class="sc-chip sc-chip-green"
                                            style="font-size:11px">Đang dùng</span>
                                        <span v-else-if="item.raw.eligible" class="sc-chip sc-chip-primary"
                                            style="font-size:11px">Khả dụng</span>
                                        <span v-else class="sc-chip sc-chip-grey" style="font-size:11px">Chưa đủ
                                            ĐK</span>
                                    </template>
                                </v-list-item>
                            </template>
                        </v-select>

                        <div class="promo-actions">
                            <button class="sc-btn sc-btn-soft sc-btn-xs"
                                :disabled="!getCurrentOrderId(currentOrder) || !selectedPromotionCode"
                                @click="handlePromotionCombobox">Áp dụng</button>
                            <button class="sc-btn sc-btn-danger-text sc-btn-xs" :disabled="!currentOrder?.couponCode"
                                @click="removePromotion">Bỏ ưu đãi</button>
                        </div>

                        <div v-if="currentOrder?.couponCode" class="promo-applied-tag">
                            <v-icon size="13" color="success">mdi-check-circle</v-icon>
                            Đang dùng: <strong>{{ currentOrder.couponCode }}</strong>
                        </div>

                        <div class="sc-divider" />

                        <!-- Summary -->
                        <div class="summary-box">
                            <div class="summary-row">
                                <span>Tạm tính</span>
                                <span>{{ formatCurrency(subtotal) }}</span>
                            </div>
                            <div class="summary-row summary-discount">
                                <span>Giảm giá</span>
                                <span>− {{ formatCurrency(discountAmount) }}</span>
                            </div>
                            <div class="summary-row summary-total">
                                <span>Tổng thanh toán</span>
                                <span class="total-amount">{{ formatCurrency(totalAmount) }}</span>
                            </div>
                        </div>

                        <div class="sc-divider" />

                        <!-- Payment method cards -->
                        <div class="section-label"><span>Phương thức thanh toán</span></div>
                        <div class="pay-method-row">
                            <div :class="['pay-method-card', checkoutForm.method === 'CASH' && 'active']"
                                @click="checkoutForm.method = 'CASH'">
                                <span class="pay-icon">💵</span>
                                <span>Tiền mặt</span>
                            </div>
                            <div :class="['pay-method-card', checkoutForm.method === 'BANKING' && 'active']"
                                @click="checkoutForm.method = 'BANKING'">
                                <span class="pay-icon">🏦</span>
                                <span>Chuyển khoản</span>
                            </div>
                        </div>

                        <div v-if="checkoutForm.method === 'CASH'" class="sc-field mb-2">
                            <label class="sc-label">Tiền khách đưa</label>
                            <v-text-field v-model.number="checkoutForm.cashReceived" type="number"
                                placeholder="Nhập số tiền..." density="compact" variant="outlined" hide-details
                                class="sc-vuetify-field" />
                        </div>

                        <div v-if="checkoutForm.method === 'CASH' && checkoutForm.cashReceived" class="change-callout">
                            <span>Tiền thừa trả lại</span>
                            <strong>{{ formatCurrency(changeAmount) }}</strong>
                        </div>

                        <button :class="['sc-btn sc-btn-success', !canCheckout && 'sc-btn-disabled']"
                            :disabled="!canCheckout" @click="handleCheckout">
                            ✓ &nbsp; Xác nhận thanh toán
                        </button>

                    </div>
                </div>
            </div>
        </div>

        <!-- Banking Dialog -->
        <v-dialog v-model="bankingDialog" max-width="460">
            <v-card rounded="xl">
                <div class="banking-dialog-header">
                    <v-icon color="primary" size="20">mdi-bank-transfer</v-icon>
                    <span>Thanh toán chuyển khoản</span>
                </div>
                <v-card-text v-if="bankingInfo" style="padding:16px 20px">
                    <div style="text-align:center;margin-bottom:16px">
                        <v-img :src="bankingInfo.qrUrl" max-width="200" class="mx-auto" contain />
                    </div>
                    <div class="banking-info-box">
                        <div class="banking-row"><span>Ngân hàng</span><strong>{{ bankingInfo.bankName }}</strong></div>
                        <div class="banking-row"><span>Số tài khoản</span><strong>{{ bankingInfo.accountNumber
                        }}</strong></div>
                        <div class="banking-row"><span>Chủ tài khoản</span><strong>{{ bankingInfo.accountName
                        }}</strong></div>
                        <div class="banking-row"><span>Số tiền</span><strong style="color:#6172f3">{{
                            formatCurrency(bankingInfo.amount) }}</strong></div>
                        <div class="banking-row"><span>Nội dung</span><strong>{{ bankingInfo.transferContent }}</strong>
                        </div>
                    </div>
                    <p style="font-size:12px;color:#98a2b3;text-align:center;margin-top:12px">Khách quét QR chuyển
                        khoản, sau đó xác nhận bên dưới.</p>
                </v-card-text>
                <v-card-actions style="padding:0 16px 16px">
                    <v-btn variant="text" @click="bankingDialog = false">Đóng</v-btn>
                    <v-spacer />
                    <v-btn color="success" variant="flat" :loading="confirmingBankingPayment"
                        @click="confirmBankingPayment">
                        Xác nhận đã nhận tiền
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- QR Scanner Dialog -->
        <v-dialog v-model="qrScannerDialog" max-width="420" @update:model-value="v => { if (!v) stopScanner() }">
            <v-card rounded="xl">
                <div class="banking-dialog-header">
                    <v-icon color="primary" size="20">mdi-qrcode-scan</v-icon>
                    <span>Quét mã QR sản phẩm</span>
                </div>
                <v-card-text style="padding:20px">

                    <!-- Camera view -->
                    <div v-if="scannerVisible"
                        style="position:relative;border-radius:12px;overflow:hidden;background:#000;aspect-ratio:4/3">
                        <video id="barcode-video" style="width:100%;height:100%;object-fit:cover" autoplay muted
                            playsinline />
                        <!-- Khung ngắm -->
                        <div
                            style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none">
                            <div
                                style="position:relative;width:180px;height:180px;border:2px solid rgba(97,114,243,0.6);border-radius:16px;box-shadow:0 0 0 2000px rgba(0,0,0,0.5)">
                                <!-- 4 góc -->
                                <div
                                    style="position:absolute;top:-3px;left:-3px;width:28px;height:28px;border-top:4px solid #6172f3;border-left:4px solid #6172f3;border-radius:6px 0 0 0">
                                </div>
                                <div
                                    style="position:absolute;top:-3px;right:-3px;width:28px;height:28px;border-top:4px solid #6172f3;border-right:4px solid #6172f3;border-radius:0 6px 0 0">
                                </div>
                                <div
                                    style="position:absolute;bottom:-3px;left:-3px;width:28px;height:28px;border-bottom:4px solid #6172f3;border-left:4px solid #6172f3;border-radius:0 0 0 6px">
                                </div>
                                <div
                                    style="position:absolute;bottom:-3px;right:-3px;width:28px;height:28px;border-bottom:4px solid #6172f3;border-right:4px solid #6172f3;border-radius:0 0 6px 0">
                                </div>
                                <!-- Scan line animation -->
                                <div class="qr-scan-line"></div>
                            </div>
                        </div>
                        <!-- Loading overlay -->
                        <div v-if="scannerLoading"
                            style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);gap:10px">
                            <v-progress-circular indeterminate color="primary" size="36" />
                            <span style="color:#fff;font-size:13px;font-weight:600">Đang khởi động camera...</span>
                        </div>
                    </div>

                    <!-- Hint text -->
                    <p v-if="scannerVisible && !scannerLoading"
                        style="text-align:center;font-size:12px;color:#98a2b3;margin:10px 0 0">
                        Hướng camera vào mã QR hoặc barcode sản phẩm
                    </p>

                    <!-- Manual input fallback -->
                    <div style="margin-top:14px">
                        <div
                            style="font-size:11px;font-weight:700;color:#98a2b3;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">
                            Hoặc nhập mã thủ công
                        </div>
                        <div style="display:flex;gap:8px">
                            <v-text-field v-model="qrInputValue" placeholder="Nhập mã sản phẩm..." density="compact"
                                variant="outlined" clearable hide-details class="sc-vuetify-field"
                                @keyup.enter="handleQRScan" />
                            <v-btn color="primary" variant="flat" @click="handleQRScan">Tìm</v-btn>
                        </div>
                    </div>

                </v-card-text>
                <v-card-actions style="padding:0 16px 16px">
                    <v-btn variant="text" @click="stopScanner">Đóng</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Snackbar -->
        <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="2500" location="bottom right" rounded="lg">
            {{ snackbar.text }}
        </v-snackbar>

        <!-- Loading overlay -->
        <v-overlay :model-value="loading" class="align-center justify-center">
            <v-progress-circular indeterminate size="48" color="primary" />
        </v-overlay>

    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from "vue"
import { BrowserMultiFormatReader } from "@zxing/browser"
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
const qrScannerDialog = ref(false)
const qrInputValue = ref("")
const scannerLoading = ref(false)
const scannerVisible = ref(false)
let customerSearchTimer = null
let productSearchTimer = null
const phoneErrors = ref("")

// ZXing reader instance — created once, reused
const codeReader = new BrowserMultiFormatReader()

const guest = ref({ customerName: "", customerPhone: "", note: "", shippingAddress: "" })

function validatePhone(phone) {
    const value = String(phone || "").trim()
    if (!value) return ""
    if (!/^0\d{9}$/.test(value)) return "Số điện thoại phải bắt đầu bằng 0 và có 10 chữ số"
    return ""
}
const checkoutForm = ref({ method: "CASH", cashReceived: null })
const snackbar = ref({ show: false, text: "", color: "success" })
const defaultImage = "https://via.placeholder.com/400x250?text=No+Image"

function getCurrentOrderId(order) { return order?.orderId || order?.id || null }

const orderItems = computed(() => currentOrder.value?.items || currentOrder.value?.orderDetails || [])
const subtotal = computed(() => {
    if (currentOrder.value?.subtotal != null) return Number(currentOrder.value.subtotal)
    return orderItems.value.reduce((sum, item) => sum + getItemLineTotal(item), 0)
})
const totalAmount = computed(() => Number(currentOrder.value?.totalAmount || 0))
const discountAmount = computed(() => {
    if (currentOrder.value?.discountAmount != null) return Number(currentOrder.value.discountAmount)
    const diff = subtotal.value - totalAmount.value
    return diff > 0 ? diff : 0
})
const changeAmount = computed(() => {
    if (checkoutForm.value.method !== "CASH") return 0
    const change = Number(checkoutForm.value.cashReceived || 0) - Number(totalAmount.value || 0)
    return change > 0 ? change : 0
})
const canCheckout = computed(() => {
    if (!getCurrentOrderId(currentOrder.value) || !orderItems.value.length) return false
    if (checkoutForm.value.method === "CASH") return Number(checkoutForm.value.cashReceived || 0) >= Number(totalAmount.value || 0)
    return true
})

function showMessage(text, color = "success") { snackbar.value = { show: true, text, color } }
function formatCurrency(value) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0))
}
function getPaymentMethodLabel(method) {
    const m = String(method || "").toUpperCase()
    return m === "CASH" ? "Tiền mặt" : m === "BANKING" ? "Chuyển khoản" : method || "—"
}
function stripPhoneFromDisplayName(value) {
    return String(value || "").replace(/\s*[-–]\s*\+?\d{8,15}\s*$/, "").trim()
}
function normalizeCustomer(customer) {
    const accountId = customer?.accountId ?? customer?.id ?? customer?.accountID ?? null
    const rawName = customer?.fullName || customer?.username || customer?.name || customer?.customerName || customer?.email || ""
    const plainName = stripPhoneFromDisplayName(rawName) || (accountId ? `Khách hàng #${accountId}` : "Khách hàng")
    const displayPhone = customer?.phoneNumber || customer?.phone || ""
    const displayEmail = customer?.email || ""
    return { ...customer, accountId, plainName, displayPhone, displayEmail, displayName: plainName }
}
function getCustomerId(c) { return c?.accountId || c?.id || c?.accountID || null }
function getCustomerName(c) { return c?.plainName || c?.displayName || c?.fullName || c?.username || c?.name || c?.customerName || c?.email || "" }
function getCustomerPhone(c) { return c?.displayPhone || c?.phoneNumber || c?.phone || "" }
function getCustomerOptionName(item) { return getCustomerName(item?.raw || item) || "Khách hàng" }
function getCustomerOptionSubtitle(item) {
    const raw = item?.raw || item
    return [getCustomerPhone(raw), raw?.displayEmail || raw?.email].filter(Boolean).join(" • ") || "Chưa có SĐT / email"
}
function getProductColorId(p) { return p.productColorId || p.id || p.productColorID }
function getOrderDetailId(item) { return item.orderDetailId || item.id || item.orderDetailsID }
function getItemQuantity(item) { return Number(item.quantity || 0) }
function getItemPrice(item) { return Number(item.price || item.unitPrice || 0) }
function getItemLineTotal(item) { return item.lineTotal != null ? Number(item.lineTotal) : getItemPrice(item) * getItemQuantity(item) }
function getItemProductName(item) { return item.productName || "Sản phẩm" }
function getItemColorName(item) { return item.colorName || "—" }
function getItemSizeName(item) { return item.sizeName || "—" }

function buildPromotionComboItem(promo) {
    const statusText = promo.applied ? "Đang áp dụng" : promo.eligible ? "Có thể áp dụng" : "Chưa đủ điều kiện"
    const missingText = !promo.eligible && Number(promo.missingAmount || 0) > 0 ? ` - Cần thêm ${formatCurrency(promo.missingAmount)}` : ""
    return {
        title: `${promo.name || promo.couponCode} (${promo.couponCode})`,
        value: promo.couponCode,
        subtitle: `${statusText} - Giảm dự kiến ${formatCurrency(promo.estimatedDiscount)}${missingText}`,
        eligible: promo.eligible, applied: promo.applied, raw: promo,
    }
}
const promotionComboItems = computed(() => (promotionOptions.value || []).map(buildPromotionComboItem))

function getSelectedPromotionCodeValue() {
    const s = selectedPromotionCode.value
    if (!s) return ""
    if (typeof s === "string") return s.trim()
    if (typeof s === "object") return String(s.value || s.couponCode || s.raw?.couponCode || "").trim()
    return String(s).trim()
}

function buildCustomerPayload() {
    const isAccount = customerMode.value === "account"
    return {
        accountId: isAccount ? (selectedCustomer.value ? getCustomerId(selectedCustomer.value) : (currentOrder.value?.customerId || null)) : null,
        customerName: isAccount ? (selectedCustomer.value ? getCustomerName(selectedCustomer.value) : (guest.value.customerName || null)) : (guest.value.customerName || null),
        customerPhone: isAccount ? (selectedCustomer.value ? getCustomerPhone(selectedCustomer.value) : (guest.value.customerPhone || null)) : (guest.value.customerPhone || null),
        note: guest.value.note || null,
        shippingAddress: guest.value.shippingAddress || null,
    }
}

function resetOrderForm() {
    selectedCustomer.value = null; customerMode.value = "guest"; couponCode.value = ""; selectedPromotionCode.value = null
    promotionOptions.value = []; bankingDialog.value = false; bankingInfo.value = null; customerKeyword.value = ""; customers.value = []
    guest.value = { customerName: "", customerPhone: "", note: "", shippingAddress: "" }
    checkoutForm.value = { method: "CASH", cashReceived: null }
}

function syncFormFromOrder(order) {
    if (!order) { resetOrderForm(); return }
    guest.value.customerName = order.customerName || ""
    guest.value.customerPhone = order.customerPhone || ""
    guest.value.note = order.note || ""
    guest.value.shippingAddress = order.shippingAddress || ""
    couponCode.value = ""; customerKeyword.value = ""
    customerMode.value = order.customerId ? "account" : "guest"
    selectedCustomer.value = order.customerId
        ? normalizeCustomer({ accountId: order.customerId, fullName: order.customerName || "", phoneNumber: order.customerPhone || "", email: order.email || "" })
        : null
    checkoutForm.value.method = order.paymentMethod || "CASH"
    if (checkoutForm.value.method !== "CASH") checkoutForm.value.cashReceived = null
}

function handleCustomerSelect(customer) {
    if (!customer || typeof customer !== "object") { selectedCustomer.value = null; guest.value.customerName = ""; guest.value.customerPhone = ""; return }
    const n = normalizeCustomer(customer); selectedCustomer.value = n; guest.value.customerName = n.plainName || ""; guest.value.customerPhone = n.displayPhone || ""
}

async function loadCustomers(keyword = "") {
    try { customerLoading.value = true; const { data } = await posApi.searchCustomers(String(keyword || "").trim()); customers.value = Array.isArray(data) ? data.map(normalizeCustomer) : [] }
    catch (e) { customers.value = []; showMessage(e.response?.data?.message || "Không tải được khách hàng", "error") }
    finally { customerLoading.value = false }
}
function handleCustomerSearch(v) {
    customerKeyword.value = v || ""
    if (customerSearchTimer) clearTimeout(customerSearchTimer)
    customerSearchTimer = setTimeout(() => loadCustomers(customerKeyword.value), 300)
}
function clearCustomerSearch() { customerKeyword.value = ""; loadCustomers("") }
async function openCustomerSearch() { if (!customers.value.length) await loadCustomers(customerKeyword.value) }

async function saveOrderInfo() {
    try {
        const orderId = getCurrentOrderId(currentOrder.value)
        if (!orderId) { showMessage("Bạn cần tạo đơn chờ trước", "warning"); return }
        const phone = guest.value.customerPhone?.trim() || ""
        if (phone && validatePhone(phone)) { showMessage(validatePhone(phone), "error"); return }
        loading.value = true
        const { data } = await posApi.updateOrderInfo(orderId, buildCustomerPayload())
        currentOrder.value = data; syncFormFromOrder(data); await loadPendingOrders(orderId); showMessage("Đã lưu thông tin đơn hàng")
    } catch (e) { showMessage(e.response?.data?.message || "Không lưu được thông tin", "error") }
    finally { loading.value = false }
}

async function loadProducts() {
    try { loading.value = true; const { data } = await posApi.searchProducts(productKeyword.value); products.value = (data || []).map(i => ({ ...i, tempQty: 1 })) }
    catch (e) { showMessage(e.response?.data?.message || "Không tải được sản phẩm", "error") }
    finally { loading.value = false }
}

function handleProductSearch(v) {
    productKeyword.value = v || ""
    if (productSearchTimer) clearTimeout(productSearchTimer)
    productSearchTimer = setTimeout(() => loadProducts(), 300)
}

// ── QR Scanner ────────────────────────────────────────────────────────────────

function openQRScanner() {
    qrInputValue.value = ""
    qrScannerDialog.value = true
    scannerVisible.value = false
    startScanner()
}

const startScanner = async () => {
    scannerVisible.value = true
    scannerLoading.value = true
    // Chờ DOM render xong rồi mới truy cập video element
    setTimeout(async () => {
        try {
            const videoElement = document.getElementById("barcode-video")
            if (!videoElement) { scannerLoading.value = false; return }
            scannerLoading.value = false
            const result = await codeReader.decodeOnceFromVideoDevice(undefined, videoElement)
            if (result) {
                const text = result.getText()
                productKeyword.value = text
                qrInputValue.value = text
                showMessage(`Đã quét: ${text}`, "success")
                stopScanner()
                loadProducts()
            }
        } catch (error) {
            console.error(error)
            scannerLoading.value = false
            // Bỏ qua lỗi khi người dùng chủ động đóng dialog (NotFoundException khi reset)
            if (qrScannerDialog.value) {
                showMessage("Không nhận diện được mã QR", "error")
            }
        }
    }, 300)
}

function stopScanner() {
    try { codeReader.reset() } catch (_) { }
    qrScannerDialog.value = false
    scannerVisible.value = false
    scannerLoading.value = false
}

function handleQRScan() {
    const qrValue = String(qrInputValue.value || "").trim()
    if (!qrValue) { showMessage("Vui lòng nhập hoặc quét mã QR", "warning"); return }
    productKeyword.value = qrValue
    qrInputValue.value = ""
    stopScanner()
    loadProducts()
}

// ─────────────────────────────────────────────────────────────────────────────

async function loadPromotions() {
    try {
        const orderId = getCurrentOrderId(currentOrder.value)
        if (!orderId) { promotionOptions.value = []; selectedPromotionCode.value = null; return }
        const { data } = await posApi.getAvailablePromotions(orderId)
        promotionOptions.value = Array.isArray(data) ? data : []
        const applied = promotionOptions.value.find(x => x.applied)
        selectedPromotionCode.value = applied ? buildPromotionComboItem(applied) : null
    } catch (e) { showMessage(e.response?.data?.message || "Không tải được ưu đãi", "error"); promotionOptions.value = []; selectedPromotionCode.value = null }
}

async function loadPendingOrders(preferredOrderId = null) {
    try {
        const { data } = await posApi.getPendingOrders()
        pendingOrders.value = (Array.isArray(data) ? data : []).filter(isPendingOrder)
        const targetId = preferredOrderId || getCurrentOrderId(currentOrder.value)
        if (targetId) {
            const matched = pendingOrders.value.find(x => getCurrentOrderId(x) === targetId)
            if (matched) { currentOrder.value = matched; syncFormFromOrder(matched); await loadPromotions(); return }
        }
        currentOrder.value = pendingOrders.value.length ? pendingOrders.value[0] : null
        syncFormFromOrder(currentOrder.value); await loadPromotions()
    } catch (e) { showMessage(e.response?.data?.message || "Không tải được đơn chờ", "error") }
}

async function createPendingOrder() {
    try {
        if (pendingOrders.value.length >= 10) { showMessage("Tối đa 10 đơn chờ", "warning"); return }
        loading.value = true; resetOrderForm()
        const { data } = await posApi.createOfflineOrder(buildCustomerPayload())
        currentOrder.value = data; syncFormFromOrder(data); await loadPendingOrders(getCurrentOrderId(data)); showMessage("Tạo đơn thành công")
    } catch (e) { showMessage(e.response?.data?.message || "Không thể tạo đơn", "error") }
    finally { loading.value = false }
}

async function switchOrder(order) {
    try {
        loading.value = true; resetOrderForm()
        const { data } = await posApi.getOrder(getCurrentOrderId(order))
        currentOrder.value = data; syncFormFromOrder(data); await loadPromotions()
    } catch (e) { showMessage(e.response?.data?.message || "Không tải được đơn", "error") }
    finally { loading.value = false }
}

async function closePendingOrder(order) {
    try { loading.value = true; await posApi.cancelPendingOrder(getCurrentOrderId(order)); await loadPendingOrders(); showMessage("Đã đóng đơn chờ") }
    catch (e) { showMessage(e.response?.data?.message || "Không đóng được đơn", "error") }
    finally { loading.value = false }
}

async function ensureOrderCreated() {
    const id = getCurrentOrderId(currentOrder.value)
    if (id) return id
    if (pendingOrders.value.length >= 10) throw new Error("Đã đạt tối đa 10 đơn chờ")
    const { data } = await posApi.createOfflineOrder(buildCustomerPayload())
    currentOrder.value = data; syncFormFromOrder(data); await loadPendingOrders(getCurrentOrderId(data))
    return getCurrentOrderId(data)
}

async function handleAddItem(product) {
    try {
        loading.value = true; const orderId = await ensureOrderCreated()
        await posApi.addItem(orderId, { productColorId: getProductColorId(product), quantity: Number(product.tempQty || 1) })
        const { data } = await posApi.getOrder(orderId); currentOrder.value = data; await loadPendingOrders(orderId); showMessage("Đã thêm sản phẩm")
    } catch (e) { showMessage(e.response?.data?.message || e.message || "Không thể thêm sản phẩm", "error") }
    finally { loading.value = false }
}

async function changeQty(item, newQty) {
    try {
        const quantity = Number(newQty); if (!quantity || quantity <= 0) return
        const orderId = getCurrentOrderId(currentOrder.value); if (!orderId) return
        loading.value = true; await posApi.updateItem(orderId, getOrderDetailId(item), { quantity })
        const { data } = await posApi.getOrder(orderId); currentOrder.value = data; await loadPendingOrders(orderId)
    } catch (e) { showMessage(e.response?.data?.message || "Không cập nhật được số lượng", "error") }
    finally { loading.value = false }
}

async function removeItem(item) {
    try {
        const orderId = getCurrentOrderId(currentOrder.value); if (!orderId) return
        loading.value = true; await posApi.removeItem(orderId, getOrderDetailId(item))
        const { data } = await posApi.getOrder(orderId); currentOrder.value = data; await loadPendingOrders(orderId); showMessage("Đã xóa sản phẩm")
    } catch (e) { showMessage(e.response?.data?.message || "Không xóa được sản phẩm", "error") }
    finally { loading.value = false }
}

async function handlePromotionCombobox() {
    const orderId = getCurrentOrderId(currentOrder.value); if (!orderId) { showMessage("Cần tạo đơn trước", "warning"); return }
    const code = getSelectedPromotionCodeValue(); if (!code) { showMessage("Vui lòng chọn ưu đãi", "warning"); return }
    const promo = promotionOptions.value.find(x => x.couponCode === code)
    if (!promo) { showMessage("Không tìm thấy ưu đãi", "warning"); return }
    if (!promo.eligible && !promo.applied) { showMessage("Ưu đãi chưa đủ điều kiện", "warning"); return }
    await applyPromotion(promo)
}

async function applyPromotion(promo) {
    try {
        const orderId = getCurrentOrderId(currentOrder.value); if (!orderId) return
        loading.value = true; const { data } = await posApi.applyCoupon(orderId, { couponCode: promo.couponCode })
        currentOrder.value = data; couponCode.value = ""; await loadPendingOrders(orderId); await loadPromotions(); showMessage("Áp dụng ưu đãi thành công")
    } catch (e) { showMessage(e.response?.data?.message || "Không áp được ưu đãi", "error") }
    finally { loading.value = false }
}

async function removePromotion() {
    try {
        const orderId = getCurrentOrderId(currentOrder.value); if (!orderId) return
        loading.value = true; const { data } = await posApi.applyCoupon(orderId, { couponCode: "" })
        currentOrder.value = data; couponCode.value = ""; selectedPromotionCode.value = null; await loadPendingOrders(orderId); await loadPromotions(); showMessage("Đã bỏ ưu đãi")
    } catch (e) { showMessage(e.response?.data?.message || "Không bỏ được ưu đãi", "error") }
    finally { loading.value = false }
}

async function handleCheckout() {
    try {
        const orderId = getCurrentOrderId(currentOrder.value)
        if (!orderId) { showMessage("Chưa có đơn hàng", "warning"); return }
        if (!orderItems.value.length) { showMessage("Đơn chưa có sản phẩm", "warning"); return }
        const phone = guest.value.customerPhone?.trim() || ""
        if (phone && validatePhone(phone)) { showMessage(validatePhone(phone), "error"); return }
        loading.value = true
        const { data } = await posApi.checkout(orderId, {
            method: checkoutForm.value.method,
            cashReceived: checkoutForm.value.method === "CASH" ? Number(checkoutForm.value.cashReceived || 0) : null,
        })
        if (checkoutForm.value.method === "CASH") { currentOrder.value = data; printReceipt(data); await loadPendingOrders(); showMessage("Thanh toán thành công"); return }
        if (checkoutForm.value.method === "BANKING") {
            currentOrder.value = data; const bankRes = await posApi.getMBBankInfo(orderId); bankingInfo.value = bankRes.data; bankingDialog.value = true; showMessage("Đã tạo yêu cầu chuyển khoản"); return
        }
    } catch (e) { showMessage(e.response?.data?.message || "Thanh toán thất bại", "error") }
    finally { loading.value = false }
}

async function confirmBankingPayment() {
    try {
        const orderId = getCurrentOrderId(currentOrder.value); if (!orderId) { showMessage("Không tìm thấy đơn", "warning"); return }
        confirmingBankingPayment.value = true; await paymentApi.confirmPayment(orderId)
        const { data: fullOrder } = await posApi.getOrder(orderId); currentOrder.value = fullOrder; printReceipt(fullOrder)
        bankingDialog.value = false; bankingInfo.value = null; checkoutForm.value = { method: "CASH", cashReceived: null }; await loadPendingOrders(); showMessage("Xác nhận thanh toán thành công")
    } catch (e) { showMessage(e.response?.data?.message || "Xác nhận thất bại", "error") }
    finally { confirmingBankingPayment.value = false }
}

function isPendingOrder(order) { return String(order?.status || "").trim().toUpperCase() === "PENDING_PAYMENT" }
function escapeHtml(v) { return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;") }
function formatDateTime(value) {
    if (!value) return "—"
    const d = new Date(value); if (Number.isNaN(d.getTime())) return value
    const p = n => String(n).padStart(2, "0")
    return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
function getEmployeeName(order) { return order?.employeeName || order?.staffName || order?.createdByName || order?.employee?.fullName || "Nhân viên cửa hàng" }
function getOrderCode(order) {
    if (order?.trackingCode) return order.trackingCode
    if (order?.orderCode) return order.orderCode
    if (order?.code) return order.code
    return `HD${String(getCurrentOrderId(order) || 0).padStart(6, "0")}`
}
function getOrderCreatedAt(order) { return order?.orderDate || order?.createdAt || order?.createdDate || order?.paymentTime || new Date().toISOString() }
function getReceiptStoreInfo() { return { phone: "0906076388", email: "tienmnhat@gmail.com", address: "160 Cao lỗ, Uy Nỗ, Đông Anh, Hà Nội", logoUrl: "/images/logo1.jpg" } }

function buildReceiptHtml(order, options = {}) {
    const store = getReceiptStoreInfo()
    const items = (Array.isArray(order?.items) && order.items) || (Array.isArray(order?.orderDetails) && order.orderDetails) || []
    const orderId = getCurrentOrderId(order); const orderCode = getOrderCode(order); const orderDate = formatDateTime(getOrderCreatedAt(order))
    const employeeName = getEmployeeName(order); const paymentMethod = String(order?.paymentMethod || checkoutForm.value.method || "").toUpperCase()
    const orderSubtotal = Number(order?.subtotal ?? order?.subTotal ?? order?.totalBeforeDiscount ?? 0)
    const orderDiscount = Number(order?.discountAmount ?? order?.discount ?? 0)
    const shippingFee = Number(order?.shippingFee ?? order?.deliveryFee ?? 0)
    const orderTotal = Number(order?.totalAmount ?? order?.total ?? 0)
    const cashReceived = Number(options.cashReceived ?? 0); const cashChange = Number(options.cashChange ?? 0)
    const transferContent = bankingInfo.value?.transferContent || orderCode
    const transferAmount = Number(bankingInfo.value?.amount || orderTotal)
    const itemRows = items.length
        ? items.map((item, i) => `<tr><td class="center">${i + 1}</td><td><div class="product-name">${escapeHtml(getItemProductName(item))}</div><div class="product-sub">${escapeHtml(getItemColorName(item))} / ${escapeHtml(getItemSizeName(item))}</div></td><td class="center">${getItemQuantity(item)}</td><td class="right">${formatCurrency(getItemPrice(item))}</td><td class="right">${formatCurrency(getItemLineTotal(item))}</td><td class="center">${escapeHtml(order?.status || "")}</td></tr>`).join("")
        : `<tr><td colspan="6" class="center">Không có sản phẩm</td></tr>`
    const cashBlock = paymentMethod === "CASH" ? `<div class="summary-row"><span>Tiền khách đưa:</span><strong>${formatCurrency(cashReceived)}</strong></div><div class="summary-row"><span>Tiền thừa:</span><strong>${formatCurrency(cashChange)}</strong></div>` : ""
    const bankingBlock = paymentMethod === "BANKING" ? `<div class="banking-box"><div><strong>Ngân hàng:</strong> ${escapeHtml(bankingInfo.value?.bankName || "MB Bank")}</div><div><strong>Số TK:</strong> ${escapeHtml(bankingInfo.value?.accountNumber || "")}</div><div><strong>Chủ TK:</strong> ${escapeHtml(bankingInfo.value?.accountName || "")}</div><div><strong>Nội dung:</strong> ${escapeHtml(transferContent)}</div><div><strong>Số tiền:</strong> ${formatCurrency(transferAmount)}</div></div>` : ""
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(orderCode)}`
    return `<html><head><title>Hóa đơn #${orderId}</title><style>@page{size:A5 portrait;margin:10mm}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;background:#fff;color:#111;font-size:13px}.receipt{position:relative;width:100%;padding:8px}.top-header{display:grid;grid-template-columns:150px 1fr 220px;gap:12px;align-items:center;margin-bottom:8px}.header-logo{width:140px;max-height:80px;object-fit:contain}.shop-info{text-align:center}.shop-name{font-size:26px;font-weight:700;margin-bottom:6px}.shop-line{margin:2px 0;font-size:12px}.barcode-box{display:flex;flex-direction:column;align-items:center}.barcode-label{margin-top:4px;font-size:11px;font-weight:700;text-align:center}.title{text-align:center;font-size:28px;font-weight:800;margin:12px 0;text-transform:uppercase}.meta{display:flex;justify-content:space-between;gap:16px;margin-bottom:10px}.meta-col{width:48%;line-height:1.55}.section-title{text-align:center;font-size:14px;font-weight:700;margin:10px 0 6px;text-transform:uppercase}table{width:100%;border-collapse:collapse}th,td{border:1px solid #111;padding:5px 6px;vertical-align:top;font-size:12px}th{text-align:center;font-weight:700}.center{text-align:center}.right{text-align:right;white-space:nowrap}.product-name{font-weight:700}.product-sub{color:#444;font-size:10.5px}.bottom-area{display:flex;justify-content:space-between;gap:20px;margin-top:12px}.left-note{flex:1;display:flex;flex-direction:column;align-items:center}.summary{width:260px}.summary-row{display:flex;justify-content:space-between;gap:12px;margin:3px 0;font-size:13px}.summary-row.total{font-size:17px;font-weight:800;margin-top:8px}.banking-box{margin-top:8px;padding-top:8px;border-top:1px dashed #444;line-height:1.5;font-size:12px}.watermark{position:absolute;left:50%;top:55%;transform:translate(-50%,-50%);width:300px;opacity:.05;z-index:0;pointer-events:none}.footer{text-align:center;margin-top:14px;font-size:12px;color:#333}</style></head><body><div class="receipt"><img src="${store.logoUrl}" class="watermark"/><div style="position:relative;z-index:1"><div class="top-header"><div style="display:flex;align-items:center;justify-content:center"><img src="${store.logoUrl}" class="header-logo"/></div><div class="shop-info"><div class="shop-name">${escapeHtml(store.name || "")}</div><div class="shop-line"><strong>SĐT:</strong> ${escapeHtml(store.phone)}</div><div class="shop-line"><strong>Email:</strong> ${escapeHtml(store.email)}</div><div class="shop-line">${escapeHtml(store.address)}</div></div><div style="display:flex;flex-direction:column;align-items:center"><svg id="barcode-order"></svg><div class="barcode-label">Mã HĐ: ${escapeHtml(orderCode)}</div></div></div><div class="title">HÓA ĐƠN BÁN HÀNG</div><div class="meta"><div class="meta-col"><div><strong>Khách hàng:</strong> ${escapeHtml(order?.customerName || "Khách lẻ")}</div><div><strong>Địa chỉ:</strong> ${escapeHtml(order?.shippingAddress || "Tại cửa hàng")}</div><div><strong>Nhân viên:</strong> ${escapeHtml(employeeName)}</div></div><div class="meta-col" style="text-align:right"><div><strong>Mã HĐ:</strong> ${escapeHtml(orderCode)}</div><div><strong>Ngày:</strong> ${escapeHtml(orderDate)}</div><div><strong>TT:</strong> ${escapeHtml(order?.status || "")}</div></div></div><div class="section-title">Danh sách sản phẩm</div><table><thead><tr><th style="width:36px">STT</th><th>Tên sản phẩm</th><th style="width:60px">SL</th><th style="width:105px">Đơn giá</th><th style="width:115px">Thành tiền</th><th style="width:80px">Trạng thái</th></tr></thead><tbody>${itemRows}</tbody></table><div class="bottom-area"><div class="left-note"><img src="${qrUrl}" width="130" height="130"/><div style="font-size:11px;margin-top:5px;font-weight:600">Quét mã đơn</div><div style="font-size:10px;margin-top:2px;color:#444">${orderCode}</div></div><div class="summary"><div class="summary-row"><span>Tổng tiền hàng:</span><strong>${formatCurrency(orderSubtotal)}</strong></div><div class="summary-row"><span>Giảm giá:</span><strong>${formatCurrency(orderDiscount)}</strong></div><div class="summary-row"><span>Phí giao hàng:</span><strong>${formatCurrency(shippingFee)}</strong></div><div class="summary-row total"><span>Tổng cần thanh toán:</span><strong>${formatCurrency(orderTotal)}</strong></div>${cashBlock}${bankingBlock}</div></div><div class="footer">Cảm ơn quý khách đã mua hàng!</div></div></div></body></html>`
}

function printReceipt(order = currentOrder.value) {
    const orderId = getCurrentOrderId(order); if (!order || !orderId) return
    const html = buildReceiptHtml(order, {
        cashReceived: checkoutForm.value.method === "CASH" ? Number(checkoutForm.value.cashReceived || 0) : 0,
        cashChange: checkoutForm.value.method === "CASH" ? Number(changeAmount.value || 0) : 0,
    })
    const win = window.open("", "_blank", "width=900,height=1200"); if (!win) return
    win.document.open(); win.document.write(html); win.document.close()
    win.onload = () => {
        const el = win.document.getElementById("barcode-order")
        if (el) JsBarcode(el, getOrderCode(order), { format: "CODE128", width: 1.5, height: 40, displayValue: false, margin: 0 })
        setTimeout(() => { win.focus(); win.print() }, 200)
    }
}

watch(customerMode, async (mode) => {
    if (mode === "account") await loadCustomers(customerKeyword.value)
    else { customerKeyword.value = ""; customers.value = []; selectedCustomer.value = null }
})
onBeforeUnmount(() => {
    if (customerSearchTimer) clearTimeout(customerSearchTimer)
    if (productSearchTimer) clearTimeout(productSearchTimer)
    try { codeReader.reset() } catch (_) { }
})
onMounted(async () => { await loadProducts(); await loadPendingOrders() })
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* ── Variables ────────────────────────────────── */
.pos-root {
    --bg: #f1f1f1;
    --surface: #ffffff;
    --border: #eaecf0;
    --border-soft: #f2f4f7;
    --text-1: #101828;
    --text-2: #344054;
    --text-3: #667085;
    --text-4: #98a2b3;
    --primary: #6172f3;
    --primary-bg: #eef0fd;
    --primary-light: #c7cdfb;
    --green: #12b76a;
    --green-bg: #ecfdf3;
    --red: #f04438;
    --amber: #f79009;
    --amber-bg: #fffaeb;
    --radius-sm: 8px;
    --radius-md: 14px;
    --radius-lg: 20px;
    --shadow-sm: 0 1px 2px rgba(16, 24, 40, .05);
    --shadow-md: 0 4px 16px rgba(16, 24, 40, .08);

    font-family: 'Plus Jakarta Sans', sans-serif;
    background: var(--bg);
    color: var(--text-1);
    min-height: 100vh;
    font-size: 14px;
}

/* ── Layout ───────────────────────────────────── */
.pos-header {
    display: flex;
    align-items: center;
    padding: 20px 24px 0;
    margin-bottom: 18px;
}

.pos-title {
    font-size: 20px;
    font-weight: 800;
    color: var(--text-1);
    letter-spacing: -0.4px;
}

.pos-layout {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 14px;
    padding: 0 24px 40px;
    align-items: start;
}

.pos-col {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

/* ── Card ─────────────────────────────────────── */
.sc-card {
    background: var(--surface);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
}

.sc-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 13px 16px 11px;
    border-bottom: 1px solid var(--border-soft);
}

.sc-card-icon {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: var(--primary-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
}

.sc-card-title {
    font-size: 13.5px;
    font-weight: 700;
    color: var(--text-1);
}

.sc-card-body {
    padding: 14px 16px;
}

/* ── Buttons ──────────────────────────────────── */
.sc-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 14px;
    border-radius: var(--radius-sm);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all .15s;
    white-space: nowrap;
}

.sc-btn-primary {
    background: var(--primary);
    color: #fff;
    box-shadow: 0 1px 4px rgba(97, 114, 243, .3);
}

.sc-btn-primary:hover:not(:disabled) {
    background: #4f60e8;
    transform: translateY(-1px);
}

.sc-btn-soft {
    background: var(--primary-bg);
    color: var(--primary);
    border: 1px solid var(--primary-light);
}

.sc-btn-soft:hover:not(:disabled) {
    background: #e0e4fb;
}

.sc-btn-danger-text {
    background: transparent;
    color: var(--red);
    border: none;
}

.sc-btn-danger-text:hover:not(:disabled) {
    background: #fef3f2;
}

.sc-btn-xs {
    padding: 5px 10px;
    font-size: 12px;
    border-radius: 6px;
}

.sc-btn-disabled,
.sc-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none !important;
}

.sc-btn-icon {
    padding: 6px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-3);
    transition: all .15s;
}

.sc-btn-icon:hover {
    background: var(--bg);
    color: var(--text-2);
}

.sc-btn-danger-ghost {
    padding: 5px;
    border-radius: 7px;
    border: none;
    background: transparent;
    color: var(--red);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background .12s;
}

.sc-btn-danger-ghost:hover {
    background: #fef3f2;
}

.sc-btn-success {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 12px;
    background: var(--green);
    color: #fff;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14.5px;
    font-weight: 700;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(18, 183, 106, .3);
    transition: all .15s;
    margin-top: 4px;
}

.sc-btn-success:hover:not(:disabled) {
    background: #0fa55e;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(18, 183, 106, .35);
}

.sc-btn-success:disabled {
    background: #d0d5dd;
    box-shadow: none;
    cursor: not-allowed;
}

/* ── Form ─────────────────────────────────────── */
.sc-row {
    display: flex;
    gap: 10px;
}

.sc-field {
    flex: 1;
}

.mt-2 {
    margin-top: 8px;
}

.ml-auto {
    margin-left: auto;
}

.mb-2 {
    margin-bottom: 8px;
}

.sc-label {
    display: block;
    font-size: 11.5px;
    font-weight: 700;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.4px;
    margin-bottom: 5px;
}

.sc-vuetify-field :deep(.v-field) {
    border-radius: var(--radius-sm) !important;
    font-family: 'Plus Jakarta Sans', sans-serif !important;
    font-size: 13.5px !important;
}

.sc-vuetify-field :deep(.v-field__outline__start) {
    border-radius: var(--radius-sm) 0 0 var(--radius-sm) !important;
}

.sc-vuetify-field :deep(.v-field__outline__end) {
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0 !important;
}

/* ── Radio pills ──────────────────────────────── */
.radio-pill-row {
    display: flex;
    gap: 8px;
    margin-bottom: 14px;
}

.radio-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 999px;
    border: 1.5px solid var(--border);
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-3);
    background: var(--surface);
    transition: all .15s;
    user-select: none;
}

.radio-pill input {
    display: none;
}

.radio-pill.active {
    border-color: var(--primary);
    background: var(--primary-bg);
    color: var(--primary);
}

/* ── Pending orders ───────────────────────────── */
.pending-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.order-tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px 5px 12px;
    border-radius: 999px;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    border: 1.5px solid var(--border);
    background: var(--bg);
    color: var(--text-2);
    transition: all .15s;
}

.order-tab:hover {
    border-color: var(--primary-light);
    background: var(--primary-bg);
}

.order-tab.active {
    background: var(--primary);
    border-color: var(--primary);
    color: #fff;
    box-shadow: 0 2px 8px rgba(97, 114, 243, .3);
}

.order-tab-close {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    background: rgba(0, 0, 0, .08);
    transition: background .12s;
}

.order-tab.active .order-tab-close {
    background: rgba(255, 255, 255, .25);
}

.order-tab-close:hover {
    background: rgba(0, 0, 0, .18) !important;
}

.empty-inline {
    font-size: 13px;
    color: var(--text-4);
    padding: 4px 0;
}

.usage-bar-wrap {
    margin-top: 10px;
}

.usage-bar-label {
    font-size: 11.5px;
    color: var(--text-4);
    margin-bottom: 4px;
}

.usage-bar-track {
    height: 4px;
    background: var(--border);
    border-radius: 99px;
    overflow: hidden;
}

.usage-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary), #a5b0ff);
    border-radius: 99px;
    transition: width .4s ease;
}

/* ── Meta pills ───────────────────────────────── */
.meta-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.meta-pill {
    display: flex;
    flex-direction: column;
    padding: 7px 12px;
    background: var(--bg);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-soft);
    min-width: 90px;
    flex: 1;
}

.meta-pill-label {
    font-size: 10px;
    font-weight: 700;
    color: var(--text-4);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
}

.meta-pill-value {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-2);
}

.sc-divider {
    height: 1px;
    background: var(--border-soft);
    margin: 13px -16px;
}

/* ── Section label ────────────────────────────── */
.section-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 10.5px;
    font-weight: 700;
    color: var(--text-4);
    text-transform: uppercase;
    letter-spacing: 0.7px;
    margin-bottom: 10px;
}

.section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border-soft);
}

/* ── Order items ──────────────────────────────── */
.order-items-list {
    display: flex;
    flex-direction: column;
    gap: 7px;
}

.order-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 10px;
    background: var(--bg);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-soft);
    transition: box-shadow .15s;
}

.order-item:hover {
    box-shadow: var(--shadow-md);
}

.order-item-info {
    flex: 1;
    min-width: 0;
}

.order-item-name {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.order-item-sub {
    font-size: 11px;
    color: var(--text-4);
    margin-top: 1px;
}

.qty-ctrl {
    display: flex;
    align-items: center;
    gap: 5px;
}

.qty-btn {
    width: 24px;
    height: 24px;
    border-radius: 7px;
    border: 1.5px solid var(--border);
    background: var(--surface);
    font-size: 14px;
    font-weight: 700;
    color: var(--text-2);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all .12s;
}

.qty-btn:hover {
    border-color: var(--primary);
    color: var(--primary);
    background: var(--primary-bg);
}

.qty-val {
    width: 28px;
    text-align: center;
    font-size: 13px;
    font-weight: 700;
}

.order-item-price {
    text-align: right;
    flex-shrink: 0;
}

.price-line {
    font-size: 13px;
    font-weight: 800;
    color: var(--text-1);
}

.price-unit-small {
    font-size: 10.5px;
    color: var(--text-4);
}

/* ── Promo ────────────────────────────────────── */
.promo-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
}

.promo-applied-tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    background: var(--green-bg);
    border: 1px solid #a9efc5;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    color: var(--green);
    margin-top: 8px;
}

/* ── Summary ──────────────────────────────────── */
.summary-box {
    background: var(--bg);
    border-radius: var(--radius-md);
    padding: 12px 14px;
    border: 1px solid var(--border-soft);
}

.summary-row {
    display: flex;
    justify-content: space-between;
    font-size: 13.5px;
    color: var(--text-2);
    padding: 3px 0;
}

.summary-discount {
    color: var(--green);
    font-weight: 600;
}

.summary-total {
    padding-top: 9px;
    margin-top: 5px;
    border-top: 1.5px dashed var(--border);
    font-size: 16.5px;
    font-weight: 800;
    color: var(--text-1);
}

.total-amount {
    color: var(--primary);
}

/* ── Payment method ───────────────────────────── */
.pay-method-row {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
}

.pay-method-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 10px 8px;
    border-radius: var(--radius-md);
    border: 2px solid var(--border);
    background: var(--bg);
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-3);
    transition: all .15s;
}

.pay-method-card .pay-icon {
    font-size: 22px;
}

.pay-method-card.active {
    border-color: var(--primary);
    background: var(--primary-bg);
    color: var(--primary);
    box-shadow: 0 0 0 3px rgba(97, 114, 243, .1);
}

/* ── Change callout ───────────────────────────── */
.change-callout {
    display: flex;
    justify-content: space-between;
    background: var(--green-bg);
    border: 1px solid #a9efc5;
    border-radius: var(--radius-sm);
    padding: 9px 14px;
    margin-bottom: 10px;
    font-size: 14px;
    font-weight: 700;
    color: var(--green);
}

/* ── Chips ────────────────────────────────────── */
.sc-chip {
    display: inline-flex;
    align-items: center;
    padding: 3px 9px;
    border-radius: 999px;
    font-size: 11.5px;
    font-weight: 700;
}

.sc-chip-primary {
    background: var(--primary-bg);
    color: var(--primary);
}

.sc-chip-green {
    background: var(--green-bg);
    color: var(--green);
}

.sc-chip-amber {
    background: var(--amber-bg);
    color: var(--amber);
}

.sc-chip-grey {
    background: var(--bg);
    color: var(--text-3);
    border: 1px solid var(--border);
}

/* ── Products ─────────────────────────────────── */
.product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(185px, 1fr));
    gap: 12px;
    margin-top: 14px;
}

.product-card {
    border-radius: var(--radius-md);
    border: 1.5px solid var(--border);
    background: var(--surface);
    overflow: hidden;
    transition: box-shadow .18s, transform .18s, border-color .18s;
}

.product-card:hover {
    box-shadow: 0 8px 24px rgba(97, 114, 243, .12);
    transform: translateY(-2px);
    border-color: var(--primary-light);
}

.product-thumb {
    position: relative;
}

.product-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: var(--red);
    color: #fff;
    font-size: 10px;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: 999px;
}

.product-info {
    padding: 10px 12px 8px;
}

.product-name {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-1);
    line-height: 1.3;
    margin-bottom: 3px;
}

.product-meta-line {
    font-size: 11px;
    color: var(--text-4);
    margin-bottom: 6px;
}

.product-price-row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 6px;
}

.price-main {
    font-size: 13.5px;
    font-weight: 800;
    color: var(--primary);
}

.price-old {
    font-size: 11px;
    color: var(--text-4);
    text-decoration: line-through;
}

.stock-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.stock-label {
    font-size: 11px;
    color: var(--text-4);
}

.stock-count {
    font-size: 12px;
    font-weight: 700;
}

.stock-ok {
    color: var(--green);
}

.stock-low {
    color: var(--amber);
}

.stock-out {
    color: var(--red);
}

.product-footer {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 12px 12px;
}

.qty-input-sm {
    width: 52px;
    padding: 6px 8px;
    border: 1.5px solid var(--border);
    border-radius: 7px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px;
    font-weight: 700;
    text-align: center;
    outline: none;
    color: var(--text-1);
    background: var(--bg);
}

.qty-input-sm:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(97, 114, 243, .1);
}

.empty-state {
    text-align: center;
    padding: 32px 0;
    color: var(--text-4);
}

.empty-state-icon {
    font-size: 32px;
    margin-bottom: 8px;
}

.empty-state-text {
    font-size: 13px;
    font-weight: 500;
}

/* ── Banking dialog ───────────────────────────── */
.banking-dialog-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 20px 12px;
    font-size: 16px;
    font-weight: 700;
    color: var(--text-1);
    border-bottom: 1px solid var(--border-soft);
    font-family: 'Plus Jakarta Sans', sans-serif;
}

.banking-info-box {
    background: var(--bg);
    border-radius: var(--radius-sm);
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.banking-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: var(--text-2);
}

/* ── QR Scan line animation ───────────────────── */
.qr-scan-line {
    position: absolute;
    left: 8px;
    right: 8px;
    height: 2px;
    background: linear-gradient(90deg, transparent, #6172f3, transparent);
    border-radius: 99px;
    animation: qr-scan 1.8s ease-in-out infinite;
    top: 10%;
}

@keyframes qr-scan {
    0% {
        top: 10%;
        opacity: 1;
    }

    50% {
        top: 85%;
        opacity: 1;
    }

    100% {
        top: 10%;
        opacity: 1;
    }
}

/* ── Responsive ───────────────────────────────── */
@media (max-width: 960px) {
    .pos-layout {
        grid-template-columns: 1fr;
    }

    .product-grid {
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    }
}
</style>