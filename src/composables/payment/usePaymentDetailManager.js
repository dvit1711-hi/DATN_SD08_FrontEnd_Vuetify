import { computed, onBeforeUnmount, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import paymentApi from "@/api/paymentApi";
import {
  formatDate,
  formatPrice,
  getDisplayCustomer,
  getDisplayOrderCode,
  getOrderTypeLabel,
  getPaymentStatusColor,
  getPaymentStatusLabel,
  isCodPaymentMethod,
  isOfflineGuestOrder,
  isOfflineOrder,
  isOnlineOrder,
  isOnlinePaymentMethod,
  ONLINE_SHIPPING_STARTED_KEY,
  ORDER_EDIT_HISTORY_KEY,
  ORDER_TIMELINE_KEY,
  UI_DELIVERED_ORDER_IDS_KEY,
  UI_ORDER_CONFIRMED_IDS_KEY,
} from "@/utils/paymentOrderUtils";

export function usePaymentDetailManager() {
  const route = useRoute();
  const router = useRouter();

  const selectedOrder = ref(null);
  const isLoading = ref(false);
  const confirmingOrderId = ref(null);
  const cancellingOrderId = ref(null);
  const revertingOrderId = ref(null);
  const startingShippingOrderId = ref(null);
  const completingDeliveryOrderId = ref(null);
  const completingOrderId = ref(null);

  const showSnackbar = ref(false);
  const snackbarMessage = ref("");
  const snackbarColor = ref("success");

  const uiOrderConfirmedIds = ref(new Set());
  const uiShippingStartedOrderIds = ref(new Set());
  const uiDeliveredOrderIds = ref(new Set());

  const revertReasonDialog = ref(false);
  const revertReason = ref("");
  const revertReasonError = ref(false);
  const revertTargetOrder = ref(null);
  const editHistoryDialog = ref(false);

  const timelineRevealCount = ref(0);
  const timelineTimer = ref(null);

  const orderEditHistoryMap = ref({});
  const orderTimelineMap = ref({});

  const returnItemDialog = ref(false);
  const returnTargetItem = ref(null);
  const returnQuantity = ref(1);
  const returnNote = ref("");
  const returnErrors = ref({
    quantity: "",
    note: "",
  });
  const returningOrderDetailId = ref(null);

  const goBack = () => {
    router.push({ name: "AdminPayments" });
  };

  const getRouteOrderId = () => String(route.params.id || "").trim();

  const normalizeOrderId = (orderId) => {
    const parsed = Number.parseInt(orderId, 10);
    return Number.isFinite(parsed) ? parsed : null;
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

  const persistIdSet = (key, setValue) => {
    localStorage.setItem(key, JSON.stringify(Array.from(setValue)));
  };

  const reloadIdSets = () => {
    uiOrderConfirmedIds.value = loadIdSet(UI_ORDER_CONFIRMED_IDS_KEY);
    uiShippingStartedOrderIds.value = loadIdSet(ONLINE_SHIPPING_STARTED_KEY);
    uiDeliveredOrderIds.value = loadIdSet(UI_DELIVERED_ORDER_IDS_KEY);
  };

  const loadMap = (key) => {
    try {
      const raw = localStorage.getItem(key);
      const parsed = JSON.parse(raw || "{}");

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return {};
      }

      return parsed;
    } catch {
      return {};
    }
  };

  const persistMap = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value || {}));
  };

  const isUiOrderConfirmed = (order) => {
    const orderId = normalizeOrderId(order?.orderId);
    if (!orderId) return false;
    return uiOrderConfirmedIds.value.has(orderId);
  };

  const markUiOrderConfirmed = (orderIdValue) => {
    const orderId = normalizeOrderId(orderIdValue);
    if (!orderId) return;

    const next = new Set(uiOrderConfirmedIds.value);
    next.add(orderId);
    uiOrderConfirmedIds.value = next;
    persistIdSet(UI_ORDER_CONFIRMED_IDS_KEY, next);
  };

  const clearUiOrderConfirmed = (orderIdValue) => {
    const orderId = normalizeOrderId(orderIdValue);
    if (!orderId) return;
    if (!uiOrderConfirmedIds.value.has(orderId)) return;

    const next = new Set(uiOrderConfirmedIds.value);
    next.delete(orderId);
    uiOrderConfirmedIds.value = next;
    persistIdSet(UI_ORDER_CONFIRMED_IDS_KEY, next);
  };

  const isUiShippingStartedOrder = (order) => {
    const orderId = normalizeOrderId(order?.orderId);
    if (!orderId) return false;
    return uiShippingStartedOrderIds.value.has(orderId);
  };

  const isUiDeliveredOrder = (order) => {
    const orderId = normalizeOrderId(order?.orderId);
    if (!orderId) return false;
    return uiDeliveredOrderIds.value.has(orderId);
  };

  const markUiDelivered = (orderIdValue) => {
    const orderId = normalizeOrderId(orderIdValue);
    if (!orderId) return;

    const next = new Set(uiDeliveredOrderIds.value);
    next.add(orderId);
    uiDeliveredOrderIds.value = next;
    persistIdSet(UI_DELIVERED_ORDER_IDS_KEY, next);
  };

  const clearUiDelivered = (orderIdValue) => {
    const orderId = normalizeOrderId(orderIdValue);
    if (!orderId) return;
    if (!uiDeliveredOrderIds.value.has(orderId)) return;

    const next = new Set(uiDeliveredOrderIds.value);
    next.delete(orderId);
    uiDeliveredOrderIds.value = next;
    persistIdSet(UI_DELIVERED_ORDER_IDS_KEY, next);
  };

  const markUiShippingStarted = (orderIdValue) => {
    const orderId = normalizeOrderId(orderIdValue);
    if (!orderId) return;

    const next = new Set(uiShippingStartedOrderIds.value);
    next.add(orderId);
    uiShippingStartedOrderIds.value = next;
    persistIdSet(ONLINE_SHIPPING_STARTED_KEY, next);
  };

  const clearUiShippingStarted = (orderIdValue) => {
    const orderId = normalizeOrderId(orderIdValue);
    if (!orderId) return;
    if (!uiShippingStartedOrderIds.value.has(orderId)) return;

    const next = new Set(uiShippingStartedOrderIds.value);
    next.delete(orderId);
    uiShippingStartedOrderIds.value = next;
    persistIdSet(ONLINE_SHIPPING_STARTED_KEY, next);
  };

  const getOrderVisualStage = (order) => {
    const orderStatus = String(order?.orderStatus || "").toUpperCase();
    const paymentStatus = String(order?.paymentStatus || "").toUpperCase();

    if (orderStatus === "CANCELLED" || paymentStatus === "CANCELLED") {
      return "CANCELLED";
    }

    if (orderStatus === "RETURNED") return "RETURNED";
    if (orderStatus === "PARTIAL_RETURNED") return "PARTIAL_RETURNED";

    if (isOfflineGuestOrder(order)) {
      if (orderStatus === "PAID" || paymentStatus === "PAID") {
        return "COMPLETED";
      }
      return "WAIT_CONFIRM";
    }

    if (orderStatus === "PAID") return "COMPLETED";

    if (orderStatus === "SHIPPING") {
      if (
        isCodPaymentMethod(order) &&
        isUiDeliveredOrder(order) &&
        paymentStatus === "UNPAID"
      ) {
        return "WAIT_PAYMENT_CONFIRM";
      }

      if (
        isCodPaymentMethod(order) &&
        isUiDeliveredOrder(order) &&
        paymentStatus === "PAID"
      ) {
        return "WAIT_COMPLETE";
      }

      if (isUiDeliveredOrder(order)) return "DELIVERED";
      if (isUiShippingStartedOrder(order)) return "IN_TRANSIT";
      return "WAIT_SHIP";
    }

    if (orderStatus === "PENDING_PAYMENT" || orderStatus === "PENDING") {
      if (isCodPaymentMethod(order) && isUiOrderConfirmed(order)) {
        return "WAIT_SHIP";
      }
      if (isOnlinePaymentMethod(order) && paymentStatus === "PAID") {
        return "WAIT_SHIP";
      }
      return "WAIT_CONFIRM";
    }

    return "UNKNOWN";
  };

  const getOrderStatusLabel = (order) => {
    const stage = getOrderVisualStage(order);

    if (stage === "WAIT_CONFIRM") return "Chờ xác nhận";
    if (stage === "WAIT_PAYMENT_CONFIRM") return "Chờ xác nhận thanh toán";
    if (stage === "WAIT_SHIP") return "Chờ giao hàng";
    if (stage === "IN_TRANSIT") return "Đang giao hàng";
    if (stage === "DELIVERED") return "Đã giao hàng";
    if (stage === "WAIT_COMPLETE") return "Đã xác nhận thanh toán";
    if (stage === "COMPLETED") return "Hoàn thành";
    if (stage === "CANCELLED") return "Đã hủy";
    if (stage === "PARTIAL_RETURNED") return "Trả hàng một phần";
    if (stage === "RETURNED") return "Trả hàng";

    return "Không xác định";
  };

  const getOrderStatusColor = (order) => {
    const stage = getOrderVisualStage(order);

    if (stage === "WAIT_CONFIRM") return "warning";
    if (stage === "WAIT_PAYMENT_CONFIRM") return "warning";
    if (stage === "WAIT_SHIP") return "success";
    if (stage === "WAIT_COMPLETE") return "success";
    if (stage === "IN_TRANSIT") return "primary";
    if (stage === "DELIVERED") return "warning";
    if (stage === "COMPLETED") return "success";
    if (stage === "CANCELLED") return "error";
    if (stage === "PARTIAL_RETURNED") return "orange";
    if (stage === "RETURNED") return "deep-orange";

    return "grey";
  };

  const getStartShippingButtonLabel = (order) => {
    const orderStatus = String(order?.orderStatus || "").toUpperCase();
    const paymentStatus = String(order?.paymentStatus || "").toUpperCase();

    if (
      isCodPaymentMethod(order) &&
      paymentStatus === "UNPAID" &&
      (orderStatus === "PENDING_PAYMENT" || orderStatus === "PENDING") &&
      !isUiOrderConfirmed(order)
    ) {
      return "Xác nhận đơn";
    }

    return "Bắt đầu giao hàng";
  };

  const createTimelineStep = (code, label, icon, time = null) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    code,
    label,
    icon,
    time: time || formatDate(new Date()),
    state: "done",
  });

  const getBaseStepByStage = (stage) => {
    const map = {
      CREATED: ["CREATED", "Tạo đơn hàng", "mdi-file-document-outline"],
      WAIT_CONFIRM: [
        "WAIT_CONFIRM",
        "Chờ xác nhận",
        "mdi-file-document-outline",
      ],
      CONFIRM_ORDER: [
        "CONFIRM_ORDER",
        "Xác nhận đơn",
        "mdi-check-circle-outline",
      ],
      TRANSFER_CONFIRM: [
        "TRANSFER_CONFIRM",
        "Xác nhận thanh toán",
        "mdi-bank-check",
      ],
      WAIT_SHIP: ["WAIT_SHIP", "Chờ giao hàng", "mdi-check-circle-outline"],
      IN_TRANSIT: ["SHIPPING", "Đang giao hàng", "mdi-truck-delivery-outline"],
      DELIVERED: ["DELIVERED", "Đã giao hàng", "mdi-truck-check-outline"],
      COMPLETED: ["COMPLETED", "Hoàn thành", "mdi-check-decagram-outline"],

      PARTIAL_RETURNED: [
        "PARTIAL_RETURNED",
        "Trả hàng một phần",
        "mdi-keyboard-return",
      ],

      RETURNED: ["RETURNED", "Trả hàng", "mdi-keyboard-return"],

      CANCELLED: ["CANCELLED", "Đã hủy", "mdi-close-octagon-outline"],
    };

    return map[stage] || map.WAIT_CONFIRM;
  };

  const normalizeTimelineStates = (list = []) => {
    return list.map((item, index) => {
      const isLast = index === list.length - 1;
      const isCancelled = item.code === "CANCELLED";

      return {
        ...item,
        state: isCancelled ? "cancelled" : isLast ? "current" : "done",
      };
    });
  };

  const persistTimelineMap = () => {
    persistMap(ORDER_TIMELINE_KEY, orderTimelineMap.value);
  };

  const getTimelineForOrder = (order) => {
    const orderId = normalizeOrderId(order?.orderId);
    if (!orderId) return [];

    const list = orderTimelineMap.value?.[orderId];
    return Array.isArray(list) ? normalizeTimelineStates(list) : [];
  };

  const appendTimelineStep = (order, stage, customTime = null) => {
  const orderId = normalizeOrderId(order?.orderId);
  if (!orderId) return;

  const [code, label, icon] = getBaseStepByStage(stage);

  const historyMap = { ...orderTimelineMap.value };
  const currentList = Array.isArray(historyMap[orderId])
    ? [...historyMap[orderId]]
    : [];

  const newStep = createTimelineStep(code, label, icon, customTime);

  historyMap[orderId] = [...currentList, newStep];
  orderTimelineMap.value = historyMap;
  persistTimelineMap();
};
const syncReturnStepFromBackend = (order) => {
  const orderId = normalizeOrderId(order?.orderId);
  if (!orderId) return;

  const stage = getOrderVisualStage(order);

  if (!["PARTIAL_RETURNED", "RETURNED"].includes(stage)) return;

  const historyMap = { ...orderTimelineMap.value };
  const currentList = Array.isArray(historyMap[orderId])
    ? [...historyMap[orderId]]
    : [];

  const existed = currentList.some((step) =>
    ["PARTIAL_RETURNED", "RETURNED"].includes(
      String(step?.code || "").toUpperCase()
    )
  );

  if (existed) return;

  const [code, label, icon] = getBaseStepByStage(stage);

  const newStep = createTimelineStep(
    code,
    label,
    icon,
    formatDate(new Date())
  );

  historyMap[orderId] = [...currentList, newStep];
  orderTimelineMap.value = historyMap;
  persistTimelineMap();
};

  const appendManyTimelineSteps = (order, stages = []) => {
    stages.forEach((stage) => appendTimelineStep(order, stage));
  };

  const seedTimelineIfMissing = (order) => {
    const orderId = normalizeOrderId(order?.orderId);
    if (!orderId) return;

    const existed =
      Array.isArray(orderTimelineMap.value?.[orderId]) &&
      orderTimelineMap.value[orderId].length > 0;
    if (existed) return;

    const createdTime = formatDate(order?.orderDate);
    const historyMap = { ...orderTimelineMap.value };

    const initialSteps = [
      createTimelineStep(
        "CREATED",
        "Tạo đơn hàng",
        "mdi-file-document-outline",
        createdTime,
      ),
      createTimelineStep(
        "WAIT_CONFIRM",
        "Chờ xác nhận",
        "mdi-file-document-outline",
        createdTime,
      ),
    ];

    historyMap[orderId] = initialSteps;
    orderTimelineMap.value = historyMap;
    persistTimelineMap();

    const stage = getOrderVisualStage(order);

    if (stage === "WAIT_SHIP") {
      if (isOnlinePaymentMethod(order)) {
        appendManyTimelineSteps(order, [
          "TRANSFER_CONFIRM",
          "CONFIRM_ORDER",
          "WAIT_SHIP",
        ]);
      } else {
        appendManyTimelineSteps(order, ["CONFIRM_ORDER", "WAIT_SHIP"]);
      }
    }

    if (stage === "IN_TRANSIT") {
      if (isOnlinePaymentMethod(order)) {
        appendManyTimelineSteps(order, [
          "TRANSFER_CONFIRM",
          "CONFIRM_ORDER",
          "WAIT_SHIP",
          "IN_TRANSIT",
        ]);
      } else {
        appendManyTimelineSteps(order, [
          "CONFIRM_ORDER",
          "WAIT_SHIP",
          "IN_TRANSIT",
        ]);
      }
    }

    if (stage === "DELIVERED") {
      appendManyTimelineSteps(order, [
        "CONFIRM_ORDER",
        "WAIT_SHIP",
        "IN_TRANSIT",
        "DELIVERED",
      ]);
    }

    if (stage === "WAIT_PAYMENT_CONFIRM") {
      appendManyTimelineSteps(order, [
        "CONFIRM_ORDER",
        "WAIT_SHIP",
        "IN_TRANSIT",
        "DELIVERED",
      ]);
    }

    if (stage === "WAIT_COMPLETE") {
      appendManyTimelineSteps(order, [
        "CONFIRM_ORDER",
        "WAIT_SHIP",
        "IN_TRANSIT",
        "DELIVERED",
        "TRANSFER_CONFIRM",
      ]);
    }

    if (stage === "COMPLETED") {
      if (isOfflineGuestOrder(order)) {
        appendManyTimelineSteps(order, ["TRANSFER_CONFIRM", "COMPLETED"]);
      } else if (isOnlinePaymentMethod(order)) {
        appendManyTimelineSteps(order, [
          "TRANSFER_CONFIRM",
          "CONFIRM_ORDER",
          "WAIT_SHIP",
          "IN_TRANSIT",
          "DELIVERED",
          "COMPLETED",
        ]);
      } else {
        appendManyTimelineSteps(order, [
          "CONFIRM_ORDER",
          "WAIT_SHIP",
          "IN_TRANSIT",
          "DELIVERED",
          "TRANSFER_CONFIRM",
          "COMPLETED",
        ]);
      }
    }

    if (stage === "CANCELLED") {
      appendTimelineStep(order, "CANCELLED");
    }
  };

  const orderTimelineSteps = computed(() => {
    return getTimelineForOrder(selectedOrder.value);
  });

  const connectorClass = (nextStep) => {
    if (!nextStep) return "track-connector--pending";
    if (nextStep.state === "done") return "track-connector--done";
    if (nextStep.state === "cancelled") return "track-connector--cancelled";
    if (nextStep.state === "current") return "track-connector--current";
    return "track-connector--pending";
  };

  const trackWidthStyle = (steps) => {
    const count = Math.max((steps || []).length, 1);
    return { minWidth: `${count * 190}px` };
  };

  const isStepVisible = (index) => index < timelineRevealCount.value;

  const connectorDelayStyle = (index) => ({
    transitionDelay: `${index * 0.18}s`,
  });

  const clearTimelineTimer = () => {
    if (timelineTimer.value) {
      clearInterval(timelineTimer.value);
      timelineTimer.value = null;
    }
  };

  const startTimelineReveal = () => {
    clearTimelineTimer();
    timelineRevealCount.value = 0;

    if (!orderTimelineSteps.value.length) return;

    timelineTimer.value = setInterval(() => {
      timelineRevealCount.value += 1;

      if (timelineRevealCount.value >= orderTimelineSteps.value.length) {
        clearTimelineTimer();
      }
    }, 180);
  };

  const formatHistoryReason = (
    reason,
    fallbackReason = "Cập nhật bởi quản trị viên",
  ) => {
    const normalized = String(reason || "").trim();
    return normalized || fallbackReason;
  };

  const getOrderTransitionLabel = (orderStatus, paymentStatus) => {
    return `${getOrderStatusLabel({ orderStatus, paymentStatus })} / ${getPaymentStatusLabel(paymentStatus)}`;
  };

  const appendOrderEditHistory = ({
    order,
    action,
    reason,
    fromOrderStatus,
    fromPaymentStatus,
    toOrderStatus,
    toPaymentStatus,
  }) => {
    const orderId = normalizeOrderId(order?.orderId);
    if (!orderId) return;

    const safeAction = String(action || "").trim() || "Cập nhật đơn hàng";
    const safeReason = formatHistoryReason(reason);
    const historyMap = { ...orderEditHistoryMap.value };
    const currentEntries = Array.isArray(historyMap[orderId])
      ? [...historyMap[orderId]]
      : [];

    const hasTransition =
      String(fromOrderStatus || "").trim() ||
      String(fromPaymentStatus || "").trim() ||
      String(toOrderStatus || "").trim() ||
      String(toPaymentStatus || "").trim();

    const transition = hasTransition
      ? `${getOrderTransitionLabel(fromOrderStatus, fromPaymentStatus)} -> ${getOrderTransitionLabel(toOrderStatus, toPaymentStatus)}`
      : "";

    const nextEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      action: safeAction,
      reason: safeReason,
      transition,
      createdAt: new Date().toISOString(),
    };

    historyMap[orderId] = [nextEntry, ...currentEntries].slice(0, 50);
    orderEditHistoryMap.value = historyMap;
    persistMap(ORDER_EDIT_HISTORY_KEY, historyMap);
  };

  const selectedOrderEditHistory = computed(() => {
    const orderId = normalizeOrderId(selectedOrder.value?.orderId);
    if (!orderId) return [];

    const list = orderEditHistoryMap.value?.[orderId];
    return Array.isArray(list) ? list : [];
  });

  const canConfirmOrder = (order) => {
    const paymentStatus = String(order?.paymentStatus || "").toUpperCase();
    const orderStatus = String(order?.orderStatus || "").toUpperCase();

    if (paymentStatus !== "UNPAID") return false;

    if (isOfflineGuestOrder(order)) {
      return orderStatus === "PENDING_PAYMENT" || orderStatus === "PENDING";
    }

    if (isOnlineOrder(order)) {
      if (isOnlinePaymentMethod(order)) {
        return orderStatus === "PENDING_PAYMENT";
      }

      if (isCodPaymentMethod(order)) {
        return isUiDeliveredOrder(order);
      }
    }

    return false;
  };

  const canCancelOrder = (order) => {
    const paymentStatus = String(order?.paymentStatus || "").toUpperCase();
    const orderStatus = String(order?.orderStatus || "").toUpperCase();

    return (
      paymentStatus === "UNPAID" &&
      (orderStatus === "PENDING_PAYMENT" || orderStatus === "PENDING")
    );
  };

  const canRevertOrder = (order) => {
    if (!order) return false;

    const stage = getOrderVisualStage(order);

    if (stage === "COMPLETED") return false;
    if (stage === "WAIT_CONFIRM") return false;

    return [
      "WAIT_SHIP",
      "IN_TRANSIT",
      "DELIVERED",
      "WAIT_PAYMENT_CONFIRM",
      "WAIT_COMPLETE",
      "CANCELLED",
    ].includes(stage);
  };

  const canStartShipping = (order) => {
    if (!order || !isOnlineOrder(order)) return false;

    const orderStatus = String(order?.orderStatus || "").toUpperCase();
    const paymentStatus = String(order?.paymentStatus || "").toUpperCase();

    if (paymentStatus === "CANCELLED") return false;
    if (isUiShippingStartedOrder(order)) return false;

    if (isOnlinePaymentMethod(order)) {
      return paymentStatus === "PAID" && orderStatus === "SHIPPING";
    }

    if (isCodPaymentMethod(order)) {
      return (
        paymentStatus === "UNPAID" &&
        (orderStatus === "PENDING_PAYMENT" || orderStatus === "PENDING")
      );
    }

    return false;
  };

  const canCompleteDelivery = (order) => {
    if (!order || !isOnlineOrder(order)) return false;

    const paymentStatus = String(order?.paymentStatus || "").toUpperCase();
    const stage = getOrderVisualStage(order);

    if (paymentStatus === "CANCELLED") return false;
    if (isUiDeliveredOrder(order)) return false;

    return stage === "IN_TRANSIT";
  };

  const canCompleteOrder = (order) => {
    if (!order || !isOnlineOrder(order)) return false;

    const orderStatus = String(order?.orderStatus || "").toUpperCase();
    const paymentStatus = String(order?.paymentStatus || "").toUpperCase();

    if (orderStatus !== "SHIPPING") return false;
    if (paymentStatus !== "PAID") return false;
    if (!isUiDeliveredOrder(order)) return false;

    return true;
  };

  const applyOrderPatch = (order, patch) => {
    if (!order?.orderId) return;

    selectedOrder.value = {
      ...selectedOrder.value,
      ...patch,
    };

    Object.assign(order, patch);

    startTimelineReveal();
  };

  const loadOrderDetail = async () => {
    isLoading.value = true;
    selectedOrder.value = null;
    reloadIdSets();
    orderEditHistoryMap.value = loadMap(ORDER_EDIT_HISTORY_KEY);
    orderTimelineMap.value = loadMap(ORDER_TIMELINE_KEY);

    try {
      const token = localStorage.getItem("token");
      const res = await paymentApi.getAllOrders(token);
      const list = Array.isArray(res.data) ? res.data : [];
      const routeOrderId = getRouteOrderId();

      const found = list.find(
        (order) => String(order?.orderId) === routeOrderId,
      );

      if (!found) {
        snackbarMessage.value = "Không tìm thấy đơn hàng";
        snackbarColor.value = "warning";
        showSnackbar.value = true;
        return;
      }

      selectedOrder.value = { ...found };
      seedTimelineIfMissing(selectedOrder.value);
      syncReturnStepFromBackend(selectedOrder.value);
      startTimelineReveal();
    } catch (error) {
      console.error("Lỗi tải chi tiết đơn hàng:", error);
      snackbarMessage.value = "Không tải được chi tiết đơn hàng";
      snackbarColor.value = "error";
      showSnackbar.value = true;
    } finally {
      isLoading.value = false;
    }
  };

  const confirmPayment = async (order) => {
    if (!canConfirmOrder(order)) return;

    const fromOrderStatus = order?.orderStatus;
    const fromPaymentStatus = order?.paymentStatus;
    confirmingOrderId.value = order.orderId;

    try {
      const token = localStorage.getItem("token");
      await paymentApi.confirmPayment(order.orderId, token);

      if (isOfflineGuestOrder(order)) {
        applyOrderPatch(order, {
          paymentStatus: "PAID",
          orderStatus: "PAID",
        });

        appendManyTimelineSteps(order, ["TRANSFER_CONFIRM", "COMPLETED"]);

        appendOrderEditHistory({
          order,
          action: "Xác nhận thanh toán",
          reason: "Nhân viên xác nhận đã nhận tiền cho đơn offline",
          fromOrderStatus,
          fromPaymentStatus,
          toOrderStatus: "PAID",
          toPaymentStatus: "PAID",
        });
      } else if (isCodPaymentMethod(order)) {
        applyOrderPatch(order, {
          paymentStatus: "PAID",
          orderStatus: order?.orderStatus || "SHIPPING",
        });

        appendTimelineStep(order, "TRANSFER_CONFIRM");

        appendOrderEditHistory({
          order,
          action: "Xác nhận thanh toán",
          reason: "Nhân viên xác nhận đã nhận tiền COD",
          fromOrderStatus,
          fromPaymentStatus,
          toOrderStatus: order?.orderStatus || "SHIPPING",
          toPaymentStatus: "PAID",
        });
      } else {
        applyOrderPatch(order, {
          paymentStatus: "PAID",
          orderStatus: "SHIPPING",
        });

        clearUiShippingStarted(order.orderId);
        appendManyTimelineSteps(order, [
          "TRANSFER_CONFIRM",
          "CONFIRM_ORDER",
          "WAIT_SHIP",
        ]);

        appendOrderEditHistory({
          order,
          action: "Xác nhận thanh toán",
          reason: "Nhân viên xác nhận giao dịch thanh toán thành công",
          fromOrderStatus,
          fromPaymentStatus,
          toOrderStatus: "SHIPPING",
          toPaymentStatus: "PAID",
        });
      }

      startTimelineReveal();
      snackbarMessage.value = `Đã xác nhận thanh toán đơn ${getDisplayOrderCode(order)}`;
      snackbarColor.value = "success";
      showSnackbar.value = true;
    } catch (error) {
      console.error("Lỗi xác nhận thanh toán:", error);
      snackbarMessage.value = "Xác nhận thanh toán thất bại";
      snackbarColor.value = "error";
      showSnackbar.value = true;
    } finally {
      confirmingOrderId.value = null;
    }
  };

  const cancelOrder = async (order) => {
    if (!canCancelOrder(order)) return;

    const confirmed = window.confirm(
      `Bạn có chắc muốn hủy đơn ${getDisplayOrderCode(order)}?`,
    );
    if (!confirmed) return;

    const fromOrderStatus = order?.orderStatus;
    const fromPaymentStatus = order?.paymentStatus;
    cancellingOrderId.value = order.orderId;

    try {
      const token = localStorage.getItem("token");
      await paymentApi.cancelOrderByAdmin(order.orderId, token);

      applyOrderPatch(order, {
        paymentStatus: "CANCELLED",
        orderStatus: "CANCELLED",
      });

      clearUiOrderConfirmed(order.orderId);
      clearUiDelivered(order.orderId);
      clearUiShippingStarted(order.orderId);

      appendTimelineStep(order, "CANCELLED");

      appendOrderEditHistory({
        order,
        action: "Hủy đơn hàng",
        reason: "Nhân viên hủy đơn trong quá trình xử lý",
        fromOrderStatus,
        fromPaymentStatus,
        toOrderStatus: "CANCELLED",
        toPaymentStatus: "CANCELLED",
      });

      startTimelineReveal();
      snackbarMessage.value = `Đã hủy đơn ${getDisplayOrderCode(order)}`;
      snackbarColor.value = "success";
      showSnackbar.value = true;
    } catch (error) {
      console.error("Lỗi hủy đơn hàng:", error);
      snackbarMessage.value = "Hủy đơn thất bại";
      snackbarColor.value = "error";
      showSnackbar.value = true;
    } finally {
      cancellingOrderId.value = null;
    }
  };

  const openRevertReasonDialog = (order) => {
    if (!canRevertOrder(order)) return;
    revertTargetOrder.value = order;
    revertReason.value = "";
    revertReasonError.value = false;
    revertReasonDialog.value = true;
  };

  const closeRevertReasonDialog = () => {
    revertReasonDialog.value = false;
    revertReason.value = "";
    revertReasonError.value = false;
    revertTargetOrder.value = null;
  };

  const appendCurrentStageAfterRevert = (order) => {
    const stage = getOrderVisualStage(order);

    if (stage === "WAIT_CONFIRM") appendTimelineStep(order, "WAIT_CONFIRM");
    else if (stage === "WAIT_SHIP") appendTimelineStep(order, "WAIT_SHIP");
    else if (stage === "IN_TRANSIT") appendTimelineStep(order, "IN_TRANSIT");
    else if (stage === "DELIVERED") appendTimelineStep(order, "DELIVERED");
    else if (stage === "WAIT_PAYMENT_CONFIRM")
      appendTimelineStep(order, "DELIVERED");
    else if (stage === "WAIT_COMPLETE")
      appendTimelineStep(order, "TRANSFER_CONFIRM");
    else if (stage === "CANCELLED") appendTimelineStep(order, "CANCELLED");
    else appendTimelineStep(order, "WAIT_CONFIRM");
  };

  const revertOrderStatus = async (order, reason) => {
    if (!canRevertOrder(order)) return;

    const normalizedReason = String(reason || "").trim();
    if (!normalizedReason) {
      throw new Error("Vui lòng nhập lý do");
    }

    const previousStage = getOrderVisualStage(order);
    const fromOrderStatus = order?.orderStatus;
    const fromPaymentStatus = order?.paymentStatus;
    const orderStatus = String(order?.orderStatus || "").toUpperCase();

    if (
      previousStage === "WAIT_SHIP" &&
      isCodPaymentMethod(order) &&
      isUiOrderConfirmed(order) &&
      (orderStatus === "PENDING_PAYMENT" || orderStatus === "PENDING")
    ) {
      clearUiOrderConfirmed(order.orderId);
      selectedOrder.value = { ...selectedOrder.value };

      appendTimelineStep(order, "WAIT_CONFIRM");

      appendOrderEditHistory({
        order,
        action: "Quay lại trạng thái trước",
        reason: normalizedReason,
        fromOrderStatus,
        fromPaymentStatus,
        toOrderStatus: order?.orderStatus,
        toPaymentStatus: order?.paymentStatus,
      });

      startTimelineReveal();
      snackbarMessage.value = `Đơn ${getDisplayOrderCode(order)} đã quay lại bước Chờ xác nhận`;
      snackbarColor.value = "success";
      showSnackbar.value = true;
      return;
    }

    if (previousStage === "WAIT_PAYMENT_CONFIRM") {
      clearUiDelivered(order.orderId);
      markUiShippingStarted(order.orderId);

      selectedOrder.value = { ...selectedOrder.value };
      appendTimelineStep(order, "IN_TRANSIT");

      appendOrderEditHistory({
        order,
        action: "Quay lại trạng thái trước",
        reason: normalizedReason,
        fromOrderStatus,
        fromPaymentStatus,
        toOrderStatus: order?.orderStatus,
        toPaymentStatus: order?.paymentStatus,
      });

      startTimelineReveal();
      snackbarMessage.value = `Đơn ${getDisplayOrderCode(order)} đã quay lại bước Đang giao hàng`;
      snackbarColor.value = "success";
      showSnackbar.value = true;
      return;
    }

    revertingOrderId.value = order.orderId;

    try {
      const token = localStorage.getItem("token");
      const response = await paymentApi.revertOrderStatusByAdmin(
        order.orderId,
        normalizedReason,
        token,
      );

      const responseOrderStatus = String(
        response?.data?.orderStatus ||
          response?.data?.status ||
          order?.orderStatus ||
          "",
      ).toUpperCase();

      const responsePaymentStatus = String(
        response?.data?.paymentStatus || order?.paymentStatus || "",
      ).toUpperCase();

      applyOrderPatch(order, {
        paymentStatus: responsePaymentStatus || "UNPAID",
        orderStatus: responseOrderStatus || "PENDING_PAYMENT",
      });

      if (isOnlineOrder(order)) {
        if (
          responseOrderStatus === "PENDING" ||
          responseOrderStatus === "PENDING_PAYMENT"
        ) {
          clearUiOrderConfirmed(order.orderId);
          clearUiDelivered(order.orderId);
          clearUiShippingStarted(order.orderId);
        } else if (responseOrderStatus === "SHIPPING") {
          if (previousStage === "WAIT_COMPLETE") {
            markUiDelivered(order.orderId);
            markUiShippingStarted(order.orderId);
          } else if (previousStage === "DELIVERED") {
            clearUiDelivered(order.orderId);
            markUiShippingStarted(order.orderId);
          } else if (previousStage === "IN_TRANSIT") {
            clearUiDelivered(order.orderId);
            clearUiShippingStarted(order.orderId);
          }
        }
      }

      selectedOrder.value = { ...selectedOrder.value };
      appendCurrentStageAfterRevert(order);

      appendOrderEditHistory({
        order,
        action: "Quay lại trạng thái trước",
        reason: normalizedReason,
        fromOrderStatus,
        fromPaymentStatus,
        toOrderStatus: responseOrderStatus || "PENDING_PAYMENT",
        toPaymentStatus: responsePaymentStatus || "UNPAID",
      });

      startTimelineReveal();
      snackbarMessage.value = `Đã quay lại trạng thái trước cho đơn ${getDisplayOrderCode(order)}`;
      snackbarColor.value = "success";
      showSnackbar.value = true;
    } catch (error) {
      console.error("Lỗi quay lại trạng thái đơn hàng:", error);
      snackbarMessage.value =
        error?.response?.data?.message || "Quay lại trạng thái thất bại";
      snackbarColor.value = "error";
      showSnackbar.value = true;
      throw error;
    } finally {
      revertingOrderId.value = null;
    }
  };

  const submitRevertOrder = async () => {
    const order = revertTargetOrder.value;
    if (!order) return;

    const reason = String(revertReason.value || "").trim();
    if (!reason) {
      revertReasonError.value = true;
      return;
    }

    revertReasonError.value = false;

    try {
      await revertOrderStatus(order, reason);
      closeRevertReasonDialog();
    } catch (error) {
      snackbarMessage.value =
        error?.response?.data?.message ||
        error?.message ||
        "Quay lại trạng thái thất bại";
      snackbarColor.value = "error";
      showSnackbar.value = true;
    }
  };

  const startShipping = async (order) => {
    if (!canStartShipping(order)) return;

    const orderStatus = String(order?.orderStatus || "").toUpperCase();
    const paymentStatus = String(order?.paymentStatus || "").toUpperCase();
    const fromOrderStatus = order?.orderStatus;
    const fromPaymentStatus = order?.paymentStatus;

    if (
      isCodPaymentMethod(order) &&
      paymentStatus === "UNPAID" &&
      (orderStatus === "PENDING_PAYMENT" || orderStatus === "PENDING") &&
      !isUiOrderConfirmed(order)
    ) {
      markUiOrderConfirmed(order.orderId);
      selectedOrder.value = { ...selectedOrder.value };

      appendManyTimelineSteps(order, ["CONFIRM_ORDER", "WAIT_SHIP"]);

      appendOrderEditHistory({
        order,
        action: "Xác nhận đơn",
        reason: "Nhân viên xác nhận đơn COD và chuyển sang chờ giao hàng",
        fromOrderStatus,
        fromPaymentStatus,
        toOrderStatus: order?.orderStatus,
        toPaymentStatus: order?.paymentStatus,
      });

      startTimelineReveal();
      snackbarMessage.value = `Đã xác nhận đơn ${getDisplayOrderCode(order)}`;
      snackbarColor.value = "success";
      showSnackbar.value = true;
      return;
    }

    const confirmed = window.confirm(
      `Bắt đầu giao hàng cho đơn ${getDisplayOrderCode(order)}?`,
    );
    if (!confirmed) return;

    startingShippingOrderId.value = order.orderId;

    try {
      const token = localStorage.getItem("token");
      await paymentApi.startShippingByAdmin(order.orderId, token);

      applyOrderPatch(order, {
        orderStatus: "SHIPPING",
      });

      markUiShippingStarted(order.orderId);
      clearUiDelivered(order.orderId);

      appendTimelineStep(order, "IN_TRANSIT");

      appendOrderEditHistory({
        order,
        action: "Bắt đầu giao hàng",
        reason: "Nhân viên xác nhận bàn giao đơn cho đơn vị vận chuyển",
        fromOrderStatus,
        fromPaymentStatus,
        toOrderStatus: "SHIPPING",
        toPaymentStatus: order?.paymentStatus,
      });

      startTimelineReveal();
      snackbarMessage.value = `Đơn ${getDisplayOrderCode(order)} đã chuyển sang Đang vận chuyển`;
      snackbarColor.value = "success";
      showSnackbar.value = true;
    } catch (error) {
      console.error("Lỗi bắt đầu giao hàng:", error);
      snackbarMessage.value =
        error?.response?.data?.message || "Không thể bắt đầu giao hàng";
      snackbarColor.value = "error";
      showSnackbar.value = true;
    } finally {
      startingShippingOrderId.value = null;
    }
  };

  const completeDelivery = async (order) => {
    if (!canCompleteDelivery(order)) return;

    const confirmed = window.confirm(
      `Xác nhận đã giao hàng đơn ${getDisplayOrderCode(order)}?`,
    );
    if (!confirmed) return;

    const fromOrderStatus = order?.orderStatus;
    const fromPaymentStatus = order?.paymentStatus;
    completingDeliveryOrderId.value = order.orderId;

    try {
      markUiDelivered(order.orderId);
      selectedOrder.value = { ...selectedOrder.value };

      appendTimelineStep(order, "DELIVERED");

      appendOrderEditHistory({
        order,
        action: "Xác nhận đã giao hàng",
        reason: "Nhân viên xác nhận đơn đã giao thành công",
        fromOrderStatus,
        fromPaymentStatus,
        toOrderStatus: order?.orderStatus,
        toPaymentStatus: order?.paymentStatus,
      });

      startTimelineReveal();
      snackbarMessage.value = `Đơn ${getDisplayOrderCode(order)} đã giao hàng`;
      snackbarColor.value = "success";
      showSnackbar.value = true;
    } catch (error) {
      console.error("Lỗi hoàn tất giao hàng:", error);
      snackbarMessage.value =
        error?.response?.data?.message || "Không thể hoàn tất giao hàng";
      snackbarColor.value = "error";
      showSnackbar.value = true;
    } finally {
      completingDeliveryOrderId.value = null;
    }
  };

  const completeOrder = async (order) => {
    if (!canCompleteOrder(order)) return;

    const confirmed = window.confirm(
      `Xác nhận hoàn thành đơn ${getDisplayOrderCode(order)}?`,
    );
    if (!confirmed) return;

    const fromOrderStatus = order?.orderStatus;
    const fromPaymentStatus = order?.paymentStatus;
    completingOrderId.value = order.orderId;

    try {
      const token = localStorage.getItem("token");
      await paymentApi.completeDeliveryByAdmin(order.orderId, token);

      applyOrderPatch(order, {
        orderStatus: "PAID",
        paymentStatus: "PAID",
      });

      appendTimelineStep(order, "COMPLETED");

      appendOrderEditHistory({
        order,
        action: "Hoàn thành đơn hàng",
        reason: "Nhân viên chốt hoàn tất đơn hàng",
        fromOrderStatus,
        fromPaymentStatus,
        toOrderStatus: "PAID",
        toPaymentStatus: "PAID",
      });

      clearUiOrderConfirmed(order.orderId);
      clearUiDelivered(order.orderId);
      clearUiShippingStarted(order.orderId);

      startTimelineReveal();
      snackbarMessage.value = `Đơn ${getDisplayOrderCode(order)} đã hoàn thành`;
      snackbarColor.value = "success";
      showSnackbar.value = true;
    } catch (error) {
      console.error("Lỗi hoàn thành đơn hàng:", error);
      snackbarMessage.value =
        error?.response?.data?.message || "Không thể hoàn thành đơn hàng";
      snackbarColor.value = "error";
      showSnackbar.value = true;
    } finally {
      completingOrderId.value = null;
    }
  };

  const getOrderItems = (order) => {
    const candidates = [
      order?.items,
      order?.orderItems,
      order?.orderDetails,
      order?.details,
      order?.orderDetailList,
    ];

    const found = candidates.find((value) => Array.isArray(value));
    return found || [];
  };

  const getItemName = (item) => {
    return (
      item?.productName ||
      item?.name ||
      item?.productColorName ||
      item?.product?.productName ||
      item?.productColor?.productName ||
      "Sản phẩm"
    );
  };

  const getItemColor = (item) => {
    return (
      item?.colorName ||
      item?.color ||
      item?.productColor?.colorName ||
      item?.productColor?.colorID?.colorName ||
      ""
    );
  };

  const getItemSize = (item) => {
    return (
      item?.sizeName ||
      item?.size ||
      item?.productColor?.sizeName ||
      item?.productColor?.sizeID?.sizeName ||
      ""
    );
  };

  const getItemQuantity = (item) => {
    return Number(item?.quantity || item?.qty || 0);
  };

  const getItemPrice = (item) => {
    return Number(item?.price || item?.unitPrice || item?.salePrice || 0);
  };

  const getItemTotal = (item) => {
    const explicitTotal = Number(
      item?.total || item?.totalAmount || item?.lineTotal || 0,
    );
    if (explicitTotal > 0) return explicitTotal;

    return getItemQuantity(item) * getItemPrice(item);
  };

  const canPrintShippingInvoice = (order) => {
    if (!order) return false;

    const stage = getOrderVisualStage(order);

    return isOnlineOrder(order) && stage === "WAIT_SHIP";
  };

  const canPrintCompletedInvoice = (order) => {
    if (!order) return false;

    const stage = getOrderVisualStage(order);

    return stage === "COMPLETED";
  };

  const buildInvoiceRows = (order) => {
    const items = getOrderItems(order);

    if (!items.length) {
      return `
        <tr>
          <td colspan="5" class="empty-row">Không có chi tiết sản phẩm</td>
        </tr>
      `;
    }

    return items
      .map((item, index) => {
        const color = getItemColor(item);
        const size = getItemSize(item);
        const variantText = [color, size].filter(Boolean).join(" / ");

        return `
          <tr>
            <td class="center">${index + 1}</td>
            <td>
              <div class="product-name">${getItemName(item)}</div>
              ${variantText ? `<div class="variant">${variantText}</div>` : ""}
            </td>
            <td class="center">${getItemQuantity(item)}</td>
            <td class="right">${formatPrice(getItemPrice(item))}đ</td>
            <td class="right">${formatPrice(getItemTotal(item))}đ</td>
          </tr>
        `;
      })
      .join("");
  };

  const buildInvoiceHtml = (order, type = "shipping") => {
    const isCompletedInvoice = type === "completed";
    const title = isCompletedInvoice ? "HÓA ĐƠN BÁN HÀNG" : "HÓA ĐƠN GIAO HÀNG";
    const paymentText = getPaymentStatusLabel(order?.paymentStatus);
    const orderText = getOrderStatusLabel(order);

    return `
      <!DOCTYPE html>
      <html lang="vi">
        <head>
          <meta charset="UTF-8" />
          <title>${title}</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              color: #111;
              margin: 0;
              padding: 24px;
              background: #fff;
            }

            .invoice {
              max-width: 820px;
              margin: 0 auto;
            }

            .header {
              display: flex;
              justify-content: space-between;
              gap: 16px;
              border-bottom: 2px solid #111;
              padding-bottom: 16px;
              margin-bottom: 18px;
            }

            .shop-name {
              font-size: 22px;
              font-weight: 800;
              margin-bottom: 4px;
            }

            .title {
              text-align: right;
              font-size: 22px;
              font-weight: 800;
            }

            .code {
              text-align: right;
              margin-top: 6px;
              font-size: 13px;
            }

            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px 28px;
              margin-bottom: 18px;
              font-size: 14px;
            }

            .info-row {
              display: flex;
              justify-content: space-between;
              gap: 12px;
              border-bottom: 1px dashed #ddd;
              padding: 6px 0;
            }

            .label {
              color: #555;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
              font-size: 14px;
            }

            th,
            td {
              border: 1px solid #ddd;
              padding: 10px;
              vertical-align: top;
            }

            th {
              background: #f3f4f6;
              font-weight: 700;
            }

            .center {
              text-align: center;
            }

            .right {
              text-align: right;
            }

            .product-name {
              font-weight: 700;
            }

            .variant {
              margin-top: 3px;
              font-size: 12px;
              color: #666;
            }

            .empty-row {
              text-align: center;
              color: #777;
              padding: 18px;
            }

            .total-box {
              margin-top: 16px;
              display: flex;
              justify-content: flex-end;
            }

            .total-line {
              min-width: 280px;
              display: flex;
              justify-content: space-between;
              font-size: 18px;
              font-weight: 800;
              border-top: 2px solid #111;
              padding-top: 10px;
            }

            .note {
              margin-top: 18px;
              font-size: 13px;
              color: #555;
            }

            .signatures {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 80px;
              margin-top: 44px;
              text-align: center;
              font-size: 14px;
            }

            .sign-title {
              font-weight: 700;
              margin-bottom: 64px;
            }

            @media print {
              body {
                padding: 0;
              }

              .invoice {
                max-width: none;
              }
            }
          </style>
        </head>

        <body>
          <div class="invoice">
            <div class="header">
              <div>
                <div class="shop-name">BASEBALL CAP SALES</div>
                <div>Địa chỉ: ${order?.shippingAddress || "-"}</div>
                <div>Khách hàng: ${getDisplayCustomer(order)}</div>
                <div>SĐT: ${order?.customerPhone || "-"}</div>
              </div>

              <div>
                <div class="title">${title}</div>
                <div class="code">Mã đơn: ${getDisplayOrderCode(order)}</div>
                <div class="code">Ngày in: ${formatDate(new Date())}</div>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-row">
                <span class="label">Loại đơn</span>
                <strong>${getOrderTypeLabel(order)}</strong>
              </div>

              <div class="info-row">
                <span class="label">Ngày tạo</span>
                <strong>${formatDate(order?.orderDate)}</strong>
              </div>

              <div class="info-row">
                <span class="label">Trạng thái đơn</span>
                <strong>${orderText}</strong>
              </div>

              <div class="info-row">
                <span class="label">Thanh toán</span>
                <strong>${paymentText}</strong>
              </div>

              <div class="info-row">
                <span class="label">Phương thức</span>
                <strong>${order?.paymentMethod || "-"}</strong>
              </div>

              <div class="info-row">
                <span class="label">Mã giảm giá</span>
                <strong>${order?.couponCode || "-"}</strong>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 54px;">STT</th>
                  <th>Sản phẩm</th>
                  <th style="width: 90px;">SL</th>
                  <th style="width: 140px;">Đơn giá</th>
                  <th style="width: 150px;">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${buildInvoiceRows(order)}
              </tbody>
            </table>

            <div class="total-box">
              <div class="total-line">
                <span>Tổng tiền</span>
                <span>${formatPrice(order?.totalAmount)}đ</span>
              </div>
            </div>

            ${
              isCompletedInvoice
                ? `<div class="note">Đơn hàng đã hoàn thành. Cảm ơn quý khách đã mua hàng.</div>`
                : `<div class="note">Phiếu dùng cho nhân viên giao hàng/đơn vị vận chuyển. Vui lòng kiểm tra thông tin khách hàng trước khi giao.</div>`
            }

            <div class="signatures">
              <div>
                <div class="sign-title">Người lập phiếu</div>
                <div>................................</div>
              </div>

              <div>
                <div class="sign-title">Người nhận hàng</div>
                <div>................................</div>
              </div>
            </div>
          </div>

          <script>
            window.onload = function () {
              window.print()
            }
          <\/script>
        </body>
      </html>
    `;
  };

  const printInvoice = (order, type = "shipping") => {
    if (!order) return;

    const printWindow = window.open("", "_blank", "width=1000,height=800");

    if (!printWindow) {
      snackbarMessage.value = "Trình duyệt đang chặn cửa sổ in";
      snackbarColor.value = "warning";
      showSnackbar.value = true;
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildInvoiceHtml(order, type));
    printWindow.document.close();
  };

  const printShippingInvoice = (order) => {
    if (!canPrintShippingInvoice(order)) return;
    printInvoice(order, "shipping");
  };

  const printCompletedInvoice = (order) => {
    if (!canPrintCompletedInvoice(order)) return;
    printInvoice(order, "completed");
  };

  const IMAGE_BASE_URL = "";

  const resolveOrderItemImageUrl = (imageUrl) => {
    const value = String(imageUrl || "").trim();

    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://"))
      return value;
    if (value.startsWith("data:") || value.startsWith("blob:")) return value;

    if (!IMAGE_BASE_URL) {
      return value.startsWith("/") ? value : `/${value}`;
    }

    return `${IMAGE_BASE_URL.replace(/\/$/, "")}/${value.replace(/^\//, "")}`;
  };

  const selectedReturnedItems = computed(() => {
    const items = Array.isArray(selectedOrder.value?.items)
      ? selectedOrder.value.items
      : [];

    return items
      .filter((item) => Number(item.returnedQuantity || 0) > 0)
      .map((item) => ({
        ...item,
        id: item.orderDetailId,
        quantity: Number(item.returnedQuantity || 0),
        note: selectedOrder.value?.note || "",
        createdAt: selectedOrder.value?.orderDate,
      }));
  });

  const extractReturnNote = (orderNote, item, type) => {
  const noteText = String(orderNote || "").trim();
  if (!noteText) return "";

  const productName = String(item?.productName || "").trim();
  const label = type === "SHIPPING_RETURN" ? "HOAN_HANG" : "TRA_HANG";

  const lines = noteText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const matchedLine = [...lines].reverse().find((line) => {
    const sameType = line.includes(`[${label}`);
    const sameProduct = productName ? line.includes(productName) : true;
    return sameType && sameProduct;
  });

  if (!matchedLine) return "";

  const match = matchedLine.match(/Ghi chú:\s*(.*)$/i);
  return match?.[1]?.trim() || "";
};

  const shippingReturnedItems = computed(() => {
    const items = Array.isArray(selectedOrder.value?.items)
      ? selectedOrder.value.items
      : [];

    return items
      .filter((item) => Number(item.shippingReturnedQuantity || 0) > 0)
      .map((item) => ({
        ...item,
        id: `shipping-${item.orderDetailId}`,
        quantity: Number(item.shippingReturnedQuantity || 0),
note: extractReturnNote(selectedOrder.value?.note, item, "SHIPPING_RETURN"),        createdAt: selectedOrder.value?.orderDate,
        returnType: "SHIPPING_RETURN",
      }));
  });

  const completedReturnedItems = computed(() => {
    const items = Array.isArray(selectedOrder.value?.items)
      ? selectedOrder.value.items
      : [];

    return items
      .filter((item) => Number(item.completedReturnedQuantity || 0) > 0)
      .map((item) => ({
        ...item,
        id: `completed-${item.orderDetailId}`,
        quantity: Number(item.completedReturnedQuantity || 0),
note: extractReturnNote(selectedOrder.value?.note, item, "COMPLETED_RETURN"),        createdAt: selectedOrder.value?.orderDate,
        returnType: "COMPLETED_RETURN",
      }));
  });

  const shippingReturnedItemsTotal = computed(() => {
    return shippingReturnedItems.value.reduce((sum, item) => {
      return sum + getReturnItemTotal(item);
    }, 0);
  });

  const completedReturnedItemsTotal = computed(() => {
    return completedReturnedItems.value.reduce((sum, item) => {
      return sum + getReturnItemTotal(item);
    }, 0);
  });

  const returnedItemsTotal = computed(() => {
    return selectedReturnedItems.value.reduce((sum, item) => {
      return sum + getReturnItemTotal(item);
    }, 0);
  });

  const selectedOrderItems = computed(() => {
    const items = Array.isArray(selectedOrder.value?.items)
      ? selectedOrder.value.items
      : [];

    return items
      .map((item) => {
        const originalQuantity = Number(item.quantity || 0);
        const returnedQuantity = Number(item.returnedQuantity || 0);
        const remainingQuantity = Number(
          item.remainingQuantity ??
            item.returnableQuantity ??
            Math.max(0, originalQuantity - returnedQuantity),
        );

        return {
          ...item,
          originalQuantity,
          returnedQuantity,
          quantity: remainingQuantity,
        };
      })
      .filter((item) => Number(item.quantity || 0) > 0);
  });

  const getReturnItemMaxQuantity = (item) => {
    const quantity = Number(
      item?.remainingQuantity ??
        item?.returnableQuantity ??
        item?.quantity ??
        0,
    );

    return Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
  };

  const canReturnItem = (order, item) => {
    if (!order || !item) return false;

    const stage = getOrderVisualStage(order);
    const maxQuantity = getReturnItemMaxQuantity(item);

    return isOnlineOrder(order) && stage === "IN_TRANSIT" && maxQuantity > 0;
  };

  const getReturnItemTotal = (item) => {
    return Number(item?.quantity || 0) * Number(item?.price || 0);
  };

  const resetReturnForm = () => {
    returnTargetItem.value = null;
    returnQuantity.value = 1;
    returnNote.value = "";
    returnErrors.value = {
      quantity: "",
      note: "",
    };
  };

  const openReturnItemDialog = (item) => {
    if (!canReturnItem(selectedOrder.value, item)) return;

    returnTargetItem.value = item;
    returnQuantity.value = 1;
    returnNote.value = "";
    returnErrors.value = {
      quantity: "",
      note: "",
    };
    returnItemDialog.value = true;
  };

  const closeReturnItemDialog = () => {
    returnItemDialog.value = false;
    resetReturnForm();
  };

  const validateReturnItem = () => {
    const item = returnTargetItem.value;
    const maxQuantity = getReturnItemMaxQuantity(item);
    const quantity = Number(returnQuantity.value);
    const note = String(returnNote.value || "").trim();

    const errors = {
      quantity: "",
      note: "",
    };

    if (!Number.isInteger(quantity)) {
      errors.quantity = "Số lượng phải là số nguyên";
    } else if (quantity <= 0) {
      errors.quantity = "Số lượng phải lớn hơn 0";
    } else if (quantity > maxQuantity) {
      errors.quantity = `Số lượng hoàn không được vượt quá ${maxQuantity}`;
    }

    if (!note) {
      errors.note = "Vui lòng nhập ghi chú hoàn hàng";
    } else if (note.length < 5) {
      errors.note = "Ghi chú phải có ít nhất 5 ký tự";
    }

    returnErrors.value = errors;

    return !errors.quantity && !errors.note;
  };

  const submitReturnItem = async () => {
    const order = selectedOrder.value;
    const item = returnTargetItem.value;

    if (!order || !item) return;
    if (!validateReturnItem()) return;

    returningOrderDetailId.value = String(
      item?.orderDetailId || item?.id || "",
    );

    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");

      await paymentApi.returnShippingOrderItemByAdmin(
        order.orderId,
        {
          orderDetailId: item.orderDetailId || item.id,
          quantity: Number(returnQuantity.value),
          note: String(returnNote.value || "").trim(),
        },
        token,
      );

      await loadOrderDetail();

      snackbarMessage.value = "Hoàn hàng thành công, tồn kho đã được cập nhật";
      snackbarColor.value = "success";
      showSnackbar.value = true;

      closeReturnItemDialog();
    } catch (error) {
      console.error("Lỗi hoàn hàng:", error);
      snackbarMessage.value =
        error?.response?.data?.message || "Hoàn hàng thất bại";
      snackbarColor.value = "error";
      showSnackbar.value = true;
    } finally {
      returningOrderDetailId.value = null;
    }
  };

  const getOrderItemTotal = (item) => {
    const quantity = Number(item?.quantity || 0);
    const price = Number(item?.price || 0);

    return quantity * price;
  };
  const initPaymentDetail = async () => {
    reloadIdSets();
    orderEditHistoryMap.value = loadMap(ORDER_EDIT_HISTORY_KEY);
    orderTimelineMap.value = loadMap(ORDER_TIMELINE_KEY);
    await loadOrderDetail();
  };
  const openEditHistoryDialog = () => {
    editHistoryDialog.value = true;
  };

  const closeEditHistoryDialog = () => {
    editHistoryDialog.value = false;
  };

  onBeforeUnmount(() => {
    clearTimelineTimer();
  });

  return {
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

    timelineRevealCount,

    shippingReturnedItems,
    completedReturnedItems,
    shippingReturnedItemsTotal,
    completedReturnedItemsTotal,

    returnedItemsTotal,

    selectedReturnedItems,
    canReturnItem,
    openReturnItemDialog,
    closeReturnItemDialog,
    submitReturnItem,
    getReturnItemMaxQuantity,
    getReturnItemTotal,

    returnItemDialog,
    returnTargetItem,
    returnQuantity,
    returnNote,
    returnErrors,
    returningOrderDetailId,

    selectedOrderItems,
    resolveOrderItemImageUrl,
    getOrderItemTotal,

    editHistoryDialog,
    openEditHistoryDialog,
    closeEditHistoryDialog,

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
    isOfflineOrder,
    isOfflineGuestOrder,
    isUiDeliveredOrder,

    canStartShipping,
    canCompleteDelivery,
    canConfirmOrder,
    canCompleteOrder,
    canRevertOrder,
    canCancelOrder,

    getOrderVisualStage,

    canPrintShippingInvoice,
    canPrintCompletedInvoice,
    printShippingInvoice,
    printCompletedInvoice,

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
  };
}
