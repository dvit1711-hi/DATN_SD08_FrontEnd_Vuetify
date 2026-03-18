
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get all discount coupons
export const getAllDiscountCoupons = () => 
    api.get('/discount-coupons');

// Get discount coupon by ID
export const getDiscountCouponById = (id) => 
    api.get(`/discount-coupons/${id}`);

// Get coupons by status
export const getDiscountCouponsByStatus = (status) => 
    api.get(`/discount-coupons/status/${status}`);

// Create new discount coupon
export const createDiscountCoupon = (discountData) => 
    api.post('/discount-coupons', discountData);

// Update discount coupon
export const updateDiscountCoupon = (id, discountData) => 
    api.put(`/discount-coupons/${id}`, discountData);

// Delete discount coupon
export const deleteDiscountCoupon = (id) => 
    api.delete(`/discount-coupons/${id}`);

