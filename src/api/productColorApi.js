import axios from 'axios'

const API = 'http://localhost:8080/api/product-color'

export default {
  getAll() {
    return axios.get(API)
  },

  getById(id) {
    return axios.get(`${API}/${id}`)
  },
}