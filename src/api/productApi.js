import axios from "axios";

const API = "http://localhost:8080/api/product";

export default {
  getAll() {
    return axios.get(API);
  },

  getAllCard(search) {
    return axios.get(`${API}/card`, {
      params: search ? { search } : {},
    });
  },

  // Backward-compatible alias used by cart/checkout pages.
  getAllCart(search) {
    return axios.get(`${API}/card`, {
      params: search ? { search } : {},
    });
  },

  getDetail(id) {
    return axios.get(`${API}/detail/${id}`);
  },

  create(data) {
    return axios.post(API, data);
  },

  update(id, data) {
    return axios.put(`${API}/${id}`, data);
  },

  delete(id) {
    return axios.delete(`${API}/${id}`);
  },
};