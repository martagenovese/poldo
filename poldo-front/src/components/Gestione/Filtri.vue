<template>
  <div>
    <button class="filtri-btn" @click="toggleSidebar">
      <span>Filtri</span>
    </button>

    <div ref="filtriContainer" class="sidebar" :class="{ open: isSidebarOpen }">
      <div class="sidebar-content">
        <div class="sidebar-header">
          <h3>Gestione Ingredienti e Tag</h3>
          <button class="close-btn" @click="toggleSidebar">×</button>
        </div>

        <!-- Sezione Ingredienti -->
        <div class="filter-section">
          <div class="section-header">
            <h4 class="subtitle">Ingredienti</h4>
            <div class="add-input compact">
              <input
                v-model="newIngredient"
                placeholder="Nuovo..."
                @keyup.enter="addNewIngredient"
              />
              <button @click="addNewIngredient">+</button>
            </div>
          </div>
          <div class="inline-list">
            <div
              v-for="ingredient in visibleIngredients"
              :key="ingredient.originalName"
              class="inline-item"
            >
              <div class="editable-wrapper">
                <input
                  type="text"
                  v-model="ingredient.currentName"
                  @blur="updateIngredient(ingredient.originalName, ingredient.currentName)"
                  class="compact-input"
                />
                <div v-if="hasPendingChange('ingredient', ingredient)" class="pending-dot"></div>
              </div>
              <button
                class="delete-btn"
                @click="deleteIngredient(ingredient.originalName)"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <!-- Sezione Tag -->
        <div class="filter-section">
          <div class="section-header">
            <h4 class="subtitle">Tag</h4>
            <div class="add-input compact">
              <input
                v-model="newTag"
                placeholder="Nuovo..."
                @keyup.enter="addNewTag"
              />
              <button @click="addNewTag">+</button>
            </div>
          </div>
          <div class="inline-list">
            <div
              v-for="tag in visibleTags"
              :key="tag.originalName"
              class="inline-item"
            >
              <div class="editable-wrapper">
                <input
                  type="text"
                  v-model="tag.currentName"
                  @blur="updateTag(tag.originalName, tag.currentName)"
                  class="compact-input"
                />
                <div v-if="hasPendingChange('tag', tag)" class="pending-dot"></div>
              </div>
              <button
                class="delete-btn"
                @click="deleteTag(tag.originalName)"
              >
                ×
              </button>
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
  if (newVal.trim() && newVal !== oldVal) {
    pendingChangesStore.addFilterChange({
      type: 'ingredient',
      action: 'update',
      name: oldVal,
      newName: newVal.trim()
    })
  }
}

const updateTag = (oldVal: string, newVal: string) => {
  if (newVal.trim() && newVal !== oldVal) {
    pendingChangesStore.addFilterChange({
      type: 'tag',
      action: 'update',
      name: oldVal,
      newName: newVal.trim()
    })
  }
}

const deleteIngredient = (name: string) => {
  pendingChangesStore.addFilterChange({
    type: 'ingredient',
    action: 'delete',
    name: name
  })
}

const deleteTag = (name: string) => {
  pendingChangesStore.addFilterChange({
    type: 'tag',
    action: 'delete',
    name: name
  })
}

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const handleOutsideClick = (event: Event) => {
  if (filtriContainer.value && !filtriContainer.value.contains(event.target as Node)) {
    isSidebarOpen.value = false
  }
}
</script>

<style scoped>
.filtri-btn {
  position: fixed;
  top: 205px;
  left: -16px;
  background-color: var(--poldo-primary);
  color: white;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  border-radius: 0px 0px 10px 10px;
  font-size: 16px;
  transition: transform 0.3s ease;
  transform: translateX(0) rotate(-90deg);
  z-index: 999;
}

.sidebar {
  position: fixed;
  top: 105px;
  left: 0;
  width: 260px;
  height: calc(95% - 110px);
  background: var(--color-background-soft);
  box-shadow: 5px 0 5px var(--poldo-card-shadow);
  z-index: 1000;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  border-radius: 0 20px 20px 0;
  overflow: hidden;
}

.sidebar.open {
  transform: translateX(0);
}

.sidebar-content {
  height: 100%;
  overflow-y: auto;
  padding: 1rem;
}

.close-btn {
  background-color: var(--poldo-primary);
  position: absolute;
  top: -5px;
  right: -5px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  color: var(--poldo-text);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.subtitle {
  color: var(--poldo-primary);
  font-size: 1.1rem;
  margin: 0;
  padding-bottom: 0.5rem;
}

.filter-section {
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
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
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
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

.delete-btn {
  background: none;
  border: none;
  color: var(--poldo-red);
  cursor: pointer;
  padding: 0 4px;
  font-size: 16px;
  line-height: 1;
}

/* Scrollbar styling */
.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: var(--color-background-soft);
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: var(--poldo-primary);
  border-radius: 4px;
}
</style>
