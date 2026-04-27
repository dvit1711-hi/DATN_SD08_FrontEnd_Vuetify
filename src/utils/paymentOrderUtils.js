export const ONLINE_SHIPPING_STARTED_KEY = 'adminOnlineShippingStartedOrderIds'
export const UI_DELIVERED_ORDER_IDS_KEY = 'adminUiDeliveredOrderIds'
export const UI_ORDER_CONFIRMED_IDS_KEY = 'adminUiOrderConfirmedOrderIds'
export const ORDER_EDIT_HISTORY_KEY = 'adminOrderEditHistoryLogs'
export const ORDER_TIMELINE_KEY = 'adminOrderTimelineLogs'

export const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(value || 0)

export const formatDate = (value) => {
  if (!value) return 'N/A'

  if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}/.test(value)) {
    return value
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString('vi-VN')
}

export const parseOrderDateToTimestamp = (value) => {
  if (!value) return 0

  if (value instanceof Date) {
    const time = value.getTime()
    return Number.isNaN(time) ? 0 : time
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()

    const vnMatch = trimmed.match(
      /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/
    )

    if (vnMatch) {
      const [, dd, mm, yyyy, hh = '00', mi = '00', ss = '00'] = vnMatch
      const date = new Date(
        Number(yyyy),
        Number(mm) - 1,
        Number(dd),
        Number(hh),
        Number(mi),
        Number(ss)
      )
      const time = date.getTime()
      return Number.isNaN(time) ? 0 : time
    }

    const parsed = new Date(trimmed)
    const time = parsed.getTime()
    return Number.isNaN(time) ? 0 : time
  }

  return 0
}

export const sortOrdersNewestFirst = (list = []) => {
  return [...list].sort((a, b) => {
    const timeDiff =
      parseOrderDateToTimestamp(b?.orderDate) - parseOrderDateToTimestamp(a?.orderDate)

    if (timeDiff !== 0) return timeDiff

    return Number(b?.orderId || 0) - Number(a?.orderId || 0)
  })
}

export const getDisplayOrderCode = (order) => {
  return order?.trackingCode || `#${order?.orderId || '-'}`
}

export const getAccountId = (order) => {
  return order?.accountId ?? order?.accountID ?? null
}

export const hasAccount = (order) => {
  return !!getAccountId(order) || !!order?.accountUsername
}

export const getOrderType = (order) => {
  return String(order?.orderType || '').toUpperCase()
}

export const isOnlineOrder = (order) => getOrderType(order) === 'ONLINE'

export const isOfflineOrder = (order) => getOrderType(order) === 'OFFLINE'

export const isOfflineGuestOrder = (order) => {
  return isOfflineOrder(order) && !hasAccount(order)
}

export const getOrderTypeLabel = (order) => {
  if (isOnlineOrder(order)) return 'Online'
  if (isOfflineGuestOrder(order)) return 'Offline - Khách lẻ'
  if (isOfflineOrder(order)) return 'Offline'
  return 'Không xác định'
}

export const getDisplayCustomer = (order) => {
  if (isOfflineGuestOrder(order)) {
    return order?.customerName || order?.customerPhone || 'Khách lẻ'
  }

  if (isOfflineOrder(order)) {
    return order?.customerName || order?.accountUsername || 'Khách tại quầy'
  }

  return order?.accountUsername || order?.customerName || 'Khách online'
}

export const getPaymentStatusLabel = (status) => {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'PAID') return 'Đã thanh toán'
  if (normalized === 'UNPAID') return 'Chưa thanh toán'
  if (normalized === 'CANCELLED') return 'Đã hủy'
  return 'Không xác định'
}

export const getPaymentStatusColor = (status) => {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'PAID') return 'success'
  if (normalized === 'UNPAID') return 'warning'
  if (normalized === 'CANCELLED') return 'error'
  return 'info'
}

export const isOnlinePaymentMethod = (order) => {
  const method = String(order?.paymentMethod || '').toUpperCase()
  return (
    method === 'BANK_TRANSFER' ||
    method === 'E_WALLET' ||
    method === 'BANKING' ||
    method === 'VNPAY' ||
    method === 'MOMO'
  )
}

export const isCodPaymentMethod = (order) => {
  const method = String(order?.paymentMethod || '').toUpperCase()
  return method === 'COD'
}

export const isCancelledOrder = (order) => {
  const paymentStatus = String(order?.paymentStatus || '').toUpperCase()
  const orderStatus = String(order?.orderStatus || '').toUpperCase()
  return paymentStatus === 'CANCELLED' || orderStatus === 'CANCELLED'
}