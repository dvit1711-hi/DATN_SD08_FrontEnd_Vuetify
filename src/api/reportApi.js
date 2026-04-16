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
  getAdminStaffOptions() {
    return apiClient.get("/admin/reports/staff/options")
  },

  getAdminStaffOverviewToday(employeeId = null, date = null) {
    return apiClient.get("/admin/reports/staff/overview-today", {
      params: {
        employeeId: employeeId || undefined,
        date: date || undefined,
      },
    })
  },

  getAdminStaffToday(employeeId = null, date = null) {
    return apiClient.get("/admin/reports/staff/today", {
      params: {
        employeeId: employeeId || undefined,
        date: date || undefined,
      },
    })
  },

  getAdminCustomerSummary(keyword = "", employeeId = null, date = null) {
    return apiClient.get("/admin/reports/customers/search", {
      params: {
        keyword: keyword || undefined,
        employeeId: employeeId || undefined,
        date: date || undefined,
      },
    })
  },

  getAdminPurchaseHistory(keyword = "", employeeId = null, date = null) {
    return apiClient.get("/admin/reports/customers/purchase-history", {
      params: {
        keyword: keyword || undefined,
        employeeId: employeeId || undefined,
        date: date || undefined,
      },
    })
  },
}