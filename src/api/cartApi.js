import axios from 'axios'

const API = 'http://localhost:8080/api/cart-items'

export default {
  getAll() {
    return axios.get(API)
  },

  getByCart(cartId) {
    return axios.get(`${API}/cart/${cartId}`)
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

  clearCart(cartId, token) {
    const config = token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined

    return axios.delete(`http://localhost:8080/api/carts/${cartId}/clear`, config)
  },
}
