import axios from "axios"

const apiClient = axios.create({
  baseURL: "http://localhost:8080",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default {
  getMyTodayDashboard(date = null) {
    return apiClient.get("/staff/reports/me/today", {
      params: {
        date: date || undefined,
      },
    })
  },

  getMyCustomerSummary(keyword = "", date = null) {
    return apiClient.get("/staff/reports/me/customers", {
      params: {
        keyword: keyword || undefined,
        date: date || undefined,
      },
    })
  },

  getMyPurchaseHistory(keyword = "", date = null) {
    return apiClient.get("/staff/reports/me/purchase-history", {
      params: {
        keyword: keyword || undefined,
        date: date || undefined,
      },
    })
  },
}