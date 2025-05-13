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
  BASE_URL: 'http://localhost:5000/v1',
  TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZEdlc3Rpb25lIjoxLCJydW9sbyI6Imdlc3RvcmUiLCJpZCI6MTksImlhdCI6MTc0NDMwNzg0MiwiZXhwIjoxNzc1ODY1NDQyfQ.HMNTe1h81A80p-BawzVj44zSBGBVMYZRdp_vDxE2j9k',
  DEFAULT_IMAGE: 'https://lh3.googleusercontent.com/a/ACg8ocLPv09a9-uNbEG-ZfRm5bWQUlyLOpBaKxHz88de_c6vB8RvQ_Plrg=s96-c'
}

const headers = new Headers({
  Authorization: `Bearer ${API_CONFIG.TOKEN}`,
  Accept: 'application/json',
  'Content-Type': 'application/json'
})

export const useGestioneProductsStore = defineStore('gestioneProducts', () => {
  // Stato
  const products = ref<Product[]>([])

  // Getter
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

  // Metodi
  const getProductById = (id: number) => {
    return products.value.find(product => product.id === id)
  }

  function sanitizeFileName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '')
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

  const initializeProducts = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/prodotti/all`, { headers })
      const raw = await response.json()

      products.value = await Promise.all(raw.map(async (item) => {
        const imageName = sanitizeFileName(item.nome)
        const customImagePath = `/images/products/${imageName}.png`

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

  const addProduct = async (newProduct: Omit<Product, 'id'>) => {
    try {
      const payload = {
        nome: newProduct.title,
        descrizione: newProduct.description,
        ingredienti: newProduct.ingredients,
        tags: newProduct.tags,
        prezzo: newProduct.price.toFixed(2),
        attivo: newProduct.isActive ? '1' : '0'
      }

      const data = await fetch(`${API_CONFIG.BASE_URL}/prodotti`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      }).then(res => res.json())

      products.value.push({
        ...newProduct,
        id: data.idProdotto,
        imageSrc: API_CONFIG.DEFAULT_IMAGE
      })

    } catch (error) {
      console.error('Product creation failed:', error)
      throw error
    }
  }

  const updateProduct = async (id: number, updates: Partial<Product>) => {
    try {
      const payload: Record<string, any> = {}

      if (updates.title !== undefined) {
        payload.nome = updates.title
      }

      if (updates.description !== undefined) {
        payload.descrizione = updates.description
      }

      if (updates.price !== undefined) {
        payload.prezzo = updates.price.toFixed(2)
      }

      if (updates.tags !== undefined) {
        payload.tags = updates.tags
      }

      if (updates.ingredients !== undefined) {
        payload.ingredienti = updates.ingredients
      }

      if (updates.isActive !== undefined) {
        payload.attivo = updates.isActive ? 1 : 0
      }

      await fetch(`${API_CONFIG.BASE_URL}/prodotti/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload)
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
    getProductById,
    initializeProducts,
    addProduct,
    updateProduct
  }
})
