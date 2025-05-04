import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PiniaPluginContext } from 'pinia'

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

const API_CONFIG = {
  BASE_URL: '/api',
  TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDksInJ1b2xvIjoic3R1ZGVudGUiLCJpYXQiOjE3NDQzMDc3NjksImV4cCI6MTc3NTg2NTM2OX0.mdqnDVZpEotkEEXMaCj9f-rfYBx_b4WeJr97g3L6MP8",
  DEFAULT_IMAGE: "https://lh3.googleusercontent.com/a/ACg8ocLPv09a9-uNbEG-ZfRm5bWQUlyLOpBaKxHz88de_c6vB8RvQ_Plrg=s96-c"
}

const headers = new Headers({
  Authorization: `Bearer ${API_CONFIG.TOKEN}`,
  Accept: 'application/json',
  'Content-Type': 'application/json'
})

const parseProduct = (item: any): Product => ({
  id: item.idProdotto,
  title: item.nome,
  description: item.descrizione,
  ingredients: item.ingredienti,
  imageSrc: item.img || API_CONFIG.DEFAULT_IMAGE,
  price: parseFloat(item.prezzo),
  tags: item.tags,
  isActive: item.attivo === 1
})

const handleRequest = async <T>(endpoint: string, errorMsg: string, init?: RequestInit): Promise<T> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/${endpoint}`, {
      ...init,
      headers,
      mode: 'cors'
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`${errorMsg}: ${response.status} - ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('API Error:', error)
    throw new Error(errorMsg)
  }
}

export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const allIngredients = ref<string[]>([])
  const allTags = ref<string[]>([])

  // Azioni principali
  const initializeStore = async () => {
    try {
      const [productsData, ingredientsData, tagsData] = await Promise.all([
        handleRequest<Product[]>('prodotti', 'Failed to fetch products'),
        handleRequest<string[]>('ingredienti', 'Failed to fetch ingredients'),
        handleRequest<string[]>('tags', 'Failed to fetch tags')
      ])

      products.value = productsData.map(parseProduct)
      allIngredients.value = ingredientsData
      allTags.value = tagsData
    } catch (error) {
      console.error('Store initialization failed:', error)
      throw error
    }
  }

  // Chiamata automatica all'inizializzazione
  initializeStore().catch(error =>
    console.error('Auto-initialization error:', error)
  )

  const refreshLists = async () => {
    try {
      const [ingredients, tags] = await Promise.all([
        handleRequest<string[]>('ingredienti', 'Failed to refresh ingredients'),
        handleRequest<string[]>('tags', 'Failed to refresh tags')
      ])

      allIngredients.value = ingredients
      allTags.value = tags
    } catch (error) {
      console.error('Failed to refresh lists:', error)
      throw error
    }
  }

  // CRUD Operations
  const addProduct = async (newProduct: Omit<Product, 'id'>) => {
    try {
      const data = await handleRequest<{ idProdotto: number }>('prodotti', 'Failed to add product', {
        method: 'POST',
        body: JSON.stringify({
          nome: newProduct.title,
          descrizione: newProduct.description,
          ingredienti: newProduct.ingredients,
          img: newProduct.imageSrc,
          prezzo: newProduct.price.toFixed(2),
          tags: newProduct.tags,
          attivo: newProduct.isActive ? 1 : 0
        })
      })

      products.value.push({ ...newProduct, id: data.idProdotto })
      await refreshLists()
    } catch (error) {
      console.error('Product creation failed:', error)
      throw error
    }
  }

  const updateProduct = async (id: number, updates: Partial<Product>) => {
    try {
      await handleRequest(`prodotti/${id}`, 'Failed to update product', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })

      const index = products.value.findIndex(p => p.id === id)
      if (index !== -1) {
        products.value[index] = { ...products.value[index], ...updates }
      }
    } catch (error) {
      console.error(`Product update failed for ID ${id}:`, error)
      throw error
    }
  }

  return {
    products,
    allIngredients,
    allTags,
    initializeStore,
    addProduct,
    updateProduct,
    refreshLists
  }
}, {
  persist: {
    key: 'productsStore',
    storage: localStorage,
    paths: ['products', 'allIngredients', 'allTags'] as const,
    afterRestore: (ctx: PiniaPluginContext) => {
      ctx.store.initializeStore().catch((error: Error) => {
        console.error('Failed to restore store:', error)
      })
    }
  }
})
