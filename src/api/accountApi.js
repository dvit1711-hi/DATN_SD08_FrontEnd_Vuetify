import axios from 'axios'

const API = 'http://localhost:8080/api/account'

export default {
  getAll() {
    return axios.get(API)
  },

  // Sửa đúng API backend
  getById(id) {
    return axios.get(`${API}/getById/${id}`)
  },

  create(data) {
    return axios.post(API, data)
  },

  update(id, data) {
    return axios.put(`${API}/${id}`, data)
  },

  delete(id) {
    return axios.delete(`${API}/${id}`)
  },

  // API update-full
  updateAccountFull(data) {
    return axios.put(`${API}/update-full`, data, {
      withCredentials: true   // BẮT BUỘC
    })
  },

  changePassword(data) {
    return axios.put(`${API}/change-password`, data, {
      withCredentials: true
    })
  }

}