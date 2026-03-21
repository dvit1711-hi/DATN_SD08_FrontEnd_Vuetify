import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useUserStore = defineStore('user', () => {
  const accountId = ref(localStorage.getItem('accountId') || null)
  const cartId = ref(localStorage.getItem('cartId') || null)
  const token = ref(localStorage.getItem('token') || null)
  const username = ref(localStorage.getItem('username') || null)

  // Get cart of current user
  const getOrCreateCart = async () => {
    if (cartId.value) {
      return cartId.value
    }

    if (!accountId.value) {
      throw new Error('Bạn cần đăng nhập trước')
    }

    try {
      // Create new cart for user
      const response = await axios.post(
        'http://localhost:8080/api/carts',
        { accountID: parseInt(accountId.value) },
        {
          headers: {
            Authorization: `Bearer ${token.value}`
          }
        }
      )

      const newCartId = response.data.id || response.data.cartID
      cartId.value = newCartId
      localStorage.setItem('cartId', newCartId)

      return newCartId
    } catch (error) {
      console.error('Lỗi tạo giỏ hàng:', error)
      throw error
    }
  }

  // Add item to cart via API
  const addToCartAPI = async (productColorId, quantity) => {
    if (!accountId.value) {
      throw new Error('Bạn cần đăng nhập trước')
    }

    try {
      const cid = await getOrCreateCart()

      const response = await axios.post(
        'http://localhost:8080/api/cart-items',
        {
          cartID: parseInt(cid),
          productColorID: parseInt(productColorId),
          quantity: parseInt(quantity)
        },
        {
          headers: {
            Authorization: `Bearer ${token.value}`
          }
        }
      )

      return response.data
    } catch (error) {
      console.error('Lỗi thêm vào giỏ:', error)
      throw error
    }
  }

  // Login user
  const login = (data) => {
    accountId.value = data.accountId
    cartId.value = null // Reset cart
    token.value = data.token
    username.value = data.username

    localStorage.setItem('accountId', data.accountId)
    localStorage.setItem('token', data.token)
    localStorage.setItem('username', data.username)
    localStorage.removeItem('cartId')
  }

  // Logout user
  const logout = () => {
    accountId.value = null
    cartId.value = null
    token.value = null
    username.value = null

    localStorage.removeItem('accountId')
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('cartId')
  }

  const isLoggedIn = computed(() => !!token.value && !!accountId.value)

  return {
    accountId,
    cartId,
    token,
    username,
    isLoggedIn,
    getOrCreateCart,
    addToCartAPI,
    login,
    logout
  }
})
