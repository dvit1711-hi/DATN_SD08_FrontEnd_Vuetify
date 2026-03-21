import axios from 'axios'

const API = 'http://localhost:8080/api/statistics'

export default {
  getDashboard() {
    return axios.get(`${API}/dashboard`)
  },
}
