import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get all product discounts
export const getAllProductDiscounts = () => 
    api.get('/product-discounts');

// Get product discount by ID
export const getProductDiscountById = (id) => 
    api.get(`/product-discounts/${id}`);

// Get discounts for a specific product color
export const getDiscountsByProductColor = (productColorId) => 
    api.get(`/product-discounts/product-color/${productColorId}`);

// Get all active discounts
export const getActiveProductDiscounts = () => 
    api.get('/product-discounts/active');

// Get discounts by reason (slow-selling, seasonal, etc.)
export const getDiscountsByReason = (reason) => 
    api.get(`/product-discounts/reason/${reason}`);

// Create new product discount
export const createProductDiscount = (discountData) => 
    api.post('/product-discounts', discountData);

// Update product discount
export const updateProductDiscount = (id, discountData) => 
    api.put(`/product-discounts/${id}`, discountData);

// Delete product discount
export const deleteProductDiscount = (id) => 
    api.delete(`/product-discounts/${id}`);

// Check if discount is valid
export const isDiscountValid = (id) => 
    api.get(`/product-discounts/${id}/valid`);

// Increment quantity used
export const useProductDiscount = (id) => 
    api.post(`/product-discounts/${id}/use`);
