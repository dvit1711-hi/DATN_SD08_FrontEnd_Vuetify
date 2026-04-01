import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useUserStore = defineStore('user', () => {
  const accountId = ref(localStorage.getItem('accountId') || null)
  const cartId = ref(localStorage.getItem('cartId') || null)
  const token = ref(localStorage.getItem('token') || null)
  const username = ref(localStorage.getItem('username') || null)
  const email = ref(localStorage.getItem('email') || null)
  const roles = ref(JSON.parse(localStorage.getItem('roles') || '[]'))

  const parseValidInt = (value) => {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }

  const buildAuthConfig = () => {
    if (!token.value) return undefined
    return {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    }
  }

  const getOrCreateCart = async () => {
    const existingCartId = parseValidInt(cartId.value)
    if (existingCartId) return existingCartId

    cartId.value = null
    localStorage.removeItem('cartId')

    if (!accountId.value) {
      throw new Error('Bạn cần đăng nhập trước')
    }

    try {
      const payload = { accountID: parseInt(accountId.value, 10) }
      let response

      try {
        response = await axios.post('http://localhost:8080/api/carts', payload, buildAuthConfig())
      } catch (error) {
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          response = await axios.post('http://localhost:8080/api/carts', payload)
        } else {
          throw error
        }
      }

      const newCartId = parseValidInt(response.data?.id || response.data?.cartID)
      if (!newCartId) {
        throw new Error('Không lấy được cartID từ phản hồi tạo giỏ hàng')
      }

      cartId.value = newCartId
      localStorage.setItem('cartId', String(newCartId))
      return newCartId
    } catch (error) {
      console.error('Lỗi tạo giỏ hàng:', error)
      throw error
    }
  }

  const addToCartAPI = async (productColorId, quantity) => {
    if (!accountId.value) {
      throw new Error('Bạn cần đăng nhập trước')
    }

    try {
      const cid = await getOrCreateCart()
      const payload = {
        cartID: parseInt(cid, 10),
        productColorID: parseInt(productColorId, 10),
        quantity: parseInt(quantity, 10)
      }

      let response
      try {
        response = await axios.post('http://localhost:8080/api/cart-items', payload, buildAuthConfig())
      } catch (error) {
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          response = await axios.post('http://localhost:8080/api/cart-items', payload)
        } else {
          throw error
        }
      }

      return response.data
    } catch (error) {
      console.error('Lỗi thêm vào giỏ:', error)
      throw error
    }
  }

  const login = (data) => {
    accountId.value = data.accountId
    cartId.value = null
    token.value = data.token
    username.value = data.username
    email.value = data.email
    roles.value = data.roles || []

    localStorage.setItem('accountId', String(data.accountId))
    localStorage.setItem('token', data.token)
    localStorage.setItem('username', data.username || '')
    localStorage.setItem('email', data.email || '')
    localStorage.setItem('roles', JSON.stringify(data.roles || []))
    localStorage.removeItem('cartId')

    if (data.roles && data.roles.length > 0) {
      localStorage.setItem('userRole', data.roles[0])
    } else {
      localStorage.removeItem('userRole')
    }
  }

  const logout = () => {
    accountId.value = null
    cartId.value = null
    token.value = null
    username.value = null
    email.value = null
    roles.value = []

    localStorage.removeItem('accountId')
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('email')
    localStorage.removeItem('roles')
    localStorage.removeItem('userRole')
    localStorage.removeItem('cartId')
  }

  const isLoggedIn = computed(() => !!token.value && !!accountId.value)

  return {
    accountId,
    cartId,
    token,
    username,
    email,
    roles,
    isLoggedIn,
    getOrCreateCart,
    addToCartAPI,
    login,
    logout
  }
})