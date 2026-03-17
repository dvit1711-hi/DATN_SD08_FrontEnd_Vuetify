import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default {
  getAll() {
    return api.get('/api/account')
  },

  getById(id) {
    return api.get(`/api/account/getById/${id}`)
  },

  getStatuses() {
    return api.get('/api/status')
  },

  updateStatus(id, data) {
    return api.put(`/api/account/${id}/status`, data)
  },

  create(data) {
    return api.post('/api/account', data)
  },

  update(id, data) {
    return api.put(`/api/account/${id}`, data)
  },

  delete(id) {
    return api.delete(`/api/account/${id}`)
  },

  updateAccountFull(data) {
    return api.put('/api/account/update-full', data)
  },

  changePassword(data) {
    return api.put('/api/account/change-password', data)
  },
}