<script setup lang="ts">
import { ref, computed, onMounted, nextTick, type ComponentPublicInstance } from 'vue'
import type { PropType } from 'vue'
import { useProductsStore } from '@/stores/products'
import { useFiltersStore } from '@/stores/filters'
import { usePendingChangesStore } from '@/stores/pendingChanges'
import IconEdit from '@/components/icons/IconEdit.vue'

defineProps({
  usedIngredients: {
    type: Array as PropType<string[]>,
    required: true
  },
  usedTags: {
    type: Array as PropType<string[]>,
    required: true
  }
})

const productsStore = useProductsStore()
const filtersStore = useFiltersStore()
const pendingChangesStore = usePendingChangesStore()

const filtriContainer = ref<HTMLElement | null>(null)
const newIngredient = ref('')
const newTag = ref('')

// Riferimenti agli input, per il focus
const ingredientRefs = new Map<string, Element>()
const tagRefs = new Map<string, Element>()

interface PendingItem {
  originalName: string
  currentName: string
  editing: boolean
}

type ChangeType = 'ingredient' | 'tag'

// Stato locale
const localIngredients = ref<PendingItem[]>([])
const localTags = ref<PendingItem[]>([])

const visibleIngredients = computed(() => {
  const deletions = pendingChangesStore.filterChanges
    .filter(c => c.type === 'ingredient' && c.action === 'delete')
    .map(c => c.name)

  const filteredLocal = localIngredients.value
    .filter(i => !deletions.includes(i.originalName))

  const newCreations = pendingChangesStore.filterChanges
    .filter(c => c.type === 'ingredient' && c.action === 'create')
    .map(c => ({
      originalName: c.name,
      currentName: c.name,
      editing: false
    }))

  return [...filteredLocal, ...newCreations]
    .sort((a, b) => a.currentName.localeCompare(b.currentName))
})

const visibleTags = computed(() => {
  const deletions = pendingChangesStore.filterChanges
    .filter(c => c.type === 'tag' && c.action === 'delete')
    .map(c => c.name)

  const filteredLocal = localTags.value
    .filter(t => !deletions.includes(t.originalName))

  const newCreations = pendingChangesStore.filterChanges
    .filter(c => c.type === 'tag' && c.action === 'create')
    .map(c => ({
      originalName: c.name,
      currentName: c.name,
      editing: false
    }))

  return [...filteredLocal, ...newCreations]
    .sort((a, b) => a.currentName.localeCompare(b.currentName))
})

const hasPendingChange = (
  type: ChangeType,
  item: PendingItem
): boolean => {
  return pendingChangesStore.filterChanges.some(change => {
    if (change.type !== type) return false

    if (change.action === 'update') {
      return (
        change.name === item.originalName ||
        change.newName === item.currentName
      )
    }

    return (
      change.name === item.currentName ||
      change.name === item.originalName
    )
  })
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    productsStore.initializeProducts(),
    filtersStore.initializeFilters()
  ])
  initLocalState()
})

const initLocalState = () => {
  localIngredients.value = filtersStore.allIngredients.map(name => ({
    originalName: name,
    currentName: name,
    editing: false
  }))
  localTags.value = filtersStore.allTags.map(name => ({
    originalName: name,
    currentName: name,
    editing: false
  }))
}

// Metodi di utilità per i ref (firma corretta per Vue 3)
const setIngredientRef = (item: PendingItem) =>
  (el: Element | ComponentPublicInstance | null, _refs?: Record<string, any>) => {
    if (el instanceof Element) {
      ingredientRefs.set(item.originalName, el)
    }
  }

const setTagRef = (item: PendingItem) =>
  (el: Element | ComponentPublicInstance | null, _refs?: Record<string, any>) => {
    if (el instanceof Element) {
      tagRefs.set(item.originalName, el)
    }
  }

const startEditing = async (
  type: ChangeType,
  item: PendingItem
) => {
  item.editing = true
  await nextTick()
  const refMap = type === 'ingredient' ? ingredientRefs : tagRefs
  const el = refMap.get(item.originalName)
  if (el) (el as HTMLElement).focus()
}

const onIngredientBlur = (item: PendingItem) => {
  item.editing = false
  updateIngredient(item.originalName, item.currentName)
}

const onTagBlur = (item: PendingItem) => {
  item.editing = false
  updateTag(item.originalName, item.currentName)
}

const addNewIngredient = () => {
  if (newIngredient.value.trim()) {
    pendingChangesStore.addFilterChange({
      type: 'ingredient',
      action: 'create',
      name: newIngredient.value.trim()
    })
    newIngredient.value = ''
    filtersStore.fetchIngredients()
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
    filtersStore.fetchTags()
  }
}

const updateIngredient = (oldVal: string, newVal: string) => {
  const name = newVal.trim()
  if (name && name !== oldVal) {
    pendingChangesStore.addFilterChange({
      type: 'ingredient',
      action: 'update',
      name: oldVal,
      newName: name
    })
  } else if (name === oldVal) {
    pendingChangesStore.removeFilterChange({
      type: 'ingredient',
      name: oldVal
    })
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
    pendingChangesStore.removeFilterChange({
      type: 'tag',
      name: oldVal
    })
  }
}

const resetFilter = (
  type: ChangeType,
  item: PendingItem
) => {
  item.currentName = item.originalName
  item.editing = false
  pendingChangesStore.removeFilterChange({
    type,
    name: item.originalName
  })
}
</script>

<template>
  <div>
    <div class="filters-content">
      <!-- Sezione Ingredienti -->
      <div class="filter-section">
        <div class="section-header">
          <h4 class="subtitle">Ingredienti</h4>
        </div>
        <div class="inline-list">
          <div v-for="ingredient in visibleIngredients" :key="ingredient.originalName" class="inline-item"
            :class="{ 'not-used': !usedIngredients.includes(ingredient.originalName) }">
            <div class="editable-wrapper">
              <input type="text" v-model="ingredient.currentName" :readonly="!ingredient.editing"
                @blur="onIngredientBlur(ingredient)" class="compact-input" :ref="setIngredientRef(ingredient)" />
              <button v-if="!ingredient.editing" @click="startEditing('ingredient', ingredient)" class="edit-btn"
                title="Modifica"><IconEdit /></button>
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
          <div v-for="tag in visibleTags" :key="tag.originalName" class="inline-item"
            :class="{ 'not-used': !usedTags.includes(tag.originalName) }">
            <div class="editable-wrapper">
              <input type="text" v-model="tag.currentName" :readonly="!tag.editing" @blur="onTagBlur(tag)"
                class="compact-input" :ref="setTagRef(tag)" />
              <button v-if="!tag.editing" @click="startEditing('tag', tag)" class="edit-btn" title="Modifica"><IconEdit /></button>
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
</template>

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

.filters-content {
  height: 100%;
  overflow-y: auto;
  align-content: center;
  background: var(--color-background-soft);
  border-radius: 12px;
  padding: 20px;
}

.inline-list {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
}

.inline-item {
  position: relative;
  padding-right: 32px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--color-background);
  border-radius: 20px;
  padding: 4px 8px;
  border: 1px solid var(--color-border);
}

.inline-item.not-used {
  opacity: 0.7;
  background-color: var(--color-background-mute);
}

.inline-item.not-used input {
  color: var(--color-text-mute);
}

.editable-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.compact-input {
  width: 120px;
  padding: 4px 8px;
  border: none;
  background: transparent;
  font-size: 0.9rem;
}

.edit-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: var(--poldo-text);
}

.pending-dot {
  position: absolute;
  top: 0px;
  left: 0px;
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

.reset-btn {
  position: absolute;
  right: 0;
  transform: translateX(100%);
  top: 50%;
  transform: translate(100%, -50%);
  margin: 0;
  background: none;
  border: none;
  color: var(--poldo-primary);
  cursor: pointer;
  font-size: 1.25rem;
  font-weight: bold;
  padding: 0;
}

.reset-btn:hover {
  color: var(--poldo-accent);
}

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
