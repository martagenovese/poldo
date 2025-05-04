import { defineStore } from 'pinia'

type ProductChange = {
  title: string
  price: number
  description: string
  ingredients: string[]
}

type FilterChange = {
  type: 'ingredient' | 'tag'
  action: 'create' | 'update' | 'delete'
  name: string
  newName?: string
}

export const usePendingChangesStore = defineStore('pendingChanges', {
  state: () => ({
    productChanges: {} as Record<number, ProductChange>,
    filterChanges: [] as FilterChange[]
  }),

  actions: {
    // Per i prodotti
    addProductChange(id: number, data: ProductChange) {
      this.productChanges[id] = data
    },

    removeProductChange(id: number) {
      delete this.productChanges[id]
    },

    // Per ingredienti/tag
    addFilterChange(change: FilterChange) {
      this.filterChanges.push(change)
    },

    removeFilterChange(index: number) {
      this.filterChanges.splice(index, 1)
    },

    clearAllChanges() {
      this.productChanges = {}
      this.filterChanges = []
    }
  },

  getters: {
    hasProductChange: (state) => (id: number) => id in state.productChanges,

    hasSettingChange: (state) => (name: string) =>
      state.filterChanges.some(change =>
        change.name === name || change.newName === name
      )
  }
})
