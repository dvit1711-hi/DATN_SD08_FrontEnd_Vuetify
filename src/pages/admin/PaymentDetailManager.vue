<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Chi tiết thanh toán</h1>
        <div class="text-body-2 text-medium-emphasis">
          Quản lý trạng thái đơn hàng và thanh toán
        </div>
      </div>

      <div class="d-flex ga-2">
        <v-btn variant="tonal" prepend-icon="mdi-arrow-left" @click="goBack">
          Quay lại
        </v-btn>

        <v-btn
          color="primary"
          prepend-icon="mdi-refresh"
          @click="loadOrderDetail"
          :loading="isLoading"
        >
          Làm mới
        </v-btn>
      </div>
    </div>

    <v-alert
      v-if="!isLoading && !selectedOrder"
      type="warning"
      variant="tonal"
      rounded="lg"
      class="mb-4"
      text="Không tìm thấy đơn hàng"
    />

    <v-card
      v-if="selectedOrder"
      rounded="xl"
      elevation="0"
      class="payment-detail-manager"
    >
      <v-card-title class="d-flex justify-space-between align-center">
        <div>
          <div class="text-h6 font-weight-bold">
            Quản lý đơn hàng / {{ getDisplayOrderCode(selectedOrder) }}
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ getDisplayCustomer(selectedOrder) }}
          </div>
        </div>

        <v-btn icon="mdi-arrow-left" variant="text" @click="goBack" />
      </v-card-title>

      <v-card-text>
        <v-card variant="tonal" color="grey-lighten-4" class="mb-4">
          <v-card-title class="text-subtitle-1">Lịch sử đơn hàng</v-card-title>

          <v-card-text>
            <div class="order-track-scroll">
              <div
                class="order-track"
                :style="trackWidthStyle(orderTimelineSteps)"
              >
                <div
                  v-for="(step, index) in orderTimelineSteps"
                  :key="step.id || `${step.code}-${index}`"
                  class="track-step"
                  :class="[
                    { 'track-step--visible': isStepVisible(index) },
                    getStepCodeClass(step),
                  ]"
                >
                  <div
                    class="track-icon"
                    :class="[
                      `track-icon--${step.state}`,
                      getStepIconClass(step),
                    ]"
                  >
                    <v-icon size="22">{{ step.icon }}</v-icon>
                  </div>

                  <div
                    class="track-connector"
                    :class="[connectorClass(step), getConnectorCodeClass(step)]"
                    :style="connectorDelayStyle(index)"
                  />

                  <div class="track-label text-subtitle-2">
                    {{ step.label }}
                  </div>

                  <div class="track-time text-caption text-medium-emphasis">
                    {{ step.time }}
                  </div>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <v-row>
          <v-col cols="12" md="7">
            <v-card variant="outlined" class="h-100">
              <v-card-title>Thông tin đơn hàng</v-card-title>

              <v-card-text>
                <div class="detail-row">
                  <span>Mã vận đơn:</span>
                  <strong>{{ getDisplayOrderCode(selectedOrder) }}</strong>
                </div>

                <div class="detail-row">
                  <span>Loại đơn:</span>
                  <strong>{{ getOrderTypeLabel(selectedOrder) }}</strong>
                </div>

                <div class="detail-row">
                  <span>Ngày tạo:</span>
                  <strong>{{ formatDate(selectedOrder?.orderDate) }}</strong>
                </div>

                <div class="detail-row">
                  <span>Khách hàng:</span>
                  <strong>{{ getDisplayCustomer(selectedOrder) }}</strong>
                </div>

                <div
                  class="detail-row"
                  v-if="isOfflineGuestOrder(selectedOrder)"
                >
                  <span>Số điện thoại:</span>
                  <strong>{{ selectedOrder?.customerPhone || "-" }}</strong>
                </div>

                <div
                  class="detail-row"
                  v-if="isOfflineGuestOrder(selectedOrder)"
                >
                  <span>Nhân viên tạo đơn:</span>
                  <strong>
                    {{
                      selectedOrder?.employeeName ||
                      selectedOrder?.employeeID ||
                      "-"
                    }}
                  </strong>
                </div>

                <div class="detail-row">
                  <span>Địa chỉ:</span>
                  <strong>{{ selectedOrder?.shippingAddress || "-" }}</strong>
                </div>

                <div class="detail-row">
                  <span>Mã giảm giá:</span>
                  <strong>{{ selectedOrder?.couponCode || "-" }}</strong>
                </div>

                <div class="detail-row">
                  <span>Tổng tiền:</span>
                  <strong class="text-red-darken-1">
                    {{ formatPrice(selectedOrder?.totalAmount) }}đ
                  </strong>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="5">
            <v-card variant="outlined" class="h-100">
              <v-card-title>Trạng thái</v-card-title>

              <v-card-text>
                <div class="mb-3 d-flex ga-2 flex-wrap">
                  <v-chip
                    size="small"
                    :color="getOrderStatusColor(selectedOrder)"
                    variant="flat"
                  >
                    {{ getOrderStatusLabel(selectedOrder) }}
                  </v-chip>

                  <v-chip
                    size="small"
                    :color="getPaymentStatusColor(selectedOrder?.paymentStatus)"
                    variant="flat"
                  >
                    {{ getPaymentStatusLabel(selectedOrder?.paymentStatus) }}
                  </v-chip>

                  <v-chip size="small" color="orange" variant="tonal">
                    {{ selectedOrder?.paymentMethod || "UNKNOWN" }}
                  </v-chip>

                  <v-chip
                    size="small"
                    :color="
                      isOnlineOrder(selectedOrder) ? 'primary' : 'deep-orange'
                    "
                    variant="tonal"
                  >
                    {{ getOrderTypeLabel(selectedOrder) }}
                  </v-chip>
                </div>

                <div class="d-flex ga-2 flex-wrap">
                  <v-btn
                    color="info"
                    variant="tonal"
                    :disabled="!canStartShipping(selectedOrder)"
                    :loading="
                      startingShippingOrderId === selectedOrder?.orderId
                    "
                    @click="startShipping(selectedOrder)"
                  >
                    {{ getStartShippingButtonLabel(selectedOrder) }}
                  </v-btn>

                  <v-btn
                    color="success"
                    variant="tonal"
                    :disabled="!canCompleteDelivery(selectedOrder)"
                    :loading="
                      completingDeliveryOrderId === selectedOrder?.orderId
                    "
                    @click="completeDelivery(selectedOrder)"
                  >
                    Đã giao hàng
                  </v-btn>

                  <v-btn
                    color="success"
                    :variant="
                      isUiDeliveredOrder(selectedOrder) ? 'tonal' : 'flat'
                    "
                    :disabled="!canConfirmOrder(selectedOrder)"
                    :loading="confirmingOrderId === selectedOrder?.orderId"
                    @click="confirmPayment(selectedOrder)"
                  >
                    Xác nhận thanh toán
                  </v-btn>

                  <v-btn
                    color="success"
                    variant="tonal"
                    :disabled="!canCompleteOrder(selectedOrder)"
                    :loading="completingOrderId === selectedOrder?.orderId"
                    @click="completeOrder(selectedOrder)"
                  >
                    Hoàn thành
                  </v-btn>

                  <v-btn
                    color="warning"
                    variant="tonal"
                    prepend-icon="mdi-undo"
                    :disabled="!canRevertOrder(selectedOrder)"
                    :loading="revertingOrderId === selectedOrder?.orderId"
                    @click="openRevertReasonDialog(selectedOrder)"
                  >
                    Quay lại trạng thái trước
                  </v-btn>

                  <v-btn
                    color="error"
                    variant="outlined"
                    :disabled="!canCancelOrder(selectedOrder)"
                    :loading="cancellingOrderId === selectedOrder?.orderId"
                    @click="cancelOrder(selectedOrder)"
                  >
                    Hủy đơn
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-card variant="outlined" class="mt-4">
          <v-card-title>Lịch sử chỉnh sửa đơn hàng</v-card-title>

          <v-card-text>
            <v-alert
              v-if="selectedOrderEditHistory.length === 0"
              type="info"
              variant="tonal"
              density="comfortable"
              text="Chưa có lịch sử chỉnh sửa cho đơn hàng này"
            />

            <v-timeline
              v-else
              density="compact"
              side="end"
              truncate-line="both"
              class="order-edit-timeline"
            >
              <v-timeline-item
                v-for="entry in selectedOrderEditHistory"
                :key="entry.id"
                dot-color="primary"
                size="small"
              >
                <div class="text-subtitle-2 font-weight-bold">
                  {{ entry.action }}
                </div>

                <div class="text-caption text-medium-emphasis mb-1">
                  {{ formatDate(entry.createdAt) }}
                </div>

                <div class="text-body-2 mb-1">Lý do: {{ entry.reason }}</div>

                <div
                  v-if="entry.transition"
                  class="text-caption text-medium-emphasis"
                >
                  {{ entry.transition }}
                </div>
              </v-timeline-item>
            </v-timeline>
          </v-card-text>
        </v-card>
      </v-card-text>
    </v-card>

    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      timeout="3000"
      top
    >
      {{ snackbarMessage }}
    </v-snackbar>

    <v-dialog v-model="revertReasonDialog" max-width="560">
      <v-card rounded="lg">
        <v-card-title>Lý do quay lại trạng thái</v-card-title>

        <v-card-text>
          <v-textarea
            v-model="revertReason"
            label="Nhập lý do"
            placeholder="Ví dụ: khách xin đổi lại lịch giao / thao tác nhầm trạng thái"
            variant="outlined"
            rows="4"
            auto-grow
            :error="revertReasonError"
            :error-messages="revertReasonError ? 'Vui lòng nhập lý do' : ''"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeRevertReasonDialog">Hủy</v-btn>
          <v-btn
            color="warning"
            variant="flat"
            :loading="revertingOrderId === revertTargetOrder?.orderId"
            @click="submitRevertOrder"
          >
            Xác nhận quay lại
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { onMounted } from "vue";
import { usePaymentDetailManager } from "@/composables/payment/usePaymentDetailManager";

const {
  selectedOrder,
  isLoading,
  confirmingOrderId,
  cancellingOrderId,
  revertingOrderId,
  startingShippingOrderId,
  completingDeliveryOrderId,
  completingOrderId,
  showSnackbar,
  snackbarMessage,
  snackbarColor,
  revertReasonDialog,
  revertReason,
  revertReasonError,
  revertTargetOrder,

  orderTimelineSteps,
  selectedOrderEditHistory,

  goBack,
  loadOrderDetail,
  initPaymentDetail,

  formatDate,
  formatPrice,
  getDisplayOrderCode,
  getDisplayCustomer,
  getOrderTypeLabel,
  getPaymentStatusColor,
  getPaymentStatusLabel,
  getOrderStatusColor,
  getOrderStatusLabel,

  isOnlineOrder,
  isOfflineGuestOrder,
  isUiDeliveredOrder,

  canStartShipping,
  canCompleteDelivery,
  canConfirmOrder,
  canCompleteOrder,
  canRevertOrder,
  canCancelOrder,

  getStartShippingButtonLabel,
  startShipping,
  completeDelivery,
  confirmPayment,
  completeOrder,
  openRevertReasonDialog,
  closeRevertReasonDialog,
  submitRevertOrder,
  cancelOrder,

  trackWidthStyle,
  isStepVisible,
  connectorClass,
  connectorDelayStyle,
} = usePaymentDetailManager();

const normalizeStepCode = (code) => {
  return String(code || "")
    .toLowerCase()
    .replaceAll("_", "-");
};

const getStepCodeClass = (step) => {
  return `track-step--${normalizeStepCode(step?.code)}`;
};

const getStepIconClass = (step) => {
  return `track-icon--code-${normalizeStepCode(step?.code)}`;
};

const getConnectorCodeClass = (step) => {
  return `track-connector--code-${normalizeStepCode(step?.code)}`;
};

onMounted(initPaymentDetail);
</script>

<style scoped src="@/assets/css/payment-manager.css"></style>
