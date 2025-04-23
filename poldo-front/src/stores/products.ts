import { defineStore } from 'pinia'
import { ref } from 'vue'

// Define the product type
export interface Product {
  id: number
  title: string
  description: string
  ingredients: string[]
  imageSrc: string
  price: number
}

export const useProductsStore = defineStore('products', () => {
  // State
  const products = ref<Product[]>([
    {
      id: 1,
      title: "Panino classico",
      description: "Il panino classico con prosciutto, formaggio, lattuga e pomodoro. Perfetto per uno spuntino leggero.",
      ingredients: ['Pane bianco', 'Prosciutto cotto', 'Formaggio Edamer', 'Lattuga', 'Pomodoro', 'Maionese'],
      imageSrc: "https://lh3.googleusercontent.com/a/ACg8ocLPv09a9-uNbEG-ZfRm5bWQUlyLOpBaKxHz88de_c6vB8RvQ_Plrg=s96-c",
      price: 4.50
    },
    {
      id: 2,
      title: "Panino special",
      description: "La nostra specialità con ingredienti premium: salame, mozzarella, rucola e olive. Un gusto ricco e deciso.",
      ingredients: ['Pane integrale', 'Salame Milano', 'Mozzarella di bufala', 'Rucola', 'Olive nere', 'Olio d\'oliva'],
      imageSrc: "https://lh3.googleusercontent.com/a/ACg8ocLPv09a9-uNbEG-ZfRm5bWQUlyLOpBaKxHz88de_c6vB8RvQ_Plrg=s96-c",
      price: 6.00
    },
    {
      id: 3,
      title: "Panino veggie",
      description: "Opzione vegetariana con hummus, avocado, pomodori secchi e germogli. Sano e gustoso.",
      ingredients: ['Pane ai semi', 'Hummus', 'Avocado', 'Pomodori secchi', 'Germogli', 'Peperoni grigliati'],
      imageSrc: "https://lh3.googleusercontent.com/a/ACg8ocLPv09a9-uNbEG-ZfRm5bWQUlyLOpBaKxHz88de_c6vB8RvQ_Plrg=s96-c",
      price: 5.50
    },
    {
      id: 4,
      title: "Panino deluxe",
      description: "Il nostro panino più ricco: roast beef, formaggio cheddar, bacon croccante e salsa barbecue. Per chi non si accontenta.",
      ingredients: ['Pane al sesamo', 'Roast beef', 'Formaggio cheddar', 'Bacon croccante', 'Cipolla caramellata', 'Salsa barbecue'],
      imageSrc: "https://lh3.googleusercontent.com/a/ACg8ocLPv09a9-uNbEG-ZfRm5bWQUlyLOpBaKxHz88de_c6vB8RvQ_Plrg=s96-c",
      price: 7.50
    }
  ])

  return { products }
}, {
  persist: true, // Enable localStorage persistence
})