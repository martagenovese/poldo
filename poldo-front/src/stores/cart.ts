import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useTurnoStore } from './turno'

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

// Interface for the cart structure by turno
interface CartByTurno {
  [turno: string]: CartItem[]
}

export const useCartStore = defineStore('cart', () => {
  const itemsByTurno = ref<CartByTurno>({
    primo: [],
    secondo: []
  })
  
  
  const turnoStore = useTurnoStore()
  
  // Get the current cart items based on selected turno
  const items = computed(() => {
    const turno = turnoStore.turnoSelezionato || 'primo'
    return itemsByTurno.value[turno] || []
  })
  
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
    const turno = turnoStore.turnoSelezionato || 'primo'
    
    // Ensure the turno exists in the map
    if (!itemsByTurno.value[turno]) {
      itemsByTurno.value[turno] = []
    }
    
    // Check if the product already exists in the current turno's cart
    const existingItem = itemsByTurno.value[turno].find(item => item.id === product.id)
    
    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      itemsByTurno.value[turno].push({
        ...product,
        quantity
      })
    }
  }
  
  function updateQuantity(productId: number, quantity: number) {
    const turno = turnoStore.turnoSelezionato || 'primo'
    
    if (!itemsByTurno.value[turno]) {
      return
    }
    
    const item = itemsByTurno.value[turno].find(item => item.id === productId)
    if (item) {
      item.quantity = quantity
    }
  }
  
  function removeFromCart(productId: number) {
    const turno = turnoStore.turnoSelezionato || 'primo'
    
    if (!itemsByTurno.value[turno]) {
      return
    }
    
    itemsByTurno.value[turno] = itemsByTurno.value[turno].filter(item => item.id !== productId)
  }
  
  function clearCart() {
    const turno = turnoStore.turnoSelezionato || 'primo'
    itemsByTurno.value[turno] = []
  }
  
  // Clear all carts across all turni
  function clearAllCarts() {
    itemsByTurno.value = {
      primo: [],
      secondo: []
    }
  }
  
  return { 
    items, 
    totalItems, 
    totalUniqueItems,
    totalPrice,
    addToCart, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    clearAllCarts
  }
}, {
  persist: true,
})