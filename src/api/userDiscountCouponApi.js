import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get user's all discount coupons
export const getUserDiscountCoupons = (accountId) =>
  api.get('/user-discount-coupons/my-coupons', { params: { accountId } });

// Get user's claimed coupons only
export const getClaimedDiscountCoupons = (accountId) =>
  api.get('/user-discount-coupons/my-claimed', { params: { accountId } });

// Get user's coupons by status
export const getUserDiscountCouponsByStatus = (accountId, status) =>
  api.get('/user-discount-coupons/my-status', { params: { accountId, status } });

// Get all available coupons for promotion page
export const getAvailableDiscountCoupons = () =>
  api.get('/user-discount-coupons/available');

// Claim a discount coupon
export const claimDiscountCoupon = (accountId, couponId) =>
  api.post('/user-discount-coupons/claim', { accountId, couponId }, { params: { accountId } });

// Get single user coupon by ID
export const getUserDiscountCouponById = (id) =>
  api.get(`/user-discount-coupons/${id}`);

// Update user coupon status
export const updateUserDiscountCouponStatus = (id, status) =>
  api.put(`/user-discount-coupons/${id}`, { status });

// Delete user coupon
export const deleteUserDiscountCoupon = (id) =>
  api.delete(`/user-discount-coupons/${id}`);

export default {
  getUserDiscountCoupons,
  getClaimedDiscountCoupons,
  getUserDiscountCouponsByStatus,
  getAvailableDiscountCoupons,
  claimDiscountCoupon,
  getUserDiscountCouponById,
  updateUserDiscountCouponStatus,
  deleteUserDiscountCoupon,
};
