import axios from "axios";

const API = "http://localhost:8080/api/product-color";

export default {
  getAll() {
    return axios.get(API);
  },

  getById(id) {
    return axios.get(`${API}/${id}`);
  },

  create(productId, data) {
    return axios.post(`${API}/${productId}/color`, data);
  },

  update(productColorId, data) {
    return axios.put(`${API}/${productColorId}`, data);
  },

  delete(productColorId) {
    return axios.delete(`${API}/${productColorId}`);
  },
};