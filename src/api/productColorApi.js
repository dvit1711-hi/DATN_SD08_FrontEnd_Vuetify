import axios from "axios";

const API = "http://localhost:8080/api/product-color";

// Named exports
export const getAll = () => axios.get(API);
export const getById = (id) => axios.get(`${API}/${id}`);
export const create = (productId, data) => axios.post(`${API}/${productId}/color`, data);
export const update = (productColorId, data) => axios.put(`${API}/${productColorId}`, data);
export const deleteProductColor = (productColorId) => axios.delete(`${API}/${productColorId}`);

// Default export for backward compatibility
export default {
  getAll,
  getById,
  create,
  update,
  delete: deleteProductColor,
};