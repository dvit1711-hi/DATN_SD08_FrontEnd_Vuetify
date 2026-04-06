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

  checkoutSelected(accountId, method, cartItemIds, token, couponCode, shippingFee) {
    const data = {
      accountId,
      method,
      cartItemIds,
      couponCode: couponCode || null,
      shippingFee: Number(shippingFee) > 0 ? Number(shippingFee) : null,
    }

    const config = token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined

    return axios.post(`${API}/checkout/selected`, data, config)
  },

  getGhnShippingFee(payload, token) {
    const config = token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined

    return axios.post(`${API}/shipping-fee/ghn`, payload, config)
  },

  getGhnProvinces(token) {
    const config = token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined

    return axios.get(`${API}/ghn/provinces`, config)
  },

  getGhnDistricts(provinceId, token) {
    const config = {
      params: { provinceId },
    }

    if (token) {
      config.headers = {
        Authorization: `Bearer ${token}`,
      }
    }

    return axios.get(`${API}/ghn/districts`, config)
  },

  getGhnWards(districtId, token) {
    const config = {
      params: { districtId },
    }

    if (token) {
      config.headers = {
        Authorization: `Bearer ${token}`,
      }
    }

    return axios.get(`${API}/ghn/wards`, config)
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

  getMBBankInfo(orderId, token) {
    const config = token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined

    return axios.get(`${API}/orders/${orderId}/mb-bank-info`, config)
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

  cancelOrderByUser(accountId, orderId, token) {
    const config = token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined

    return axios.put(`${API}/account/${accountId}/orders/${orderId}/cancel`, null, config)
  },

  cancelOrderByAdmin(orderId, token) {
    const config = token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined

    return axios.put(`${API}/orders/${orderId}/cancel`, null, config)
  },

  revertOrderStatusByAdmin(orderId, reason, token) {
    const config = token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined

    return axios.put(`${API}/orders/${orderId}/revert`, { reason }, config)
  },

  startShippingByAdmin(orderId, token) {
    const config = token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined

    return axios.put(`${API}/orders/${orderId}/start-shipping`, null, config)
  },

  completeDeliveryByAdmin(orderId, token) {
    const config = token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined

    return axios.put(`${API}/orders/${orderId}/complete-delivery`, null, config)
  },
}
