import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Product {
  id: number
  title: string
  description: string
  ingredients: string[]
  imageSrc: string
  price: number
  tags: string[]
  isActive: boolean
}

const defaultImage = "https://lh3.googleusercontent.com/a/ACg8ocLPv09a9-uNbEG-ZfRm5bWQUlyLOpBaKxHz88de_c6vB8RvQ_Plrg=s96-c"

const fetchProducts = async (): Promise<Product[]> => {
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDksInJ1b2xvIjoic3R1ZGVudGUiLCJpYXQiOjE3NDQzMDc3NjksImV4cCI6MTc3NTg2NTM2OX0.mdqnDVZpEotkEEXMaCj9f-rfYBx_b4WeJr97g3L6MP8"
  const headers = new Headers({
    Authorization: `Bearer ${token}`,
    Accept: 'application/json'
  })

  const response = await fetch('http://figliolo.it:5005/v1/prodotti', { headers })
  if (!response.ok) throw new Error('Network response was not ok')

  const data = await response.json()
  return data.map((item: any) => ({
    id: item.idProdotto,
    title: item.nome,
    description: item.descrizione,
    ingredients: item.ingredienti,
    imageSrc: item.img || defaultImage,
    price: parseFloat(item.prezzo),
    tags: item.tags,
    isActive: item.attivo === 1
  }))
}

export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const allIngredients = ref<string[]>([])
  const allTags = ref<string[]>([])

  const initializeStore = async () => {
    try {
      const fetchedProducts = await fetchProducts()
      products.value = fetchedProducts

      // Aggiorna gli ingredienti
      allIngredients.value = Array.from(
        new Set(fetchedProducts.flatMap(p => p.ingredients))
      )

      // Aggiorna i tags
      allTags.value = Array.from(
        new Set(fetchedProducts.flatMap(p => p.tags))
      )
    } catch (error) {
      console.error('Failed to initialize products store:', error)
      // Gestisci l'errore come preferisci
    }
  }

  // Inizializza lo store automaticamente al creazione
  initializeStore()

  const addProduct = (newProduct: Omit<Product, 'id'>) => {
    const newId = products.value.length > 0
      ? Math.max(...products.value.map(p => p.id)) + 1
      : 1

    products.value.push({
      ...newProduct,
      id: newId
    })

    // Aggiorna le liste filtri
    allIngredients.value = Array.from(
      new Set([...allIngredients.value, ...newProduct.ingredients])
    )
    allTags.value = Array.from(
      new Set([...allTags.value, ...newProduct.tags])
    )
  }

  return {
    products,
    allIngredients,
    allTags,
    addProduct,
    initializeStore
  }
}, { persist: true })
