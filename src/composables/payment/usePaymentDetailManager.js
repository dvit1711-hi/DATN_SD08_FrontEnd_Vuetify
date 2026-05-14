import { computed, onBeforeUnmount, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import JsBarcode from "jsbarcode";
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

  // 1. getOrderVisualStage — thêm CONFIRMED, bỏ check UI confirmed cho COD
  const getOrderVisualStage = (order) => {
    const orderStatus = String(order?.orderStatus || "").toUpperCase();
    const paymentStatus = String(order?.paymentStatus || "").toUpperCase();

    if (orderStatus === "CANCELLED" || paymentStatus === "CANCELLED")
      return "CANCELLED";
    if (orderStatus === "RETURNED") return "RETURNED";
    if (orderStatus === "PARTIAL_RETURNED") return "PARTIAL_RETURNED";

    if (isOfflineGuestOrder(order)) {
      if (orderStatus === "PAID" || paymentStatus === "PAID")
        return "COMPLETED";
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

    // ✅ CONFIRMED → Chờ giao hàng
    if (orderStatus === "CONFIRMED") return "WAIT_SHIP";

    if (orderStatus === "PENDING_PAYMENT" || orderStatus === "PENDING") {
      // COD ở PENDING_PAYMENT → Chờ xác nhận (không cần check UI nữa)
      if (isOnlinePaymentMethod(order) && paymentStatus === "PAID")
        return "WAIT_SHIP";
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

    if (
      isCodPaymentMethod(order) &&
      (orderStatus === "PENDING_PAYMENT" || orderStatus === "PENDING")
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
        String(step?.code || "").toUpperCase(),
      ),
    );

    if (existed) return;

    const [code, label, icon] = getBaseStepByStage(stage);

    const newStep = createTimelineStep(
      code,
      label,
      icon,
      formatDate(new Date()),
    );

    historyMap[orderId] = [...currentList, newStep];
    orderTimelineMap.value = historyMap;
    persistTimelineMap();
  };

  const appendManyTimelineSteps = (order, stages = []) => {
    stages.forEach((stage) => appendTimelineStep(order, stage));
  };

  // 5. seedTimelineIfMissing — bỏ CONFIRM_ORDER khỏi tất cả stages COD
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

    // ✅ Bỏ hoàn toàn CONFIRM_ORDER — COD đi thẳng WAIT_CONFIRM → WAIT_SHIP
    if (stage === "WAIT_SHIP") {
      if (isOnlinePaymentMethod(order)) {
        appendManyTimelineSteps(order, ["TRANSFER_CONFIRM", "WAIT_SHIP"]);
      } else {
        appendManyTimelineSteps(order, ["WAIT_SHIP"]);
      }
    }

    if (stage === "IN_TRANSIT") {
      if (isOnlinePaymentMethod(order)) {
        appendManyTimelineSteps(order, [
          "TRANSFER_CONFIRM",
          "WAIT_SHIP",
          "IN_TRANSIT",
        ]);
      } else {
        appendManyTimelineSteps(order, ["WAIT_SHIP", "IN_TRANSIT"]);
      }
    }

    if (stage === "DELIVERED") {
      appendManyTimelineSteps(order, ["WAIT_SHIP", "IN_TRANSIT", "DELIVERED"]);
    }

    if (stage === "WAIT_PAYMENT_CONFIRM") {
      appendManyTimelineSteps(order, ["WAIT_SHIP", "IN_TRANSIT", "DELIVERED"]);
    }

    if (stage === "WAIT_COMPLETE") {
      appendManyTimelineSteps(order, [
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
          "WAIT_SHIP",
          "IN_TRANSIT",
          "DELIVERED",
          "COMPLETED",
        ]);
      } else {
        // COD
        appendManyTimelineSteps(order, [
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

  // 2. canStartShipping — bỏ check uiOrderConfirmed, thêm CONFIRMED
  const canStartShipping = (order) => {
    if (!order || !isOnlineOrder(order)) return false;

    const orderStatus = String(order?.orderStatus || "").toUpperCase();
    const paymentStatus = String(order?.paymentStatus || "").toUpperCase();

    if (paymentStatus === "CANCELLED") return false;
    if (isUiShippingStartedOrder(order)) return false;

    if (isOnlinePaymentMethod(order)) {
      // BANK/EWALLET: chỉ hiện khi CONFIRMED + PAID
      return orderStatus === "CONFIRMED" && paymentStatus === "PAID";
    }

    if (isCodPaymentMethod(order)) {
      // Bước 1: PENDING_PAYMENT → "Xác nhận đơn"
      // Bước 2: CONFIRMED → "Bắt đầu giao hàng"
      return (
        paymentStatus === "UNPAID" &&
        (orderStatus === "PENDING_PAYMENT" ||
          orderStatus === "PENDING" ||
          orderStatus === "CONFIRMED")
      );
    }

    return false;
  };

  // 4. startShipping — bỏ hoàn toàn bước UI-only "Xác nhận đơn", gọi API thẳng
  const startShipping = async (order) => {
    if (!canStartShipping(order)) return;

    const orderStatus = String(order?.orderStatus || "").toUpperCase();
    const fromOrderStatus = order?.orderStatus;
    const fromPaymentStatus = order?.paymentStatus;

    // =============================
    // BƯỚC 1: COD PENDING → Xác nhận đơn → gọi confirmPayment
    // =============================
    if (
      isCodPaymentMethod(order) &&
      (orderStatus === "PENDING_PAYMENT" || orderStatus === "PENDING")
    ) {
      const confirmed = window.confirm(
        `Xác nhận đơn COD ${getDisplayOrderCode(order)}?`,
      );
      if (!confirmed) return;

      startingShippingOrderId.value = order.orderId;
      try {
        const token = localStorage.getItem("token");
        await paymentApi.confirmPayment(order.orderId, token);

        applyOrderPatch(order, {
          orderStatus: "CONFIRMED",
          paymentStatus: "UNPAID", // COD chưa thu tiền
        });

        appendManyTimelineSteps(order, ["CONFIRM_ORDER", "WAIT_SHIP"]);

        appendOrderEditHistory({
          order,
          action: "Xác nhận đơn",
          reason: "Nhân viên xác nhận đơn COD, chuyển sang chờ giao hàng",
          fromOrderStatus,
          fromPaymentStatus,
          toOrderStatus: "CONFIRMED",
          toPaymentStatus: "UNPAID",
        });

        startTimelineReveal();
        snackbarMessage.value = `Đã xác nhận đơn ${getDisplayOrderCode(order)}`;
        snackbarColor.value = "success";
        showSnackbar.value = true;
      } catch (error) {
        snackbarMessage.value =
          error?.response?.data?.message || "Xác nhận đơn thất bại";
        snackbarColor.value = "error";
        showSnackbar.value = true;
      } finally {
        startingShippingOrderId.value = null;
      }
      return;
    }

    // =============================
    // BƯỚC 2: CONFIRMED → Bắt đầu giao → gọi startShippingByAdmin
    // =============================
    const confirmed = window.confirm(
      `Bắt đầu giao hàng cho đơn ${getDisplayOrderCode(order)}?`,
    );
    if (!confirmed) return;

    startingShippingOrderId.value = order.orderId;
    try {
      const token = localStorage.getItem("token");
      await paymentApi.startShippingByAdmin(order.orderId, token);

      applyOrderPatch(order, { orderStatus: "SHIPPING" });

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
      snackbarMessage.value = `Đơn ${getDisplayOrderCode(order)} đang vận chuyển`;
      snackbarColor.value = "success";
      showSnackbar.value = true;
    } catch (error) {
      snackbarMessage.value =
        error?.response?.data?.message || "Không thể bắt đầu giao hàng";
      snackbarColor.value = "error";
      showSnackbar.value = true;
    } finally {
      startingShippingOrderId.value = null;
    }
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
        // COD đã giao xong → xác nhận thu tiền mặt
        // Giữ SHIPPING, set PAID → completeDelivery sẽ set PAID sau
        applyOrderPatch(order, {
          paymentStatus: "PAID",
          orderStatus: order?.orderStatus,
        });
        appendTimelineStep(order, "TRANSFER_CONFIRM");
        appendOrderEditHistory({
          order,
          action: "Xác nhận thanh toán COD",
          reason: "Nhân viên xác nhận đã nhận tiền COD",
          fromOrderStatus,
          fromPaymentStatus,
          toOrderStatus: order?.orderStatus,
          toPaymentStatus: "PAID",
        });
      } else {
        // BANK/EWALLET: xác nhận chuyển khoản → CONFIRMED (chờ giao hàng)
        // ✅ Patch CONFIRMED không phải SHIPPING
        applyOrderPatch(order, {
          paymentStatus: "PAID",
          orderStatus: "CONFIRMED",
        });
        clearUiShippingStarted(order.orderId);
        appendManyTimelineSteps(order, ["TRANSFER_CONFIRM", "WAIT_SHIP"]);
        appendOrderEditHistory({
          order,
          action: "Xác nhận thanh toán",
          reason: "Nhân viên xác nhận giao dịch thanh toán thành công",
          fromOrderStatus,
          fromPaymentStatus,
          toOrderStatus: "CONFIRMED",
          toPaymentStatus: "PAID",
        });
      }

      startTimelineReveal();
      snackbarMessage.value = `Đã xác nhận thanh toán đơn ${getDisplayOrderCode(order)}`;
      snackbarColor.value = "success";
      showSnackbar.value = true;
    } catch (error) {
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

      // Trong revertOrderStatus, phần xử lý sau khi gọi API thành công:

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
          responseOrderStatus === "PENDING_PAYMENT" ||
          responseOrderStatus === "PENDING"
        ) {
          clearUiOrderConfirmed(order.orderId);
          clearUiDelivered(order.orderId);
          clearUiShippingStarted(order.orderId);
        } else if (responseOrderStatus === "CONFIRMED") {
          // ✅ Revert từ SHIPPING về CONFIRMED = Chờ giao hàng
          // Xóa trạng thái đang giao, giữ lại shipping started nếu cần
          clearUiDelivered(order.orderId);
          clearUiShippingStarted(order.orderId); // reset để nút "Bắt đầu giao" hiện lại
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

  const getDisplayShipPickupCode = (order) => {
    return (
      order?.shipPickupCode ||
      order?.shipperPickupCode ||
      order?.pickupCode ||
      order?.shippingPickupCode ||
      "-"
    );
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
    const formatCurrency = (n) => {
      const value = Number(n || 0);
      return value.toLocaleString("vi-VN") + " đ";
    };

    const orderCode = getDisplayOrderCode(order);
    const storeLogoUrl = order.storeLogo || "/images/logo1.jpg";
    const storeName = order.storeName || "DTVĐ";
    const storePhone = order.storePhone || "0906076388";
    const storeEmail = order.storeEmail || "tienmnhat@gmail.com";
    const storeAddress =
      order.storeAddress || "160 Cao Lỗ, Uy Nỗ, Đông Anh, Hà Nội";

    const customerName =
      order?.customerName ||
      order?.receiverName ||
      order?.buyerName ||
      order?.customer?.name ||
      "Khách hàng";
    const shippingAddress =
      order?.shippingAddress ||
      order?.address ||
      order?.deliveryAddress ||
      order?.customer?.address ||
      "Tại cửa hàng";
    const orderDate = order?.orderDate
      ? new Date(order.orderDate).toLocaleString("vi-VN")
      : new Date().toLocaleString("vi-VN");
    const paymentStatus = order?.paymentStatus || "PAID";
    const shipPickupCode = getDisplayShipPickupCode(order);
    const shipQrCode =
      shipPickupCode && shipPickupCode !== "-" ? shipPickupCode : orderCode;
    const receiverPhone =
      order?.customerPhone ||
      order?.receiverPhone ||
      order?.phoneNumber ||
      order?.customer?.phone ||
      "-";

    const barcodeBlock = `
            <div class="barcode-box">
                <svg id="barcode-order" width="100%" height="50"></svg>
                <div class="barcode-label">Mã hóa đơn: ${orderCode}</div>
            </div>
        `;

    const getInvoiceItems = (orderData = {}) => {
      const candidates = [
        orderData.items,
        orderData.orderItems,
        orderData.orderDetails,
        orderData.details,
        orderData.orderDetailList,
        orderData.order_items,
        orderData.order_detail_list,
      ];

      return candidates.find((value) => Array.isArray(value)) || [];
    };

    const getItemName = (item) => {
      return (
        item?.productName ||
        item?.name ||
        item?.productColorName ||
        item?.product?.productName ||
        item?.productColor?.productName ||
        item?.nameProduct ||
        "Sản phẩm"
      );
    };

    const getItemVariant = (item) => {
      const color =
        item?.colorName || item?.color || item?.productColor?.colorName || "";
      const size =
        item?.sizeName || item?.size || item?.productColor?.sizeName || "";
      const variant = [color, size].filter(Boolean).join(" / ");
      return variant || item?.variant || "";
    };

    const getItemQuantity = (item) => {
      return Number(item?.quantity ?? item?.qty ?? item?.amount ?? 0);
    };

    const getItemPrice = (item) => {
      return Number(
        item?.price ??
          item?.unitPrice ??
          item?.salePrice ??
          item?.priceAfterDiscount ??
          0,
      );
    };

    const getItemTotal = (item) => {
      const explicitTotal = Number(
        item?.total ?? item?.totalAmount ?? item?.lineTotal ?? 0,
      );
      if (explicitTotal > 0) return explicitTotal;
      return getItemQuantity(item) * getItemPrice(item);
    };

    const invoiceItems = getInvoiceItems(order);
    const invoiceTotal = Number(
      order?.totalAmount ??
        order?.total ??
        order?.grandTotal ??
        order?.orderTotal ??
        invoiceItems.reduce((sum, item) => sum + getItemTotal(item), 0),
    );
    const invoiceCode =
      order?.orderId ||
      order?.id ||
      order?.orderCode ||
      order?.trackingCode ||
      "-";

    const bankInfoBlock =
      order?.bankName ||
      order?.accountNumber ||
      order?.accountName ||
      order?.transferContent ||
      order?.amount
        ? `
        <div class="banking-box">
            ${order?.bankName ? `<div><strong>Ngân hàng:</strong> ${order.bankName}</div>` : ""}
            ${order?.accountNumber ? `<div><strong>Số tài khoản:</strong> ${order.accountNumber}</div>` : ""}
            ${order?.accountName ? `<div><strong>Chủ tài khoản:</strong> ${order.accountName}</div>` : ""}
            ${order?.transferContent ? `<div><strong>Nội dung CK:</strong> ${order.transferContent}</div>` : ""}
            ${order?.amount ? `<div><strong>Số tiền CK:</strong> ${formatCurrency(order.amount)}</div>` : ""}
        </div>
      `
        : "";

    const invoiceRows = invoiceItems.length
      ? invoiceItems
          .map((item, index) => {
            const quantity = getItemQuantity(item);
            const price = getItemPrice(item);
            const total = getItemTotal(item);
            return `
                    <tr>
                        <td class="center">${index + 1}</td>
                        <td>
                            <div class="product-name">${getItemName(item)}</div>
                            ${getItemVariant(item) ? `<div class="product-sub">${getItemVariant(item)}</div>` : ""}
                        </td>
                        <td class="center">${quantity}</td>
                        <td class="right">${formatCurrency(price)}</td>
                        <td class="right">${formatCurrency(total)}</td>
                        <td class="center">${paymentStatus}</td>
                    </tr>
                    `;
          })
          .join("")
      : `
                <tr>
                    <td colspan="6" class="center">Không có chi tiết sản phẩm</td>
                </tr>
            `;

    const totalQuantity = invoiceItems.reduce(
      (sum, item) => sum + getItemQuantity(item),
      0,
    );
    const shippingContentRows = invoiceItems.length
      ? invoiceItems
          .map((item) => {
            const variant = getItemVariant(item);
            return `<div>+ ${getItemName(item)}${variant ? ` (${variant})` : ""} - SL: ${getItemQuantity(item)}</div>`;
          })
          .join("")
      : "<div>Không có chi tiết sản phẩm</div>";

    if (type === "shipping") {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(shipQrCode)}`;
      return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8" />
    <title>Phiếu giao hàng #${orderCode}</title>
    <style>
        @page { size: A5 portrait; margin: 8mm; }
        body { margin:0; font-family: Arial, Helvetica, sans-serif; font-size:12px; color:#111; }
        .ship-sheet { border:1px solid #111; min-height:100%; }
        .ship-head { display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #111; padding:8px 10px; gap:10px; }
        .ship-logo { max-width:120px; max-height:58px; width:auto; height:auto; object-fit:contain; }
        .ship-barcode-box { flex:1; display:flex; flex-direction:column; align-items:flex-end; justify-content:center; }
        .ship-barcode-box svg { width:160px; height:34px; display:block; }
        .ship-barcode-label { margin-top:4px; font-size:10px; font-weight:400; color:#111; }
        .ship-address { display:grid; grid-template-columns:1fr 1fr; border-bottom:1px solid #111; }
        .ship-col { padding:8px; min-height:86px; border-right:1px solid #111; }
        .ship-col:last-child { border-right:none; }
        .ship-label { font-weight:700; margin-bottom:4px; }
        .ship-row { margin:2px 0; line-height:1.35; }
        .ship-mid { display:grid; grid-template-columns:160px 1fr; border-bottom:1px solid #111; min-height:155px; }
        .ship-qr { border-right:1px solid #111; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:8px; }
        .ship-qr img { width:110px; height:110px; object-fit:contain; }
        .ship-qr-code { margin-top:6px; font-size:11px; font-weight:700; text-align:center; }
        .ship-content { padding:8px; line-height:1.35; }
        .ship-content-title { font-weight:700; margin-bottom:6px; }
        .ship-bottom { display:grid; grid-template-columns:1fr 1fr; min-height:120px; }
        .ship-money { padding:10px; font-size:14px; font-weight:700; }
        .ship-sign { border-left:1px solid #111; padding:10px; text-align:center; color:#333; }
    </style>
</head>
<body>
    <div class="ship-sheet">
        <div class="ship-head">
            <img class="ship-logo" src="${storeLogoUrl}" alt="${storeName}" />
            <div class="ship-barcode-box">
                <svg id="ship-barcode-order" width="160" height="34"></svg>
                <div class="ship-barcode-label">Mã đơn: ${orderCode}</div>
            </div>
        </div>

        <div class="ship-address">
            <div class="ship-col">
                <div class="ship-label">Từ:</div>
                <div class="ship-row">Shop: ${storeName}</div>
                <div class="ship-row">${storeAddress}</div>
                <div class="ship-row">SĐT: ${storePhone}</div>
            </div>
            <div class="ship-col">
                <div class="ship-label">Đến:</div>
                <div class="ship-row">${customerName}</div>
                <div class="ship-row">${shippingAddress}</div>
                <div class="ship-row">SĐT: ${receiverPhone}</div>
            </div>
        </div>

        <div class="ship-mid">
            <div class="ship-qr">
                <img src="${qrUrl}" />
                <div class="ship-qr-code">${shipQrCode}</div>
            </div>
            <div class="ship-content">
                <div class="ship-content-title">Nội dung hàng (Tổng SL sản phẩm: ${totalQuantity})</div>
                ${shippingContentRows}
                <div class="ship-row" style="margin-top:8px;"><b>Mã lấy hàng:</b> ${shipPickupCode}</div>
                <div class="ship-row"><b>Mã đơn:</b> ${orderCode}</div>
            </div>
        </div>

        <div class="ship-bottom">
            <div class="ship-money">
                Tiền thu người nhận:<br />
                ${formatCurrency(order?.totalAmount ?? order?.total ?? invoiceTotal)}
            </div>
            <div class="ship-sign">
                Chữ ký người nhận<br />
                (Xác nhận hàng nguyên vẹn, không móp/méo)
            </div>
        </div>
    </div>
</body>
</html>
`;
    }

    return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8" />
    <title>Hóa đơn bán hàng #${invoiceCode}</title>

    <style>
        @page { size: A5 portrait; margin: 10mm; }
        body { margin:0; font-family: Arial, Helvetica, sans-serif; font-size:13px; }

        .receipt { width:100%; padding:8px; }
        .top-header {
            display:grid; grid-template-columns:150px 1fr 220px;
            gap:12px; align-items:center; margin-bottom:8px;
        }
        .logo-box { display:flex; align-items:center; justify-content:center; }
        .header-logo { width:140px; max-height:80px; object-fit:contain; }
        .shop-info { text-align:center; }
        .shop-name { font-size:28px; font-weight:700; margin-bottom:6px; }
        .shop-line { margin:2px 0; font-size:13px; }
        .barcode-box {
            width:180px; max-width:180px; margin:0;
            padding:0; box-sizing:border-box;
            border:none; background:none;
            text-align:left;
        }
        .barcode-box svg { width:100%; height:38px; display:block; }
        .barcode-label { margin-top:6px; font-size:11px; font-weight:400; color:#111; }

        .title {
            text-align:center; font-size:30px;
            margin:14px 0 12px; font-weight:800; text-transform:uppercase;
        }

        .meta-grid { display:flex; justify-content:space-between; margin-bottom:10px; gap:16px; }
        .meta-col { width:48%; line-height:1.55; }

        table { width:100%; border-collapse:collapse; border:1px solid #111; table-layout:fixed; margin-top:4px; }
        th,td { border:1px solid #111; box-sizing:border-box; padding:6px 7px; font-size:12.5px; word-break:break-word; }
        th { text-align:center; font-weight:700; }

        .center { text-align:center; }
        .right { text-align:right; white-space:nowrap; }

        .product-name { font-weight:700; }
        .product-sub { color:#444; font-size:11px; margin-top:2px; }

        .bottom-area { display:flex; justify-content:space-between; align-items:flex-start; gap:20px; margin-top:12px; }
        .left-note { flex:1; min-height:120px; }
        .summary { width:240px; min-width:180px; margin-left:auto; }
        .summary-row { display:flex; justify-content:space-between; align-items:center; gap:12px; margin:4px 0; font-size:13px; }
        .summary-row span { white-space:normal; word-break:break-word; }
        .summary-row strong { white-space:nowrap; }
        .summary-row.total { font-size:16px; font-weight:800; margin-top:8px; line-height:1.2; }
        .summary-row.total span { font-size:14px; }

        .qr-order-left { display:flex; flex-direction:column; align-items:center; justify-content:center; }
        .qr-order-left img { width:140px; height:140px; object-fit:contain; }
        .qr-label { font-size:12px; margin-top:6px; font-weight:600; }
        .qr-code { font-size:11px; margin-top:2px; color:#444; }

        .banking-box { margin-top:10px; padding-top:8px; border-top:1px dashed #444; line-height:1.55; font-size:12.5px; }
        .footer { text-align:center; margin-top:16px; font-size:12px; color:#333; }
    </style>
</head>

<body>
    <div class="receipt">

        <div class="top-header">
            <div class="logo-box">
                <img class="header-logo" src="${storeLogoUrl}" />
            </div>

            <div class="shop-info">
                <div class="shop-name">${storeName}</div>
                <div class="shop-line"><b>SĐT:</b> ${storePhone}</div>
                <div class="shop-line"><b>Email:</b> ${storeEmail}</div>
                <div class="shop-line">${storeAddress}</div>
            </div>

            ${barcodeBlock}
        </div>

        <div class="title">HÓA ĐƠN BÁN HÀNG</div>

        <div class="meta-grid">
            <div class="meta-col">
                <div><b>Khách hàng:</b> ${customerName}</div>
                <div><b>Địa chỉ nhận hàng:</b> ${shippingAddress}</div>
                <div><b>Nhân viên:</b> ${order.employeeName || order.staffName || "admin"}</div>
            </div>
            <div class="meta-col" style="text-align:right;">
                <div><b>Mã hóa đơn:</b> ${invoiceCode}</div>
                <div><b>Mã lấy hàng shipper:</b> ${shipPickupCode}</div>
                <div><b>Ngày tạo:</b> ${orderDate}</div>
                <div><b>Trạng thái:</b> ${paymentStatus}</div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width:40px;">STT</th>
                    <th>Tên sản phẩm</th>
                    <th style="width:70px;">Số lượng</th>
                    <th style="width:110px;">Đơn giá</th>
                    <th style="width:120px;">Thành tiền</th>
                    <th style="width:90px;">Trạng thái</th>
                </tr>
            </thead>
            <tbody>
                ${invoiceRows}
            </tbody>
        </table>

        <div class="bottom-area">
            <div class="left-note">
                ${bankInfoBlock}
            </div>
            <div class="summary">
                <div class="summary-row">
                    <span>Tổng tiền hàng:</span>
                    <strong>${formatCurrency(invoiceTotal)}</strong>
                </div>
                <div class="summary-row">
                    <span>Giảm giá:</span>
                    <strong>${formatCurrency(order.discountAmount || order.discount || 0)}</strong>
                </div>
                <div class="summary-row">
                    <span>Phí giao hàng:</span>
                    <strong>${formatCurrency(order.deliveryFee || order.shippingFee || 0)}</strong>
                </div>
                <div class="summary-row total">
                    <span>Tổng tiền cần thanh toán:</span>
                    <strong>${formatCurrency(order?.totalAmount ?? order?.total ?? invoiceTotal)}</strong>
                </div>
            </div>
        </div>

        <div class="footer">Cảm ơn quý khách đã mua hàng</div>
    </div>
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

    printWindow.onload = () => {
      const barcodeEl = printWindow.document.getElementById("barcode-order");
      const shipBarcodeEl =
        printWindow.document.getElementById("ship-barcode-order");

      if (barcodeEl) {
        JsBarcode(barcodeEl, getDisplayOrderCode(order), {
          format: "CODE128",
          width: 1.2,
          height: 40,
          displayValue: false,
          margin: 0,
        });
      }

      if (shipBarcodeEl) {
        JsBarcode(shipBarcodeEl, getDisplayOrderCode(order), {
          format: "CODE128",
          width: 1.2,
          height: 34,
          displayValue: false,
          margin: 0,
        });
      }

      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 200);
    };
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
        note: extractReturnNote(
          selectedOrder.value?.note,
          item,
          "SHIPPING_RETURN",
        ),
        createdAt: selectedOrder.value?.orderDate,
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
        note: extractReturnNote(
          selectedOrder.value?.note,
          item,
          "COMPLETED_RETURN",
        ),
        createdAt: selectedOrder.value?.orderDate,
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
    getDisplayShipPickupCode,
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