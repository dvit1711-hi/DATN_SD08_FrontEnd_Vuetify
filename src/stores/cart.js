import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const cartItems = ref([])
  const cartTotal = ref(0)

  // Add item to cart
  const addToCart = (product, selectedColor, quantity = 1) => {
    const cartItem = {
      productID: product.productID,
      productName: product.productName,
      price: product.price,
      quantity: quantity,
      selectedColor: selectedColor,
      image: selectedColor?.images?.[0] || product.mainImage,
      addedAt: new Date().toISOString()
    }

    // Check if product with same color already exists
    const existingItem = cartItems.value.find(
      item =>
        item.productID === product.productID &&
        item.selectedColor?.productColorID === selectedColor?.productColorID
    )

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      cartItems.value.push(cartItem)
    }

    updateTotal()
  }

  // Remove item from cart
  const removeFromCart = (productID, colorID) => {
    cartItems.value = cartItems.value.filter(
      item =>
        !(item.productID === productID && item.selectedColor?.productColorID === colorID)
    )
    updateTotal()
  }

  // Update quantity
  const updateQuantity = (productID, colorID, quantity) => {
    const item = cartItems.value.find(
      item =>
        item.productID === productID && item.selectedColor?.productColorID === colorID
    )
    if (item) {
      item.quantity = Math.max(1, quantity)
      updateTotal()
    }
  }

  // Update total price
  const updateTotal = () => {
    cartTotal.value = cartItems.value.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
  }

  // Clear cart
  const clearCart = () => {
    cartItems.value = []
    cartTotal.value = 0
  }

  // Get cart count
  const getCartCount = () => {
    return cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
  }

  return {
    cartItems,
    cartTotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateTotal,
    clearCart,
    getCartCount
  }
})
