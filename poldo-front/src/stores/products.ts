// src/stores/products.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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
  BASE_URL: 'http://figliolo.it:5005/v1',
  TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDksInJ1b2xvIjoic3R1ZGVudGUiLCJpYXQiOjE3NDQzMDc3NjksImV4cCI6MTc3NTg2NTM2OX0.mdqnDVZpEotkEEXMaCj9f-rfYBx_b4WeJr97g3L6MP8',
  DEFAULT_IMAGE: 'https://lh3.googleusercontent.com/a/ACg8ocLPv09a9-uNbEG-ZfRm5bWQUlyLOpBaKxHz88de_c6vB8RvQ_Plrg=s96-c'
}

const headers = new Headers({
  Authorization: `Bearer ${API_CONFIG.TOKEN}`,
  Accept: 'application/json',
  'Content-Type': 'application/json'
})

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')         // Sostituisci spazi con -
    .replace(/[^a-z0-9-]/g, '')   // Rimuovi caratteri non alfanumerici
    .replace(/-+/g, '-')          // Sostituisci multipli - con singolo
    .replace(/^-+/, '')           // Rimuovi - dall'inizio
    .replace(/-+$/, '')           // Rimuovi - dalla fine
}

async function handleRequest<T>(
  endpoint: string,
  errorMsg: string,
  init?: RequestInit
): Promise<T> {
  const url = `${API_CONFIG.BASE_URL}/${endpoint}`
  const response = await fetch(url, { headers, ...init, mode: 'cors' })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`${errorMsg}: ${response.status} — ${text}`)
  }
  return await response.json()
}

export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([])

  const allIngredients = computed(() => {
    const ingredients = new Set<string>()
    products.value.forEach(product => {
      product.ingredients.forEach(ing => ingredients.add(ing))
    })
    return Array.from(ingredients)
  })

  const allTags = computed(() => {
    const tags = new Set<string>()
    products.value.forEach(product => {
      product.tags.forEach(tag => tags.add(tag))
    })
    return Array.from(tags)
  })

  const initializeProducts = async () => {
    try {
      const raw = await handleRequest<any[]>(
        'prodotti',
        'Errore fetch prodotti'
      )

      products.value = await Promise.all(raw.map(async (item) => {
        const imageName = sanitizeFileName(item.nome)
        const customImagePath = `/images/products/${imageName}.png`

        // Verifica esistenza immagine
        const imageExists = await checkImageExists(customImagePath)

        return {
          id: item.idProdotto,
          title: item.nome,
          description: item.descrizione,
          ingredients: item.ingredienti,
          imageSrc: imageExists ? customImagePath : API_CONFIG.DEFAULT_IMAGE,
          price: parseFloat(item.prezzo),
          tags: item.tags,
          isActive: item.attivo === 1
        }
      }))
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  async function checkImageExists(url: string): Promise<boolean> {
    try {
      const img = new Image()
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = url
      })
      return true
    } catch {
      return false
    }
  }

  initializeProducts().catch(error =>
    console.error('Auto-initialization error:', error)
  )

  const addProduct = async (newProduct: Omit<Product, 'id'>, imageFile?: File) => {
    try {
      const imageName = sanitizeFileName(newProduct.title)
      const formData = new FormData()

      formData.append('nome', newProduct.title)
      formData.append('descrizione', newProduct.description)
      formData.append('ingredienti', JSON.stringify(newProduct.ingredients))
      formData.append('tags', JSON.stringify(newProduct.tags))
      formData.append('prezzo', newProduct.price.toFixed(2))
      formData.append('attivo', newProduct.isActive ? '1' : '0')

      if (imageFile) {
        formData.append('immagine', imageFile, `${imageName}.png`)
      }

      const data = await handleRequest<{ idProdotto: number }>('prodotti', 'Failed to add product', {
        method: 'POST',
        body: formData
      })

      products.value.push({
        ...newProduct,
        id: data.idProdotto,
        imageSrc: imageFile ? `/images/products/${imageName}.png` : API_CONFIG.DEFAULT_IMAGE
      })

    } catch (error) {
      console.error('Product creation failed:', error)
      throw error
    }
  }

  const updateProduct = async (id: number, updates: Partial<Product>, imageFile?: File) => {
    try {
      const formData = new FormData()
      let newImageName = ''

      if (updates.title) {
        const oldProduct = products.value.find(p => p.id === id)
        if (oldProduct) {
          newImageName = sanitizeFileName(updates.title)
          updates.imageSrc = `/images/products/${newImageName}.png`
          formData.append('img', updates.imageSrc)
        }
      }

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined) return

        let stringValue: string
        switch (key) {
          case 'ingredients':
          case 'tags':
            stringValue = JSON.stringify(value)
            break
          case 'price':
            stringValue = typeof value === 'number' ? value.toFixed(2) : String(value)
            break
          case 'isActive':
            stringValue = value ? '1' : '0'
            break
          default:
            stringValue = String(value)
        }

        formData.append(key, stringValue)
      })

      if (imageFile) {
        const imageName = newImageName || sanitizeFileName(updates.title || '')
        formData.append('immagine', imageFile, `${imageName}.png`)

        updates.imageSrc = `/images/products/${imageName}.png`
      }

      await handleRequest(`prodotti/${id}`, 'Failed to update product', {
        method: 'PUT',
        body: formData
      })

      const index = products.value.findIndex(p => p.id === id)
      if (index !== -1) {
        products.value[index] = {
          ...products.value[index],
          ...updates,
          imageSrc: imageFile ? updates.imageSrc! : products.value[index].imageSrc
        }
      }

    } catch (error) {
      console.error(`Product update failed for ID ${id}:`, error)
      throw error
    }
  }

  const getProductById = (id: number) => {
    return products.value.find(product => product.id === id)
  }

  return {
    products,
    allIngredients,
    allTags,
    initializeProducts,
    addProduct,
    getProductById,
    updateProduct
  }
})
