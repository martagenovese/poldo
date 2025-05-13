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

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

async function handleRequest<T>(
  endpoint: string,
  errorMsg: string,
  init?: RequestInit
): Promise<T> {
  const url = `${API_CONFIG.BASE_URL}/${endpoint}`;
  try {
    const response = await fetch(url, { headers, ...init, mode: 'cors' });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${errorMsg}: ${response.status} — ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    }
    return {} as T;

  } catch (error: any) {
    console.error('Request failed:', error);
    throw new Error(`${errorMsg}: ${error.message}`);
  }
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

  const getProductById = (id: number) => {
    return products.value.find(product => product.id === id)
  }

  return {
    products,
    allIngredients,
    allTags,
    initializeProducts,
    getProductById
  }
})
