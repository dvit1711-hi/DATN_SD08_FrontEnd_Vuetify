import axios from "axios"

const apiClient = axios.create({
  baseURL: "http://localhost:8080",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  console.log("token frontend:", token)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default {
  searchProducts(keyword = "") {
    return apiClient.get("/api/pos/products", { params: { keyword } })
  },

  searchCustomers(keyword = "") {
    return apiClient.get("/api/pos/customers", { params: { keyword } })
  },

  getPendingOrders() {
    return apiClient.get("/api/pos/orders/pending")
  },

  createOfflineOrder(payload) {
    return apiClient.post("/api/pos/orders", payload)
  },

  getOrder(orderId) {
    return apiClient.get(`/api/pos/orders/${orderId}`)
  },

  updateOrderInfo(orderId, payload) {
    return apiClient.put(`/api/pos/orders/${orderId}`, payload)
  },

  cancelPendingOrder(orderId) {
    return apiClient.delete(`/api/pos/orders/${orderId}`)
  },

  addItem(orderId, payload) {
    return apiClient.post(`/api/pos/orders/${orderId}/items`, payload)
  },

  updateItem(orderId, orderDetailId, payload) {
    return apiClient.put(`/api/pos/orders/${orderId}/items/${orderDetailId}`, payload)
  },

  removeItem(orderId, orderDetailId) {
    return apiClient.delete(`/api/pos/orders/${orderId}/items/${orderDetailId}`)
  },

  applyCoupon(orderId, payload) {
    return apiClient.post(`/api/pos/orders/${orderId}/coupon`, payload)
  },

  getAvailablePromotions(orderId) {
    return apiClient.get(`/api/pos/orders/${orderId}/promotions`)
  },

  checkout(orderId, payload) {
    return apiClient.post(`/api/pos/orders/${orderId}/checkout`, payload)
  },
}