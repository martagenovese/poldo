import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useTurnoStore } from './turno'

interface CartItem {
  idProdotto: number
  quantita: number
  prezzo: number
  nome: string
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
        `http://figliolo.it:5005/v1/ordini/classi/me/oggi?nTurno=${currentTurno.value}`,
        { method: 'GET', headers }
      )
  
      if (!response.ok) throw new Error('Network response was not ok')
  
      const rawData = await response.json()
      console.log('rawData', rawData)
  
      const parsed: OrdineClasse = {
        nTurno: currentTurno.value,
        ordine: rawData.map((o: any): Ordine => ({
          idOrdine: o.idOrdine,
          user: {
            id: o.user.id,
            nome: o.user.nome,
          },
          prodotti: o.prodotti.map((p: any): CartItem => ({
            idProdotto: p.idProdotto,
            quantita: p.quantita,
            prezzo: p.prezzo,
            nome: p.nome,
          })),
        })),
      }
      console.log('parsed', parsed)
      return parsed
    } catch (error) {
      console.error('Error fetching cart:', error)
      return false
    }
  }
  

  return {
    getOrdine,
  }
})
