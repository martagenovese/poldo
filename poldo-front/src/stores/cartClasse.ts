import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useTurnoStore } from './turno'

interface CartItem {
  id: number
  quantity: number
}

interface User {
  id: number
  nome: string
}

interface Ordine {
  idOrdine: number
  user: User
  prodotti: CartItem[]
}

interface OrdineClasse {
  nTurno: number
  ordine: Ordine[]
}

export const useCartClasseStore = defineStore('cartClasse', () => {
  const turnoStore = useTurnoStore()
  const currentTurno = computed(() => turnoStore.turnoSelezionato)

  async function getOrdine(): Promise<OrdineClasse | false> {
    const headers = {
      'Content-Type': 'application/json',
      Authorization:
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NTAsInJ1b2xvIjoicGFuaW5hcm8iLCJpYXQiOjE3NDQzMDc2ODgsImV4cCI6MTc3NTg2NTI4OH0.noyJJ5yLRAdZ4bxIOGdlYBjSZQElmXV4KOqGGVJHl_Q',
    }

    try {
      const response = await fetch(
        `http://localhost:5005/v1/ordini/classi/me/oggi?nTurno=${currentTurno.value}`,
        { method: 'GET', headers }
      )
      if (!response.ok) throw new Error('Network response was not ok')
      const data = await response.json()
      console.log('Data:', data)
      return data
    } catch (error) {
      console.error('Error fetching cart:', error)
      return false
    }
  }

  return {
    getOrdine,
  }
})
