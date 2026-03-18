import axios from "axios"

const API = "http://localhost:8080/auth"

export default {
  login(data) {
    return axios.post(`${API}/login`, data, {
      withCredentials: true, // để nhận cookie HttpOnly từ backend
    })
  }
}