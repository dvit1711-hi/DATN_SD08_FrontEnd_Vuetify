import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
})

const clearAuthStorage = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("accessToken")
  localStorage.removeItem("accountId")
  localStorage.removeItem("username")
  localStorage.removeItem("email")
  localStorage.removeItem("roles")
  localStorage.removeItem("userRole")
  localStorage.removeItem("cartId")
}

api.interceptors.request.use(config => {
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken")

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status
    const message = error.response?.data?.message || error.response?.data

    if (status === 401) {
      clearAuthStorage()

      alert(message || "Phiên đăng nhập đã hết hạn hoặc tài khoản đã bị khóa, vui lòng đăng nhập lại!")
      window.location.href = "/login"
      return Promise.reject(error)
    }

    if (status === 403) {
      alert(message || "Bạn không có quyền truy cập chức năng này!")
    }

    return Promise.reject(error)
  }
)

export default {
  getAll() {
    return api.get("/api/account")
  },

  getById(id) {
    return api.get(`/api/account/getById/${id}`)
  },

  getStatuses() {
    return api.get("/api/status")
  },

  updateStatus(id, data) {
    return api.put(`/api/account/${id}/status`, data)
  },

  create(data) {
    return api.post("/api/account", data)
  },

  update(id, data) {
    return api.put(`/api/account/${id}`, data)
  },

  delete(id) {
    return api.delete(`/api/account/${id}`)
  },

  updateAccountFull(data) {
    return api.put("/api/account/update-full", data)
  },

  changePassword(data) {
    return api.put("/api/account/change-password", data)
  },

  getStaffStatuses() {
    return api.get("/api/admin/staff/statuses")
  },

  createStaffAccount(data) {
    return api.post("/api/admin/staff", data)
  },
}