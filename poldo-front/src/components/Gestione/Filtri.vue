<template>
  <div>
    <div ref="filtriContainer" class="filters-container">
      <div class="filters-content">
        <!-- Sezione Ingredienti -->
        <div class="filter-section">
          <div class="section-header">
            <h4 class="subtitle">Ingredienti</h4>
          </div>
          <div class="inline-list">
            <div v-for="ingredient in visibleIngredients" class="inline-item">
              <div class="editable-wrapper">
                <input type="text" v-model="ingredient.currentName"
                  @blur="updateIngredient(ingredient.originalName, ingredient.currentName)" class="compact-input" />
                <button v-if="hasPendingChange('ingredient', ingredient)" @click="resetFilter('ingredient', ingredient)"
                  class="reset-btn" title="Ripristina">↺</button>
                <div v-if="hasPendingChange('ingredient', ingredient)" class="pending-dot"></div>
              </div>
            </div>
            <div class="add-input compact">
              <input v-model="newIngredient" placeholder="Nuovo..." @keyup.enter="addNewIngredient" />
              <button @click="addNewIngredient">+</button>
            </div>
          </div>
        </div>

        <!-- Sezione Tag -->
        <div class="filter-section">
          <div class="section-header">
            <h4 class="subtitle">Tag</h4>
          </div>
          <div class="inline-list">
            <div v-for="tag in visibleTags" :key="tag.originalName" class="inline-item">
              <div class="editable-wrapper">
                <input type="text" v-model="tag.currentName" @blur="updateTag(tag.originalName, tag.currentName)"
                  class="compact-input" />
                <button v-if="hasPendingChange('tag', tag)" @click="resetFilter('tag', tag)" class="reset-btn"
                  title="Ripristina">↺</button>
                <div v-if="hasPendingChange('tag', tag)" class="pending-dot"></div>
              </div>
            </div>
            <div class="add-input compact">
              <input v-model="newTag" placeholder="Nuovo..." @keyup.enter="addNewTag" />
              <button @click="addNewTag">+</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProductsStore } from '@/stores/products'
import { usePendingChangesStore } from '@/stores/pendingChanges'

const productsStore = useProductsStore()
const pendingChangesStore = usePendingChangesStore()

const isSidebarOpen = ref(false)
const filtriContainer = ref<HTMLElement | null>(null)
const newIngredient = ref('')
const newTag = ref('')

interface PendingItem {
  originalName: string
  currentName: string
}

type ChangeType = 'ingredient' | 'tag'

// Stato locale
const localIngredients = ref<PendingItem[]>([])
const localTags = ref<PendingItem[]>([])

// Computed Properties
const visibleIngredients = computed(() => {
  const deletions = pendingChangesStore.filterChanges
    .filter(c => c.type === 'ingredient' && c.action === 'delete')
    .map(c => c.name)

  return localIngredients.value
    .filter(i => !deletions.includes(i.originalName))
    .concat(
      pendingChangesStore.filterChanges
        .filter(c => c.type === 'ingredient' && c.action === 'create')
        .map(c => ({ originalName: c.name, currentName: c.name }))
    )
})

const visibleTags = computed(() => {
  const deletions = pendingChangesStore.filterChanges
    .filter(c => c.type === 'tag' && c.action === 'delete')
    .map(c => c.name)

  return localTags.value
    .filter(t => !deletions.includes(t.originalName))
    .concat(
      pendingChangesStore.filterChanges
        .filter(c => c.type === 'tag' && c.action === 'create')
        .map(c => ({ originalName: c.name, currentName: c.name }))
    )
})

// Funzioni
const hasPendingChange = (
  type: ChangeType,
  item: PendingItem
): boolean => {
  return pendingChangesStore.filterChanges.some(change => {
    if (change.type !== type) return false

    if (change.action === 'update') {
      return change.name === item.originalName ||
        change.newName === item.currentName
    }

    return change.name === item.currentName ||
      change.name === item.originalName
  })
}

onMounted(async () => {
  await productsStore.initializeStore()
  initLocalState()
})

const initLocalState = () => {
  localIngredients.value = productsStore.allIngredients.map(name => ({
    originalName: name,
    currentName: name
  }))
  localTags.value = productsStore.allTags.map(name => ({
    originalName: name,
    currentName: name
  }))
}

// Le computed properties e le funzioni rimangono invariate tranne:
const addNewIngredient = () => {
  if (newIngredient.value.trim()) {
    pendingChangesStore.addFilterChange({
      type: 'ingredient',
      action: 'create',
      name: newIngredient.value.trim()
    })
    newIngredient.value = ''
    productsStore.refreshLists() // Aggiunto refresh delle liste
  }
}

const addNewTag = () => {
  if (newTag.value.trim()) {
    pendingChangesStore.addFilterChange({
      type: 'tag',
      action: 'create',
      name: newTag.value.trim()
    })
    newTag.value = ''
    productsStore.refreshLists() // Aggiunto refresh delle liste
  }
}

const updateIngredient = (oldVal: string, newVal: string) => {
  const name = newVal.trim()
  if (name && name !== oldVal) {
    // se è cambiato, (ri)aggiungo la change
    pendingChangesStore.addFilterChange({
      type: 'ingredient',
      action: 'update',
      name: oldVal,
      newName: name
    })
  } else if (name === oldVal) {
    // se è stato riportato al valore originale, tolgo la change
    pendingChangesStore.removeFilterChange({ type: 'ingredient', name: oldVal })
  }
}

const updateTag = (oldVal: string, newVal: string) => {
  const name = newVal.trim()
  if (name && name !== oldVal) {
    pendingChangesStore.addFilterChange({
      type: 'tag',
      action: 'update',
      name: oldVal,
      newName: name
    })
  } else if (name === oldVal) {
    pendingChangesStore.removeFilterChange({ type: 'tag', name: oldVal })
  }
}

const resetFilter = (type: ChangeType, item: PendingItem) => {
  item.currentName = item.originalName
  pendingChangesStore.removeFilterChange({ type, name: item.originalName })
}


const handleOutsideClick = (event: Event) => {
  if (filtriContainer.value && !filtriContainer.value.contains(event.target as Node)) {
    isSidebarOpen.value = false
  }
}
</script>

<style scoped>
.subtitle {
  color: var(--poldo-primary);
  font-size: 1.1rem;
  margin: 0;
  padding-bottom: 0.5rem;
}

.filter-section {
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 20px;
}

.filter-content {
  height: 100%;
  overflow-y: auto;
  padding: 1rem;
}

.filters-container {
  background: var(--color-background-soft);
  border-radius: 12px;
  padding: 20px;
}

.inline-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
}

.inline-item {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--color-background);
  border-radius: 20px;
  padding: 4px 8px;
  border: 1px solid var(--color-border);
}

.editable-wrapper {
  position: relative;
}

.compact-input {
  width: 120px;
  padding: 4px 8px;
  border: none;
  background: transparent;
  font-size: 0.9rem;
}

.pending-dot {
  position: absolute;
  top: -4px;
  left: -8px;
  width: 10px;
  height: 10px;
  background-color: #2196F3;
  border-radius: 50%;
}

.add-input.compact {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.add-input.compact input {
  width: 120px;
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  font-size: 0.9rem;
}

.add-input.compact button {
  padding: 0 12px;
  background: var(--poldo-green);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.reset-controls {
  margin-bottom: 1rem;
  text-align: right;
}

.reset-btn {
  background: none;
  border: none;
  color: var(--poldo-primary);
  cursor: pointer;
  margin-left: 0.5rem;
  padding: 0 0.3rem;
  font-size: 0.9em;
}

.reset-btn:hover {
  color: var(--poldo-accent);
}

/* Scrollbar styling */
.filters-content::-webkit-scrollbar {
  width: 6px;
}

.filters-content::-webkit-scrollbar-track {
  background: var(--color-background-soft);
}

.filters-content::-webkit-scrollbar-thumb {
  background: var(--poldo-primary);
  border-radius: 4px;
}
</style>
