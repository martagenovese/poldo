import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useTurnoStore } from './turno'

export interface CartItem {
  id: number
  quantity: number
}

interface CartByTurno {
  [turno: string]: CartItem[]
}

export const useCartStore = defineStore('cart', () => {
  const turnoStore = useTurnoStore()
  const itemsByTurno = ref<CartByTurno>({ primo: [], secondo: [] })

  const currentTurno = computed(() => turnoStore.turnoSelezionato || 'primo')

  function updateQuantity(productId: number, quantity: number) {
    const cart = itemsByTurno.value[currentTurno.value]
    const existingItem = cart.find(item => item.id === productId)

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      cart.push({ id: productId, quantity: quantity })
    }
  }

  function removeFromCart(productId: number) {
    itemsByTurno.value[currentTurno.value] = itemsByTurno.value[currentTurno.value].filter(item => item.id !== productId)
  }

  function clearCart() {
    itemsByTurno.value[currentTurno.value] = []
  }

  function clearAllCarts() {
    itemsByTurno.value = { primo: [], secondo: [] }
  }

  function getItems() {
    return itemsByTurno.value[currentTurno.value]
  }

  return {
    itemsByTurno,
    getItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    clearAllCarts
  }
}, {
  persist: {
    key: 'cart-storage',
    storage: localStorage,
  }
})