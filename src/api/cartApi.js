import axios from 'axios'

const API = 'http://localhost:8080/api/cart-items'

export default {
  getAll() {
    return axios.get(API)
  },

  update(id, data, token) {
    const config = token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined

    return axios.put(`${API}/${id}`, data, config)
  },

  remove(id, token) {
    const config = token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined

    return axios.delete(`${API}/${id}`, config)
  },
}
