import axios from "axios"

const API = "http://localhost:8080/auth"

export default {
  register(data) {
    return axios.post(`${API}/register`, data)
  }
}