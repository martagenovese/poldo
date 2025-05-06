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

export const useCartStore = defineStore(
  'cart',
  () => {
    const turnoStore = useTurnoStore()
    const itemsByTurno = ref<CartByTurno>({})
    turnoStore.turni.forEach((turno) => {
      itemsByTurno.value[turno.n] = []
    })

    async function getOrdineByTurno() {
        const currentTurno = turnoStore.turnoSelezionato
      
        const headers = {
          'Content-Type': 'application/json',
          Authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NTAsInJ1b2xvIjoicGFuaW5hcm8iLCJpYXQiOjE3NDQzMDc2ODgsImV4cCI6MTc3NTg2NTI4OH0.noyJJ5yLRAdZ4bxIOGdlYBjSZQElmXV4KOqGGVJHl_Q',
        }
      
        try {
          const response = await fetch(`http://figliolo.it:5005/v1/ordini/me?nTurno=${currentTurno}`, {
            method: 'GET',
            headers: headers,
          })
      
          if (!response.ok) {
            throw new Error('Network response was not ok')
          }
      
          const data = await response.json()
          const ordine = data[0]
      
          if (!ordine || ordine.prodotti.length === 0) {
            return false
          }
      
          itemsByTurno.value[currentTurno] = ordine.prodotti.map((item: any) => ({
            id: item.idProdotto,
            quantity: item.quantita,
          }))
          return true
        } catch (error) {
          console.error('Error fetching cart:', error)
          return false
        }
      }

    const currentTurno = computed(() => turnoStore.turnoSelezionato)

    function updateQuantity(productId: number, quantity: number) {
      const cart = itemsByTurno.value[currentTurno.value]
      const existingItem = cart.find((item) => item.id === productId)

      if (existingItem) {
        existingItem.quantity += quantity
      } else {
        cart.push({ id: productId, quantity: quantity })
      }
    }

    function removeFromCart(productId: number) {
      itemsByTurno.value[currentTurno.value] = itemsByTurno.value[currentTurno.value].filter(
        (item) => item.id !== productId,
      )
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

    function confirmCart(): string {
      const turno = currentTurno.value
      const cart = itemsByTurno.value[turno]
      if (cart.length === 0) {
        console.error('Carrello vuoto')
        return 'Carrello vuoto'
      }

      const cartData = cart.map((item) => ({
        idProdotto: item.id,
        quantita: item.quantity,
      }))

      const body = {
        nTurno: turno,
        prodotti: cartData,
      }

      console.log('Carrello da confermare:', body)

      const headers = {
        'Content-Type': 'application/json',
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NTAsInJ1b2xvIjoicGFuaW5hcm8iLCJpYXQiOjE3NDQzMDc2ODgsImV4cCI6MTc3NTg2NTI4OH0.noyJJ5yLRAdZ4bxIOGdlYBjSZQElmXV4KOqGGVJHl_Q',
      }
      fetch('http://figliolo.it:5005/v1/ordini', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      })
        .then((response) => {
          return response.json()
        })
        .then((data) => {
          if (data.error) {
            console.error('Errore:', data.error)
            return 'Errore: ' + data.error
          }
          console.log('Carrello confermato:', data)
          clearCart()
        })
      console.log('Carrello confermato:', cartData)
      return 'Carrello confermato'
    }

    return {
      itemsByTurno,
      getItems,
      updateQuantity,
      removeFromCart,
      clearCart,
      clearAllCarts,
      confirmCart,
      getOrdineByTurno
    }
  },
  {
    persist: {
      key: 'cart-storage',
      storage: localStorage,
    },
  },
)
