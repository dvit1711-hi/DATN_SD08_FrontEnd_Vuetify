<template>
  <v-container class="py-8" fluid>
    <div class="mb-6 d-flex align-center justify-space-between flex-wrap ga-3">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Lịch sử mua hàng</h1>
        <p class="text-subtitle-1 text-grey">
          Theo dõi trạng thái đơn hàng và thanh toán của bạn
        </p>
      </div>

      <v-btn
        color="black"
        variant="outlined"
        prepend-icon="mdi-refresh"
        :loading="isLoading"
        @click="loadOrders"
      >
        Làm mới
      </v-btn>
    </div>

    <v-alert v-if="!isLoggedIn" type="warning" variant="tonal" class="mb-6">
      Vui lòng đăng nhập để xem lịch sử mua hàng.

      <template #append>
        <v-btn color="warning" variant="flat" @click="goLogin">
          Đăng nhập
        </v-btn>
      </template>
    </v-alert>

    <div v-else>
      <v-empty-state
        v-if="!isLoading && orders.length === 0"
        title="Chưa có đơn hàng"
        text="Bạn chưa tạo đơn nào. Hãy mua sắm ngay"
        icon="mdi-package-variant-closed-remove"
      >
        <template #actions>
          <v-btn color="primary" @click="goProducts"> Tiếp tục mua sắm </v-btn>
        </template>
      </v-empty-state>

      <v-expansion-panels v-else variant="accordion">
        <v-expansion-panel
          v-for="order in orders"
          :key="order.orderId"
          class="mb-3"
        >
          <v-expansion-panel-title>
            <div class="w-100 order-summary">
              <div
                class="d-flex align-center justify-space-between flex-wrap ga-2"
              >
                <div>
                  <div class="font-weight-bold">Đơn #{{ order.orderId }}</div>

                  <div class="text-caption text-grey">
                    {{ formatDate(order.orderDate) }}
                  </div>

                  <div v-if="order.trackingCode" class="text-caption text-grey">
                    Mã vận đơn: {{ order.trackingCode }}
                  </div>
                </div>

                <div class="d-flex align-center ga-2 flex-wrap justify-end">
                  <v-chip
                    size="small"
                    :color="getDisplayStatus(order).color"
                    variant="tonal"
                  >
                    {{ getDisplayStatus(order).label }}
                  </v-chip>

                  <v-chip
                    size="small"
                    :color="getPaymentStatusColor(order.paymentStatus)"
                    variant="tonal"
                  >
                    {{ getPaymentStatusLabel(order.paymentStatus) }}
                  </v-chip>

                  <v-chip
                    v-if="order.couponCode"
                    size="small"
                    color="orange"
                    variant="tonal"
                  >
                    Mã: {{ order.couponCode }}
                  </v-chip>

                  <v-chip size="small" color="orange" variant="tonal">
                    {{ getPaymentMethodLabel(order.paymentMethod) }}
                  </v-chip>

                  <div class="font-weight-bold text-black">
                    {{ formatPrice(order.totalAmount) }}đ
                  </div>
                </div>
              </div>

              <div class="order-preview mt-3">
                <div class="order-preview-label text-caption text-grey">
                  Ảnh sản phẩm
                </div>

                <div class="order-preview-images">
                  <template v-if="getOrderPreviewItems(order).length > 0">
                    <v-avatar
                      v-for="(item, index) in getOrderPreviewItems(order)"
                      :key="`${order.orderId}-${item.orderDetailId || index}`"
                      size="44"
                      rounded="lg"
                      class="order-preview-avatar"
                    >
                      <v-img
                        :src="resolveOrderItemImageUrl(item.imageUrl)"
                        cover
                      />
                    </v-avatar>

                    <div
                      v-if="getOrderPreviewOverflowCount(order) > 0"
                      class="order-preview-avatar order-preview-avatar--more"
                    >
                      +{{ getOrderPreviewOverflowCount(order) }}
                    </div>
                  </template>

                  <div v-else class="text-caption text-grey">
                    Không có ảnh sản phẩm
                  </div>
                </div>
              </div>
            </div>
          </v-expansion-panel-title>

          <v-expansion-panel-text>
            <OrderTimeline
              title="Lịch sử đơn hàng"
              :steps="getTrackingSteps(order)"
              :animated="false"
            />

            <v-alert
              type="info"
              variant="tonal"
              density="comfortable"
              class="mb-4"
              icon="mdi-map-marker"
              title="Địa chỉ nhận hàng"
              :text="formatOrderAddress(order.shippingAddress)"
            />

            <div class="d-flex justify-end mb-3">
              <v-btn
                v-if="canCancelOrder(order)"
                color="error"
                variant="outlined"
                size="small"
                :loading="cancellingOrderId === order.orderId"
                @click="cancelOrder(order)"
              >
                Hủy đơn hàng
              </v-btn>
            </div>

            <v-card variant="outlined" class="order-items-card">
              <v-card-title class="order-items-head">
                <div class="text-subtitle-1 font-weight-bold">
                  Danh sách sản phẩm
                </div>

                <v-chip color="primary" variant="tonal" size="small">
                  {{ getOrderItems(order).length }} sản phẩm
                </v-chip>
              </v-card-title>

              <v-divider />

              <v-card-text class="pa-0">
                <v-list lines="two" class="bg-grey-lighten-5">
                  <v-list-item
                    v-for="item in getOrderItems(order)"
                    :key="item.orderDetailId"
                    class="py-3"
                  >
                    <template #prepend>
                      <v-avatar size="56" rounded="lg" class="mr-3">
                        <v-img
                          :src="resolveOrderItemImageUrl(item.imageUrl)"
                          cover
                        />
                      </v-avatar>
                    </template>

                    <v-list-item-title class="font-weight-bold">
                      {{ item.productName || "Sản phẩm" }}
                    </v-list-item-title>

                    <v-list-item-subtitle>
                      <div>
                        Màu: {{ item.colorName || "Không xác định" }} | Size:
                        {{ item.sizeName || "-" }} | Giá:
                        {{ formatPrice(item.price) }}đ
                      </div>

                      <div class="mt-1 d-flex align-center ga-2 flex-wrap">
                        <v-chip size="x-small" variant="tonal">
                          Đã mua: {{ getBoughtQuantity(item) }}
                        </v-chip>

                        <v-chip
                          v-if="getShippingReturnedQuantity(item) > 0"
                          size="x-small"
                          color="warning"
                          variant="tonal"
                        >
                          Đã hoàn: {{ getShippingReturnedQuantity(item) }}
                        </v-chip>

                        <v-chip
                          v-if="getCompletedReturnedQuantity(item) > 0"
                          size="x-small"
                          color="deep-orange"
                          variant="tonal"
                        >
                          Đã trả: {{ getCompletedReturnedQuantity(item) }}
                        </v-chip>

                        <v-chip
                          v-if="getReturnedQuantity(item) > 0"
                          size="x-small"
                          color="success"
                          variant="tonal"
                        >
                          Còn lại: {{ getRemainingQuantity(item) }}
                        </v-chip>
                      </div>
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>

            <v-card
              v-if="getShippingReturnedItems(order).length > 0"
              variant="outlined"
              class="mt-4 returned-table-card returned-table-card--shipping"
            >
              <v-card-title class="order-items-head">
                <div class="text-subtitle-1 font-weight-bold">
                  Danh sách sản phẩm hoàn hàng
                </div>

                <v-chip color="warning" variant="tonal" size="small">
                  {{ getShippingReturnedItems(order).length }} sản phẩm
                </v-chip>
              </v-card-title>

              <v-divider />

              <v-table class="returned-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th class="text-center">Giá</th>
                    <th class="text-center">SL hoàn</th>
                    <th>Ghi chú</th>
                    <th>Thời gian</th>
                    <th class="text-right">Thành tiền</th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="item in getShippingReturnedItems(order)"
                    :key="`shipping-${order.orderId}-${item.orderDetailId}`"
                  >
                    <td>
                      <div class="returned-product-cell">
                        <v-img
                          :src="resolveOrderItemImageUrl(item.imageUrl)"
                          width="64"
                          height="64"
                          cover
                          class="returned-table-image"
                        />

                        <div>
                          <div class="returned-table-name">
                            {{ item.productName || "Sản phẩm" }}
                          </div>
                          <div class="returned-table-meta">
                            Màu: {{ item.colorName || "-" }}
                          </div>
                          <div class="returned-table-meta">
                            Size: {{ item.sizeName || "-" }}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td class="text-center returned-table-price">
                      {{ formatPrice(item.price) }}đ
                    </td>

                    <td class="text-center">
                      <v-chip size="small" color="warning" variant="tonal">
                        x{{ getShippingReturnedQuantity(item) }}
                      </v-chip>
                    </td>

                    <td class="returned-table-note">
                      {{ getReturnNote(order, item, "SHIPPING_RETURN") || "-" }}
                    </td>

                    <td class="returned-table-meta">
                      {{
                        getReturnTime(order, item, "SHIPPING_RETURN") ||
                        formatDate(order.orderDate)
                      }}
                    </td>

                    <td class="text-right returned-table-total">
                      {{ formatPrice(getShippingReturnedLineTotal(item)) }}đ
                    </td>
                  </tr>
                </tbody>

                <tfoot>
                  <tr>
                    <td colspan="5" class="text-right returned-table-footer">
                      Tổng tiền hoàn:
                    </td>
                    <td class="text-right returned-table-footer-total">
                      {{ formatPrice(getShippingReturnedOrderTotal(order)) }}đ
                    </td>
                  </tr>
                </tfoot>
              </v-table>
            </v-card>

            <v-card
              v-if="getCompletedReturnedItems(order).length > 0"
              variant="outlined"
              class="mt-4 returned-table-card returned-table-card--completed"
            >
              <v-card-title class="order-items-head">
                <div class="text-subtitle-1 font-weight-bold">
                  Danh sách sản phẩm trả hàng
                </div>

                <v-chip color="deep-orange" variant="tonal" size="small">
                  {{ getCompletedReturnedItems(order).length }} sản phẩm
                </v-chip>
              </v-card-title>

              <v-divider />

              <v-table class="returned-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th class="text-center">Giá</th>
                    <th class="text-center">SL trả</th>
                    <th>Ghi chú</th>
                    <th>Thời gian</th>
                    <th class="text-right">Thành tiền</th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="item in getCompletedReturnedItems(order)"
                    :key="`completed-${order.orderId}-${item.orderDetailId}`"
                  >
                    <td>
                      <div class="returned-product-cell">
                        <v-img
                          :src="resolveOrderItemImageUrl(item.imageUrl)"
                          width="64"
                          height="64"
                          cover
                          class="returned-table-image"
                        />

                        <div>
                          <div class="returned-table-name">
                            {{ item.productName || "Sản phẩm" }}
                          </div>
                          <div class="returned-table-meta">
                            Màu: {{ item.colorName || "-" }}
                          </div>
                          <div class="returned-table-meta">
                            Size: {{ item.sizeName || "-" }}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td class="text-center returned-table-price">
                      {{ formatPrice(item.price) }}đ
                    </td>

                    <td class="text-center">
                      <v-chip size="small" color="deep-orange" variant="tonal">
                        x{{ getCompletedReturnedQuantity(item) }}
                      </v-chip>
                    </td>

                    <td class="returned-table-note">
                      {{
                        getReturnNote(order, item, "COMPLETED_RETURN") || "-"
                      }}
                    </td>

                    <td class="returned-table-meta">
                      {{
                        getReturnTime(order, item, "COMPLETED_RETURN") ||
                        formatDate(order.orderDate)
                      }}
                    </td>

                    <td class="text-right returned-table-total">
                      {{ formatPrice(getCompletedReturnedLineTotal(item)) }}đ
                    </td>
                  </tr>
                </tbody>

                <tfoot>
                  <tr>
                    <td colspan="5" class="text-right returned-table-footer">
                      Tổng tiền trả:
                    </td>
                    <td class="text-right returned-table-footer-total">
                      {{ formatPrice(getCompletedReturnedOrderTotal(order)) }}đ
                    </td>
                  </tr>
                </tfoot>
              </v-table>
            </v-card>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>

    <div v-if="isLoading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" size="46" />
    </div>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import paymentApi from "@/api/paymentApi";
import OrderTimeline from "@/components/common/OrderTimeline.vue";

const router = useRouter();
const userStore = useUserStore();

const orders = ref([]);
const isLoading = ref(false);
const cancellingOrderId = ref(null);
const uiShippingStartedOrderIds = ref(new Set());
const uiDeliveredOrderIds = ref(new Set());

const IMAGE_BASE_URL = "";
const fallbackImage = "https://via.placeholder.com/64x64?text=No+Image";

const ONLINE_CONFIRMED_ORDERS_KEY = "onlineTransferConfirmedOrderIds";
const HIDDEN_CANCELLED_ONLINE_ORDERS_KEY = "hiddenCancelledOnlineOrderIds";
const ADMIN_ONLINE_SHIPPING_STARTED_KEY = "adminOnlineShippingStartedOrderIds";
const ADMIN_UI_DELIVERED_ORDER_IDS_KEY = "adminUiDeliveredOrderIds";

const isLoggedIn = computed(() => userStore.isLoggedIn);

const formatPrice = (value) => {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
};

const formatDate = (value) => {
  if (!value) return "Không có dữ liệu";

  if (typeof value === "string" && /^\d{2}\/\d{2}\/\d{4}/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? String(value)
    : parsed.toLocaleString("vi-VN");
};

const resolveOrderItemImageUrl = (imageUrl) => {
  const value = String(imageUrl || "").trim();

  if (!value) return fallbackImage;

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  return value.startsWith("/")
    ? `${IMAGE_BASE_URL}${value}`
    : `${IMAGE_BASE_URL}/${value}`;
};

const getOrderItems = (order) => {
  return Array.isArray(order?.items) ? order.items : [];
};

const getOrderPreviewItems = (order, limit = 4) => {
  return getOrderItems(order).slice(0, limit);
};

const getOrderPreviewOverflowCount = (order, limit = 4) => {
  return Math.max(getOrderItems(order).length - limit, 0);
};

const getBoughtQuantity = (item) => {
  return Number(item?.quantity || 0);
};

const getReturnedQuantity = (item) => {
  return Number(item?.returnedQuantity || 0);
};

const getShippingReturnedQuantity = (item) => {
  return Number(item?.shippingReturnedQuantity || 0);
};

const getCompletedReturnedQuantity = (item) => {
  return Number(item?.completedReturnedQuantity || 0);
};

const getRemainingQuantity = (item) => {
  const remaining = item?.remainingQuantity ?? item?.returnableQuantity;
  if (remaining !== undefined && remaining !== null) {
    return Number(remaining || 0);
  }

  return Math.max(0, getBoughtQuantity(item) - getReturnedQuantity(item));
};

const getShippingReturnedItems = (order) => {
  return getOrderItems(order).filter(
    (item) => getShippingReturnedQuantity(item) > 0,
  );
};

const getCompletedReturnedItems = (order) => {
  return getOrderItems(order).filter(
    (item) => getCompletedReturnedQuantity(item) > 0,
  );
};

const hasCompletedReturnedItems = (order) => {
  return getCompletedReturnedItems(order).length > 0;
};

const hasShippingReturnedItems = (order) => {
  return getShippingReturnedItems(order).length > 0;
};

const getShippingReturnedLineTotal = (item) => {
  return Number(item?.price || 0) * getShippingReturnedQuantity(item);
};

const getCompletedReturnedLineTotal = (item) => {
  return Number(item?.price || 0) * getCompletedReturnedQuantity(item);
};

const getShippingReturnedOrderTotal = (order) => {
  return getShippingReturnedItems(order).reduce((sum, item) => {
    return sum + getShippingReturnedLineTotal(item);
  }, 0);
};

const getCompletedReturnedOrderTotal = (order) => {
  return getCompletedReturnedItems(order).reduce((sum, item) => {
    return sum + getCompletedReturnedLineTotal(item);
  }, 0);
};

const getReturnLineByType = (order, item, type) => {
  const noteText = String(order?.note || "").trim();
  if (!noteText) return "";

  const productName = String(item?.productName || "").trim();
  const label = type === "SHIPPING_RETURN" ? "HOAN_HANG" : "TRA_HANG";

  const lines = noteText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    [...lines].reverse().find((line) => {
      const sameType = line.includes(`[${label}`);
      const sameProduct = productName ? line.includes(productName) : true;
      return sameType && sameProduct;
    }) || ""
  );
};

const getReturnNote = (order, item, type) => {
  const line = getReturnLineByType(order, item, type);
  const match = line.match(/Ghi chú:\s*(.*)$/i);
  return match?.[1]?.trim() || "";
};

const getReturnTime = (order, item, type) => {
  const line = getReturnLineByType(order, item, type);
  const match = line.match(/\[(?:HOAN_HANG|TRA_HANG)\s+([^\]]+)\]/i);
  return match?.[1]?.trim() || "";
};

const getLatestReturnTime = (order) => {
  const noteText = String(order?.note || "").trim();
  if (!noteText) return "";

  const lines = noteText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => /^\[(HOAN_HANG|TRA_HANG)\s+/i.test(line));

  const lastLine = lines[lines.length - 1] || "";
  const match = lastLine.match(/\[(?:HOAN_HANG|TRA_HANG)\s+([^\]]+)\]/i);

  return match?.[1]?.trim() || "";
};

const formatOrderAddress = (shippingAddress) => {
  const value = String(shippingAddress || "").trim();
  return value.length > 0 ? value : "Không có địa chỉ cho đơn này";
};

const getPaymentStatusLabel = (status) => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "PAID") return "Đã thanh toán";
  if (normalized === "UNPAID") return "Chưa thanh toán";
  if (normalized === "CANCELLED") return "Đã hủy";
  return "Không xác định";
};

const getPaymentStatusColor = (status) => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "PAID") return "success";
  if (normalized === "UNPAID") return "warning";
  if (normalized === "CANCELLED") return "error";
  return "info";
};

const getPaymentMethodLabel = (method) => {
  const normalized = String(method || "").toUpperCase();
  if (normalized === "COD") return "Thanh toán khi nhận hàng";
  if (normalized === "CASH") return "Tiền mặt";
  if (normalized === "BANK_TRANSFER") return "Chuyển khoản ngân hàng";
  if (normalized === "BANKING") return "Chuyển khoản ngân hàng";
  if (normalized === "E_WALLET") return "Ví điện tử";
  if (normalized === "VNPAY") return "VNPay";
  if (normalized === "MOMO") return "MoMo";
  return "Không xác định";
};

const isOnlinePaymentMethod = (order) => {
  const method = String(order?.paymentMethod || "").toUpperCase();
  return (
    method === "BANK_TRANSFER" ||
    method === "E_WALLET" ||
    method === "BANKING" ||
    method === "VNPAY" ||
    method === "MOMO"
  );
};

const isCodPaymentMethod = (order) => {
  const method = String(order?.paymentMethod || "").toUpperCase();
  return method === "COD" || method === "CASH";
};

const loadIdSet = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = JSON.parse(raw || "[]");

    return new Set(
      Array.isArray(parsed)
        ? parsed
            .map((value) => Number.parseInt(value, 10))
            .filter(Number.isFinite)
        : [],
    );
  } catch {
    return new Set();
  }
};

const reloadUiTimelineState = () => {
  uiShippingStartedOrderIds.value = loadIdSet(
    ADMIN_ONLINE_SHIPPING_STARTED_KEY,
  );
  uiDeliveredOrderIds.value = loadIdSet(ADMIN_UI_DELIVERED_ORDER_IDS_KEY);
};

const isUiShippingStartedOrder = (order) => {
  const orderId = Number.parseInt(order?.orderId, 10);
  return (
    Number.isFinite(orderId) && uiShippingStartedOrderIds.value.has(orderId)
  );
};

const isUiDeliveredOrder = (order) => {
  const orderId = Number.parseInt(order?.orderId, 10);
  return Number.isFinite(orderId) && uiDeliveredOrderIds.value.has(orderId);
};

const getDisplayStatus = (order) => {
  const orderStatus = String(order?.orderStatus || "").toUpperCase();
  const paymentStatus = String(order?.paymentStatus || "").toUpperCase();
  const uiShippingStarted = isUiShippingStartedOrder(order);
  const uiDelivered = isUiDeliveredOrder(order);

  if (orderStatus === "CANCELLED" || paymentStatus === "CANCELLED") {
    return { label: "Đã hủy", color: "error" };
  }

  if (orderStatus === "RETURNED") {
    if (hasCompletedReturnedItems(order)) {
      return { label: "Trả hàng", color: "error" };
    }

    return { label: "Hoàn hàng", color: "error" };
  }

  if (orderStatus === "PARTIAL_RETURNED") {
    return { label: "Trả hàng một phần", color: "deep-orange" };
  }

  if (orderStatus === "PAID") {
    return { label: "Hoàn thành", color: "success" };
  }

  if (orderStatus === "SHIPPING") {
    if (uiDelivered) return { label: "Đã giao hàng", color: "warning" };
    if (uiShippingStarted) return { label: "Đang giao hàng", color: "primary" };
    return { label: "Chờ giao hàng", color: "warning" };
  }

  if (
    isOnlinePaymentMethod(order) &&
    orderStatus === "PENDING_PAYMENT" &&
    paymentStatus === "PAID"
  ) {
    return { label: "Chờ giao hàng", color: "warning" };
  }

  if (paymentStatus === "PAID" && isCodPaymentMethod(order)) {
    return { label: "Xác nhận thanh toán", color: "warning" };
  }

  if (paymentStatus === "UNPAID" || orderStatus === "PENDING_PAYMENT") {
    return { label: "Chờ xác nhận", color: "warning" };
  }

  return { label: "Không xác định", color: "info" };
};

const getOnlineBaseSteps = () => [
  {
    code: "WAIT_CONFIRM",
    label: "Chờ xác nhận",
    icon: "mdi-text-box-check-outline",
    time: "-",
  },
  {
    code: "TRANSFER_CONFIRM",
    label: "Xác nhận thanh toán",
    icon: "mdi-bank-check",
    time: "-",
  },
  {
    code: "WAIT_SHIP",
    label: "Chờ giao hàng",
    icon: "mdi-package-variant-closed-check",
    time: "-",
  },
  {
    code: "SHIPPING",
    label: "Đang giao hàng",
    icon: "mdi-truck-delivery-outline",
    time: "-",
  },
  {
    code: "DELIVERED",
    label: "Đã giao hàng",
    icon: "mdi-truck-check-outline",
    time: "-",
  },
  {
    code: "COMPLETED",
    label: "Hoàn thành",
    icon: "mdi-check-decagram-outline",
    time: "-",
  },
];

const getCodBaseSteps = () => [
  {
    code: "WAIT_CONFIRM",
    label: "Chờ xác nhận",
    icon: "mdi-text-box-check-outline",
    time: "-",
  },
  {
    code: "WAIT_SHIP",
    label: "Chờ giao hàng",
    icon: "mdi-package-variant-closed-check",
    time: "-",
  },
  {
    code: "SHIPPING",
    label: "Đang giao hàng",
    icon: "mdi-truck-delivery-outline",
    time: "-",
  },
  {
    code: "DELIVERED",
    label: "Đã giao hàng",
    icon: "mdi-truck-check-outline",
    time: "-",
  },
  {
    code: "TRANSFER_CONFIRM",
    label: "Đã thanh toán",
    icon: "mdi-cash-check",
    time: "-",
  },
  {
    code: "COMPLETED",
    label: "Hoàn thành",
    icon: "mdi-check-decagram-outline",
    time: "-",
  },
];

const getTrackingSteps = (order) => {
  const orderStatus = String(order?.orderStatus || "").toUpperCase();
  const paymentStatus = String(order?.paymentStatus || "").toUpperCase();
  const createdTime = formatDate(order?.orderDate);
  const uiShippingStarted = isUiShippingStartedOrder(order);
  const uiDelivered = isUiDeliveredOrder(order);
  const baseSteps = isOnlinePaymentMethod(order)
    ? getOnlineBaseSteps()
    : getCodBaseSteps();

  if (orderStatus === "CANCELLED" || paymentStatus === "CANCELLED") {
    return [
      { ...baseSteps[0], state: "done", time: createdTime },
      {
        code: "CANCELLED",
        label: "Đã hủy",
        icon: "mdi-close-octagon-outline",
        time: createdTime,
        state: "cancelled",
      },
    ];
  }

  if (orderStatus === "RETURNED") {
    const returnedLabel = hasCompletedReturnedItems(order)
      ? "Trả hàng"
      : "Hoàn hàng";

    return [
      ...baseSteps.map((step, index) => ({
        ...step,
        state: "done",
        time: index === 0 ? createdTime : "-",
      })),
      {
        code: "RETURNED",
        label: returnedLabel,
        icon: "mdi-keyboard-return",
        time: getLatestReturnTime(order) || createdTime,
        state: "returned",
      },
    ];
  }

  if (orderStatus === "PARTIAL_RETURNED") {
    return [
      ...baseSteps.map((step, index) => ({
        ...step,
        state: "done",
        time: index === 0 ? createdTime : "-",
      })),
      {
        code: "PARTIAL_RETURNED",
        label: "Trả hàng một phần",
        icon: "mdi-keyboard-return",
        time: getLatestReturnTime(order) || createdTime,
        state: "returned",
      },
    ];
  }

  let activeIndex = 0;

  if (isOnlinePaymentMethod(order)) {
    if (orderStatus === "PAID") {
      activeIndex = 5;
    } else if (
      paymentStatus === "UNPAID" &&
      orderStatus === "PENDING_PAYMENT"
    ) {
      activeIndex = 0;
    } else if (paymentStatus === "PAID" && !uiShippingStarted) {
      activeIndex = 2;
    } else if (paymentStatus === "PAID" && uiShippingStarted && !uiDelivered) {
      activeIndex = 3;
    } else if (paymentStatus === "PAID" && uiDelivered) {
      activeIndex = 4;
    }
  } else {
    if (orderStatus === "PAID") {
      activeIndex = 5;
    } else if (
      paymentStatus === "UNPAID" &&
      orderStatus === "PENDING_PAYMENT"
    ) {
      activeIndex = 0;
    } else if (
      orderStatus === "SHIPPING" &&
      uiShippingStarted &&
      !uiDelivered
    ) {
      activeIndex = 2;
    } else if (
      orderStatus === "SHIPPING" &&
      uiDelivered &&
      paymentStatus === "UNPAID"
    ) {
      activeIndex = 3;
    } else if (
      orderStatus === "SHIPPING" &&
      uiDelivered &&
      paymentStatus === "PAID"
    ) {
      activeIndex = 4;
    }
  }

  return baseSteps.map((step, index) => {
    let state = "pending";

    if (index < activeIndex) {
      state = "done";
    }

    if (index === activeIndex) {
      state = index === baseSteps.length - 1 ? "done" : "current";
    }

    return {
      ...step,
      state,
      time: index === 0 || index <= activeIndex ? createdTime : "-",
    };
  });
};

const getOnlineConfirmedOrderIds = () => {
  try {
    const raw = localStorage.getItem(ONLINE_CONFIRMED_ORDERS_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed)
      ? parsed.map((x) => Number.parseInt(x, 10)).filter(Number.isFinite)
      : [];
  } catch {
    return [];
  }
};

const getHiddenCancelledOnlineOrderIds = () => {
  try {
    const raw = localStorage.getItem(HIDDEN_CANCELLED_ONLINE_ORDERS_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed)
      ? parsed.map((x) => Number.parseInt(x, 10)).filter(Number.isFinite)
      : [];
  } catch {
    return [];
  }
};

const getOrderSortTime = (order) => {
  const value = String(order?.orderDate || "").trim();

  if (value) {
    const ddMmYyyyMatch = value.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
    );

    if (ddMmYyyyMatch) {
      const [, day, month, year, hour = "0", minute = "0", second = "0"] =
        ddMmYyyyMatch;

      const parsedTime = new Date(
        Number.parseInt(year, 10),
        Number.parseInt(month, 10) - 1,
        Number.parseInt(day, 10),
        Number.parseInt(hour, 10),
        Number.parseInt(minute, 10),
        Number.parseInt(second, 10),
      ).getTime();

      if (Number.isFinite(parsedTime)) {
        return parsedTime;
      }
    }

    const parsedTime = new Date(value).getTime();
    if (Number.isFinite(parsedTime)) {
      return parsedTime;
    }
  }

  const orderId = Number.parseInt(order?.orderId, 10);
  return Number.isFinite(orderId) ? orderId : 0;
};

const loadOrders = async () => {
  if (!isLoggedIn.value) {
    orders.value = [];
    return;
  }

  const accountId = Number.parseInt(userStore.accountId, 10);
  if (!Number.isFinite(accountId) || accountId <= 0) {
    orders.value = [];
    return;
  }

  isLoading.value = true;

  try {
    reloadUiTimelineState();

    const res = await paymentApi.getOrdersByAccount(accountId, userStore.token);
    const allOrders = Array.isArray(res.data) ? res.data : [];
    const confirmedOnlineOrderIds = new Set(getOnlineConfirmedOrderIds());
    const hiddenCancelledOnlineOrderIds = new Set(
      getHiddenCancelledOnlineOrderIds(),
    );

    orders.value = allOrders
      .filter((order) => {
        const orderId = Number.parseInt(order?.orderId, 10);

        if (
          Number.isFinite(orderId) &&
          hiddenCancelledOnlineOrderIds.has(orderId)
        ) {
          return false;
        }

        const method = String(order?.paymentMethod || "").toUpperCase();
        const paymentStatus = String(order?.paymentStatus || "").toUpperCase();

        if (method !== "BANK_TRANSFER" || paymentStatus !== "UNPAID") {
          return true;
        }

        return Number.isFinite(orderId) && confirmedOnlineOrderIds.has(orderId);
      })
      .sort((a, b) => {
        const timeDiff = getOrderSortTime(b) - getOrderSortTime(a);
        if (timeDiff !== 0) return timeDiff;

        return (
          Number.parseInt(b?.orderId || 0, 10) -
          Number.parseInt(a?.orderId || 0, 10)
        );
      });
  } catch (error) {
    console.error("Lỗi tải lịch sử mua hàng:", error);
    orders.value = [];
  } finally {
    isLoading.value = false;
  }
};

const canCancelOrder = (order) => {
  const orderStatus = String(order?.orderStatus || "").toUpperCase();
  const paymentStatus = String(order?.paymentStatus || "").toUpperCase();

  return orderStatus === "PENDING_PAYMENT" && paymentStatus === "UNPAID";
};

const cancelOrder = async (order) => {
  if (!canCancelOrder(order)) return;

  const confirmed = window.confirm(
    `Bạn có chắc muốn hủy đơn #${order.orderId}?`,
  );
  if (!confirmed) return;

  const accountId = Number.parseInt(userStore.accountId, 10);
  if (!Number.isFinite(accountId) || accountId <= 0) return;

  cancellingOrderId.value = order.orderId;

  try {
    await paymentApi.cancelOrderByUser(
      accountId,
      order.orderId,
      userStore.token,
    );
    order.orderStatus = "CANCELLED";
    order.paymentStatus = "CANCELLED";
  } catch (error) {
    console.error("Lỗi hủy đơn hàng:", error);
  } finally {
    cancellingOrderId.value = null;
  }
};

const goLogin = () => router.push({ name: "Login" });
const goProducts = () => router.push({ name: "ProductList" });

onMounted(loadOrders);
</script>

<style scoped>
.order-summary {
  width: 100%;
}

.order-preview {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding-top: 12px;
}

.order-preview-images {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.order-preview-avatar {
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
  overflow: hidden;
}

.order-preview-avatar--more {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #f5f5f5;
  color: #616161;
  font-weight: 700;
  font-size: 0.8rem;
}

.order-items-card {
  overflow: hidden;
}

.order-items-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.returned-table-card {
  overflow: hidden;
  border-color: #e5e7eb !important;
}

.returned-table-card--shipping {
  border-color: #f59e0b !important;
}

.returned-table-card--completed {
  border-color: #f97316 !important;
}

.returned-table th {
  font-size: 13px;
  font-weight: 800;
  color: #374151;
  background: #f9fafb;
  white-space: nowrap;
}

.returned-table td {
  padding: 14px 16px !important;
  vertical-align: middle;
  border-bottom: 1px solid #edf0f3;
}

.returned-product-cell {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 260px;
}

.returned-table-image {
  width: 64px;
  height: 64px;
  flex: 0 0 64px;
  border-radius: 8px;
  background: #f5f5f5;
  border: 1px solid #eee;
}

.returned-table-name {
  font-size: 14px;
  font-weight: 800;
  color: #333;
  margin-bottom: 4px;
}

.returned-table-meta {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.45;
}

.returned-table-price,
.returned-table-total {
  font-size: 14px;
  font-weight: 800;
  color: #f04438;
  white-space: nowrap;
}

.returned-table-note {
  max-width: 260px;
  color: #444;
}

.returned-table-footer {
  font-weight: 800;
  color: #333;
  background: #fffaf0;
}

.returned-table-footer-total {
  font-weight: 900;
  color: #f04438;
  background: #fffaf0;
  white-space: nowrap;
}

@media (max-width: 700px) {
  .order-preview-images {
    gap: 6px;
  }

  .returned-table {
    min-width: 920px;
  }
}
</style>
