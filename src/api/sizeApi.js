import axios from "axios";

const API = "http://localhost:8080/api/size";

export default {
  getAll() {
    return axios.get(API);
  },
  getAllActive() {
    return axios.get(`${API}/active`);
  },

  getById(id) {
    return axios.get(`${API}/${id}`);
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