import axios from "axios"

const API = "http://localhost:8080/api/reviews"

export default {
  // Get all reviews
  getAllReviews() {
    return axios.get(API)
  },

  // Get review by id
  getReviewById(id) {
    return axios.get(`${API}/${id}`)
  },

  // Get reviews by product
  getReviewsByProductId(productId) {
    return axios.get(`${API}/product/${productId}`)
  },

  // Get reviews by account
  getReviewsByAccountId(accountId) {
    return axios.get(`${API}/account/${accountId}`)
  },

  // Get average rating for product
  getAverageRatingForProduct(productId) {
    return axios.get(`${API}/product/${productId}/average-rating`)
  },

  // Get total reviews count for product
  getTotalReviewsForProduct(productId) {
    return axios.get(`${API}/product/${productId}/total-count`)
  },

  // Create new review
  createReview(data) {
    return axios.post(API, data)
  },

  // Update review
  updateReview(id, data) {
    return axios.put(`${API}/${id}`, data)
  },

  // Delete review
  deleteReview(id) {
    return axios.delete(`${API}/${id}`)
  }
}
