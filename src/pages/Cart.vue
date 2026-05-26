<template>
  <div class="cart-page">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Giỏ hàng của bạn</h1>
      </div>
    </div>

    <!-- Not Logged In -->
    <div v-if="!isLoggedIn" class="auth-notice">
      <i class="notice-icon">⚠</i>
      <div>
        <p class="notice-title">Bạn chưa đăng nhập</p>
        <p class="notice-sub">Vui lòng đăng nhập để xem giỏ hàng</p>
      </div>
      <button class="btn-outline" @click="goLogin">Đăng nhập</button>
    </div>

    <template v-else>
      <!-- Loading -->
      <div v-if="isLoading" class="loading-state">
        <v-progress-circular indeterminate color="black" size="36" width="2" />
      </div>

      <!-- Empty Cart -->
      <div v-else-if="cartItems.length === 0" class="empty-state">
        <div class="empty-icon">
          <v-icon icon="mdi-shopping-outline" size="40" />
        </div>
        <p class="empty-title">Giỏ hàng trống</p>
        <p class="empty-sub">Thêm sản phẩm vào giỏ để tiếp tục mua sắm</p>
        <button class="btn-primary" @click="goProducts">Khám phá sản phẩm</button>
      </div>

      <!-- Cart Content -->
      <div v-else class="cart-layout">
        <!-- Left: Items -->
        <div class="cart-left">
          <!-- Select All Bar -->
          <div class="select-bar">
            <label class="select-all-label">
              <div
                class="custom-checkbox"
                :class="{ checked: isAllSelected, partial: selectedItemIds.length > 0 && !isAllSelected }"
                @click="toggleSelectAll(!isAllSelected)"
              >
                <v-icon v-if="isAllSelected" icon="mdi-check" size="12" />
                <v-icon v-else-if="selectedItemIds.length > 0" icon="mdi-minus" size="12" />
              </div>
              <span>Chọn tất cả</span>
            </label>
            <span class="select-count">{{ selectedItemIds.length }}/{{ cartItems.length }} sản phẩm</span>
          </div>

          <!-- Items List -->
          <transition-group name="item-list" tag="div">
            <div
              v-for="item in cartItems"
              :key="item.cartItemID"
              class="cart-item"
              :class="{ 'is-selected': selectedItemIds.includes(item.cartItemID) }"
            >
              <!-- Checkbox -->
              <div
                class="custom-checkbox"
                :class="{ checked: selectedItemIds.includes(item.cartItemID) }"
                @click="toggleItemSelection(item.cartItemID, !selectedItemIds.includes(item.cartItemID))"
              >
                <v-icon v-if="selectedItemIds.includes(item.cartItemID)" icon="mdi-check" size="12" />
              </div>

              <!-- Product Image -->
              <div class="item-image">
                <v-img
                  :src="item.mainImage || fallbackImage"
                  width="96"
                  height="96"
                  cover
                  class="product-img"
                />
              </div>

              <!-- Product Info -->
              <div class="item-info">
                <p class="item-brand">MLB</p>
                <p class="item-name">{{ item.productName }}</p>
                <div class="item-meta">
                  <span class="meta-tag">
                    <span
                      v-if="item.colorCode"
                      class="color-dot"
                      :style="{ background: item.colorCode }"
                    />
                    {{ item.colorName }}
                  </span>
                  <span class="meta-tag">{{ item.sizeName || 'Free size' }}</span>
                </div>
              </div>

              <!-- Price + Actions -->
              <div class="item-actions">
                <div class="price-block">
                  <p class="price-label">Thành tiền</p>
                  <p class="price-total">{{ formatPrice(item.price * item.quantity) }}đ</p>
                  <p class="price-unit">{{ formatPrice(item.price) }}đ / sản phẩm</p>
                </div>

                <!-- Quantity Control -->
                <div class="qty-control">
                  <button
                    class="qty-btn"
                    :disabled="item.quantity <= 1 || item.isUpdating"
                    @click="changeQuantity(item, item.quantity - 1)"
                  >
                    <v-icon icon="mdi-minus" size="14" />
                  </button>
                  <input
                    :value="item.quantity"
                    type="number"
                    class="qty-input"
                    min="1"
                    :max="Math.min(MAX_QUANTITY, item.stockQuantity ?? MAX_QUANTITY)"
                    @change="onQuantityInput(item, $event.target.value)"
                  />
                  <button
                    class="qty-btn"
                    :disabled="item.isUpdating || item.quantity >= Math.min(MAX_QUANTITY, item.stockQuantity ?? 0)"
                    @click="changeQuantity(item, item.quantity + 1)"
                  >
                    <v-icon icon="mdi-plus" size="14" />
                  </button>
                </div>

                <!-- Delete -->
                <button
                  class="delete-btn"
                  :disabled="item.isRemoving"
                  @click="removeItem(item)"
                >
                  <v-progress-circular v-if="item.isRemoving" indeterminate size="14" width="2" color="black" />
                  <v-icon v-else icon="mdi-trash-can-outline" size="16" />
                  <span>Xóa</span>
                </button>
              </div>
            </div>
          </transition-group>
        </div>

        <!-- Right: Summary -->
        <div class="cart-right">
          <div class="summary-card">
            <p class="summary-eyebrow">Order Summary</p>
            <h2 class="summary-title">Tóm tắt đơn hàng</h2>

            <div class="summary-rows">
              <div class="summary-row">
                <span>Sản phẩm đã chọn</span>
                <span>{{ selectedItemIds.length }}</span>
              </div>
              <div class="summary-row">
                <span>Tổng số lượng</span>
                <span>{{ selectedTotalQuantity }}</span>
              </div>
              <div class="summary-row">
                <span>Tạm tính</span>
                <span>{{ formatPrice(selectedTotalPrice) }}đ</span>
              </div>
            </div>

            <div class="summary-divider" />

            <div class="summary-total">
              <span>Tổng cộng</span>
              <span class="total-amount">{{ formatPrice(selectedTotalPrice) }}đ</span>
            </div>

            <button
              class="btn-primary full"
              :disabled="selectedItemIds.length === 0"
              @click="goCheckout"
            >
              Tiến hành thanh toán
            </button>
            <button class="btn-outline full" @click="goProducts">
              Tiếp tục mua sắm
            </button>

            <div class="security-note">
              <v-icon icon="mdi-shield-check-outline" size="14" />
              Thanh toán an toàn & bảo mật
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Snackbar -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      timeout="3000"
      location="top"
      rounded="lg"
    >
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import cartApi from '@/api/cartApi'

const router = useRouter()
const userStore = useUserStore()
const MAX_QUANTITY = 10

const isLoading = ref(false)
const cartItems = ref([])
const selectedItemIds = ref([])
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')
const fallbackImage = 'https://via.placeholder.com/96x96?text=No+Image'

const isLoggedIn = computed(() => userStore.isLoggedIn)

const selectedItems = computed(() => {
  const set = new Set(selectedItemIds.value)
  return cartItems.value.filter((item) => set.has(item.cartItemID))
})

const selectedTotalQuantity = computed(() =>
  selectedItems.value.reduce((sum, item) => sum + item.quantity, 0),
)

const selectedTotalPrice = computed(() =>
  selectedItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0),
)

const isAllSelected = computed(
  () => cartItems.value.length > 0 && selectedItemIds.value.length === cartItems.value.length,
)

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price || 0)

const notify = (message, color = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}

const loadCart = async () => {
  if (!isLoggedIn.value) {
    cartItems.value = []
    selectedItemIds.value = []
    return
  }
  isLoading.value = true
  try {
    let currentCartId = Number.parseInt(userStore.cartId, 10)
    if (!Number.isFinite(currentCartId) || currentCartId <= 0) {
      currentCartId = await userStore.getOrCreateCart()
    }
    const itemRes = await cartApi.getByCart(currentCartId)
    const normalized = (itemRes.data || []).map((item) => ({
      cartItemID: item.cartItemID,
      cartID: item.cartID,
      productColorID: Number.parseInt(item.productColorID ?? item.productID, 10),
      sizeID: Number.parseInt(item.sizeID, 10) || null,
      sizeName: item.sizeName || '',
      quantity: Number.parseInt(item.quantity, 10) || 1,
      productName: item.productName || '',
      price: Number(item.price) || 0,
      colorName: item.colorName || '',
      colorCode: item.colorCode || '',
      mainImage: item.mainImage || '',
      stockQuantity: Number.parseInt(item.stockQuantity, 10) || 0,
      isUpdating: false,
      isRemoving: false,
    }))
    cartItems.value = normalized
    const validIds = new Set(normalized.map((x) => x.cartItemID))
    selectedItemIds.value = selectedItemIds.value.filter((id) => validIds.has(id))
  } catch {
    notify('Không thể tải giỏ hàng', 'error')
  } finally {
    isLoading.value = false
  }
}

const changeQuantity = async (item, nextQuantity) => {
  const quantity = Math.max(1, Number.parseInt(nextQuantity, 10) || 1)
  const maxStock = Number.parseInt(item.stockQuantity, 10) || 0
  const maxAllowed = Math.min(MAX_QUANTITY, maxStock)
  if (maxStock <= 0) return notify('Sản phẩm đã hết hàng', 'warning')
  if (quantity > maxAllowed) return notify(`Tối đa ${maxAllowed} sản phẩm`, 'warning')
  if (quantity === item.quantity) return
  item.isUpdating = true
  try {
    await cartApi.update(
      item.cartItemID,
      { cartID: item.cartID, productColorID: item.productColorID, quantity },
      userStore.token,
    )
    item.quantity = quantity
    window.dispatchEvent(new Event('cart-changed'))
  } catch {
    notify('Không thể cập nhật số lượng', 'error')
  } finally {
    item.isUpdating = false
  }
}

const onQuantityInput = (item, value) => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return
  changeQuantity(item, parsed)
}

const removeItem = async (item) => {
  item.isRemoving = true
  try {
    await cartApi.remove(item.cartItemID, userStore.token)
    cartItems.value = cartItems.value.filter((x) => x.cartItemID !== item.cartItemID)
    selectedItemIds.value = selectedItemIds.value.filter((id) => id !== item.cartItemID)
    window.dispatchEvent(new Event('cart-changed'))
    notify('Đã xóa sản phẩm khỏi giỏ hàng')
  } catch {
    notify('Không thể xóa sản phẩm', 'error')
  } finally {
    item.isRemoving = false
  }
}

const toggleItemSelection = (cartItemId, checked) => {
  if (checked) {
    if (!selectedItemIds.value.includes(cartItemId)) selectedItemIds.value.push(cartItemId)
  } else {
    selectedItemIds.value = selectedItemIds.value.filter((id) => id !== cartItemId)
  }
}

const toggleSelectAll = (checked) => {
  selectedItemIds.value = checked ? cartItems.value.map((item) => item.cartItemID) : []
}

const goCheckout = () => {
  if (selectedItemIds.value.length === 0)
    return notify('Vui lòng chọn ít nhất 1 sản phẩm', 'warning')
  const invalidItem = selectedItems.value.find((item) => {
    const stock = Number.parseInt(item.stockQuantity, 10) || 0
    const qty = Number.parseInt(item.quantity, 10) || 0
    return qty <= 0 || qty > stock
  })
  if (invalidItem) return notify(`${invalidItem.productName} không đủ tồn kho`, 'warning')
  sessionStorage.removeItem('quickBuyContext')
  sessionStorage.setItem('selectedCartItemIds', JSON.stringify(selectedItemIds.value))
  router.push({ name: 'Checkout' })
}

const goProducts = () => router.push({ name: 'ProductList' })
const goLogin = () => router.push({ name: 'Login' })

onMounted(() => loadCart())
</script>

<style scoped>
/* ── Base ── */
.cart-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
  font-family: inherit;
}

/* ── Header ── */
.page-header {
  margin-bottom: 2.5rem;
}
.page-eyebrow {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.4);
  font-weight: 500;
  margin-bottom: 4px;
}
.page-title {
  font-size: 26px;
  font-weight: 500;
  letter-spacing: -0.02em;
}

/* ── Auth Notice ── */
.auth-notice {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border: 0.5px solid rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  background: #fff;
}
.notice-icon { font-size: 20px; }
.notice-title { font-size: 14px; font-weight: 500; }
.notice-sub { font-size: 12px; color: rgba(0,0,0,0.45); margin-top: 2px; }

/* ── Empty / Loading ── */
.loading-state {
  display: flex;
  justify-content: center;
  padding: 5rem 0;
}
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  background: #fff;
}
.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}
.empty-title { font-size: 16px; font-weight: 500; margin-bottom: 6px; }
.empty-sub { font-size: 13px; color: rgba(0,0,0,0.45); margin-bottom: 20px; }

/* ── Layout ── */
.cart-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 1.5rem;
  align-items: start;
}
@media (max-width: 860px) {
  .cart-layout { grid-template-columns: 1fr; }
}

/* ── Select Bar ── */
.select-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  background: #fff;
  margin-bottom: 10px;
}
.select-all-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  cursor: pointer;
  user-select: none;
}
.select-count {
  font-size: 11px;
  color: rgba(0,0,0,0.4);
  letter-spacing: 0.02em;
}

/* ── Custom Checkbox ── */
.custom-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1.5px solid rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
  background: #fff;
}
.custom-checkbox.checked {
  background: #000;
  border-color: #000;
  color: #fff;
}
.custom-checkbox.partial {
  background: rgba(0,0,0,0.1);
  border-color: rgba(0,0,0,0.3);
}

/* ── Cart Item ── */
.cart-item {
  display: grid;
  grid-template-columns: 18px 96px 1fr auto;
  gap: 14px;
  align-items: start;
  padding: 18px 16px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  background: #fff;
  margin-bottom: 8px;
  transition: border-color 0.15s;
}
.cart-item:hover { border-color: rgba(0, 0, 0, 0.25); }
.cart-item.is-selected { border-color: rgba(0, 0, 0, 0.3); }
@media (max-width: 600px) {
  .cart-item { grid-template-columns: 18px 72px 1fr; }
  .item-actions { grid-column: 1 / -1; display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
}

/* ── Product Image ── */
.product-img { border-radius: 8px; }

/* ── Product Info ── */
.item-info { min-width: 0; padding-top: 2px; }
.item-brand {
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(0,0,0,0.35);
  font-weight: 500;
  margin-bottom: 4px;
}
.item-name {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  margin-bottom: 8px;
}
.item-meta { display: flex; gap: 6px; flex-wrap: wrap; }
.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: rgba(0,0,0,0.5);
  background: rgba(0,0,0,0.04);
  border-radius: 4px;
  padding: 3px 8px;
}
.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.15);
  flex-shrink: 0;
}

/* ── Item Actions ── */
.item-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  min-width: 120px;
}
.price-block { text-align: right; }
.price-label {
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(0,0,0,0.35);
  margin-bottom: 2px;
}
.price-total { font-size: 16px; font-weight: 500; }
.price-unit { font-size: 11px; color: rgba(0,0,0,0.4); margin-top: 2px; }

/* ── Qty Control ── */
.qty-control {
  display: flex;
  align-items: center;
  border: 0.5px solid rgba(0,0,0,0.2);
  border-radius: 6px;
  overflow: hidden;
}
.qty-btn {
  width: 30px;
  height: 30px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0,0,0,0.6);
  transition: background 0.1s;
}
.qty-btn:hover:not(:disabled) { background: rgba(0,0,0,0.05); }
.qty-btn:disabled { opacity: 0.3; cursor: default; }
.qty-input {
  width: 36px;
  height: 30px;
  text-align: center;
  border: none;
  border-left: 0.5px solid rgba(0,0,0,0.1);
  border-right: 0.5px solid rgba(0,0,0,0.1);
  font-size: 13px;
  font-weight: 500;
  background: transparent;
  outline: none;
}

/* ── Delete Button ── */
.delete-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: rgba(0,0,0,0.35);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.15s;
}
.delete-btn:hover { color: #000; }
.delete-btn:disabled { opacity: 0.4; }

/* ── Summary Card ── */
.summary-card {
  background: #fff;
  border: 0.5px solid rgba(0,0,0,0.1);
  border-radius: 12px;
  padding: 24px;
  position: sticky;
  top: 1.5rem;
}
.summary-eyebrow {
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(0,0,0,0.35);
  font-weight: 500;
  margin-bottom: 4px;
}
.summary-title { font-size: 16px; font-weight: 500; margin-bottom: 20px; }
.summary-rows { display: flex; flex-direction: column; gap: 2px; }
.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: rgba(0,0,0,0.55);
  padding: 6px 0;
}
.summary-divider {
  border: none;
  border-top: 0.5px solid rgba(0,0,0,0.1);
  margin: 16px 0;
}
.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-size: 13px;
  font-weight: 500;
}
.total-amount { font-size: 22px; font-weight: 500; letter-spacing: -0.02em; }

/* ── Buttons ── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-primary:hover:not(:disabled) { opacity: 0.8; }
.btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }
.btn-primary.full { width: 100%; margin-bottom: 8px; }

.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 11px 24px;
  background: transparent;
  color: #000;
  border: 0.5px solid rgba(0,0,0,0.25);
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-outline:hover { background: rgba(0,0,0,0.04); }
.btn-outline.full { width: 100%; }

/* ── Security Note ── */
.security-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 11px;
  color: rgba(0,0,0,0.35);
  margin-top: 16px;
}

/* ── Transitions ── */
.item-list-enter-active,
.item-list-leave-active { transition: all 0.25s ease; }
.item-list-enter-from,
.item-list-leave-to { opacity: 0; transform: translateX(-16px); }
</style>