import axios from "axios"

const apiClient = axios.create({
  baseURL: "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
})

export default {
  requestOtp(email) {
    return apiClient.post("/auth/register/request-otp", { email })
  },

  confirmRegister(data) {
    return apiClient.post("/auth/register/confirm", data)
  },
}