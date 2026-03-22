import axios from 'axios'

const API = 'http://localhost:8080/api/payment'

export default {
  checkout(accountId, method = 'COD', token) {
    const config = {
      params: { accountId, method },
    }

    if (token) {
      config.headers = {
        Authorization: `Bearer ${token}`,
      }
    }

    return axios.post(`${API}/checkout`, null, config)
  },

  checkoutCOD(accountId, token) {
    return this.checkout(accountId, 'COD', token)
  },

  getOrdersByAccount(accountId, token) {
    const config = token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined

    return axios.get(`${API}/account/${accountId}/orders`, config)
  },

  getAllOrders(token) {
    const config = token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined

    return axios.get(`${API}/orders`, config)
  },

  confirmPayment(orderId, token) {
    const config = token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined

    return axios.put(`${API}/orders/${orderId}/confirm`, null, config)
  },
}
