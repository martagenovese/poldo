import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useTurnoStore } from './turno'

export interface CartItem {
  id: number
  title: string
  description?: string
  ingredients?: string[]
  imageSrc: string
  quantity: number
  price: number
}

interface CartByTurno {
  [turno: string]: CartItem[]
}

export const useCartStore = defineStore('cart', () => {
  const turnoStore = useTurnoStore()
  const itemsByTurno = ref<CartByTurno>({ primo: [], secondo: [] })

  // Getter per gli elementi del carrello corrente
  const items = computed(() => {
    const currentTurno = turnoStore.turnoSelezionato || 'primo'
    return itemsByTurno.value[currentTurno] || []
  })

  // Calcoli derivati
  const totalItems = computed(() => items.value.reduce((acc, item) => acc + item.quantity, 0))
  const totalUniqueItems = computed(() => items.value.length)
  const totalPrice = computed(() => items.value.reduce((acc, item) => acc + (item.price * item.quantity), 0))

  // Azioni principali
  function addToCart(product: Omit<CartItem, 'quantity'>, quantity: number) {
    const currentTurno = turnoStore.turnoSelezionato || 'primo'
    const cart = itemsByTurno.value[currentTurno]
    const existingItem = cart.find(item => item.id === product.id)

    existingItem
      ? existingItem.quantity += quantity
      : cart.push({ ...product, quantity })
  }

  function updateQuantity(productId: number, quantity: number) {
    const currentTurno = turnoStore.turnoSelezionato || 'primo'
    const item = itemsByTurno.value[currentTurno].find(item => item.id === productId)
    if (item) item.quantity = quantity
  }

  function removeFromCart(productId: number) {
    const currentTurno = turnoStore.turnoSelezionato || 'primo'
    itemsByTurno.value[currentTurno] = itemsByTurno.value[currentTurno].filter(item => item.id !== productId)
  }

  // Funzioni di pulizia
  const clearCart = () => {
    const currentTurno = turnoStore.turnoSelezionato || 'primo'
    itemsByTurno.value[currentTurno] = []
  }

  const clearAllCarts = () => {
    itemsByTurno.value = { primo: [], secondo: [] }
  }

  return {
    itemsByTurno,
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
  persist: true
})
