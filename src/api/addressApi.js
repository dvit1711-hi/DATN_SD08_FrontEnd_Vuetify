import axios from 'axios'

const API = 'http://localhost:8080/api/address'

export default {
  getByAccountId(accountId, token) {
    const config = token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined

    return axios.get(`${API}/account/${accountId}`, config)
  },

  create(data, token) {
    const config = token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined

    return axios.post(API, data, config)
  },
}
