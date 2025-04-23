import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Define the cart item type
export interface CartItem {
  id: number
  title: string
  description?: string
  ingredients?: string[]
  imageSrc: string
  quantity: number
  price: number
}

export const useCartStore = defineStore('cart', () => {
  // State
  const items = ref<CartItem[]>([])
  
  // Getters
  const totalItems = computed(() => {
    return items.value.reduce((total, item) => total + item.quantity, 0)
  })
  
  const totalUniqueItems = computed(() => {
    return items.value.length
  })
  
  const totalPrice = computed(() => {
    return items.value.reduce((total, item) => total + (item.price * item.quantity), 0)
  })
  
  // Actions
  function addToCart(product: Omit<CartItem, 'quantity'>, quantity: number) {
    // Check if the product already exists in the cart
    const existingItem = items.value.find(item => item.id === product.id)
    
    if (existingItem) {
      // Update the quantity
      existingItem.quantity += quantity
    } else {
      // Add new item
      items.value.push({
        ...product,
        quantity
      })
    }
  }
  
  function updateQuantity(productId: number, quantity: number) {
    const item = items.value.find(item => item.id === productId)
    if (item) {
      item.quantity = quantity
    }
  }
  
  function removeFromCart(productId: number) {
    items.value = items.value.filter(item => item.id !== productId)
  }
  
  function clearCart() {
    items.value = []
  }
  
  return { 
    items, 
    totalItems, 
    totalUniqueItems,
    totalPrice,
    addToCart, 
    updateQuantity, 
    removeFromCart, 
    clearCart 
  }
}, {
  persist: true,
})