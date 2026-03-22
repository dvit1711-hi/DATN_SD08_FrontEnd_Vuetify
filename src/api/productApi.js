import axios from 'axios'

const API = 'http://localhost:8080/api/product'

export default {
  getAll() {
    return axios.get(API)
  },
  getAllCart() {
    return axios.get(`${API}/card`)
  },

  getDetail(id) {
    return axios.get(`${API}/detail/${id}`)
  },

  getById(id) {
    return axios.get(`${API}/${id}`)
  },

  create(data) {
    return axios.post(API, data)
  },

  update(id, data) {
    return axios.put(`${API}/${id}`, data)
  },

  addToCart(cartItem) {
    return axios.post(`${API}/add-to-cart`, cartItem)
  },

  // delete(id) {
  //   return axios.delete(`${API}/${id}`)
  // },
}
