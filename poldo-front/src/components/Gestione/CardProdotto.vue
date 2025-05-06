<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import { useProductsStore } from '@/stores/products'
import { useFiltersStore } from '@/stores/filters'
import { usePendingChangesStore } from '@/stores/pendingChanges'
import IconEdit from '@/components/icons/IconEdit.vue'

// Definizione delle proprietà del componente
const props = defineProps<{
  imageSrc: string
  imageAlt?: string
  title: string
  description?: string
  ingredients?: string[]
  tags?: string[]
  productId?: number
  price?: number
  editable?: boolean
  isActive?: boolean
}>()

const productsStore = useProductsStore()
const filtersStore = useFiltersStore()
const pendingChangesStore = usePendingChangesStore()

// Inizializzazione delle variabili locali
const id = ref(props.productId || Math.floor(Math.random() * 10000))
const showEditModal = ref(false)
const localTitle = ref(props.title)
const localPrice = ref(props.price || 0)
const localDescription = ref(props.description || '')
const localIngredients = ref([...props.ingredients || []])
const localTags = ref([...props.tags || []])
const localIsActive = ref(props.isActive || true)

// Computed property per verificare se ci sono modifiche in sospeso
const hasPendingChanges = computed(() =>
  pendingChangesStore.hasProductChange(id.value)
)

// Funzione per aprire il modal di modifica
const openEditModal = () => {
  const pendingData = pendingChangesStore.productChanges[id.value]
  if (pendingData) {
    localTitle.value = pendingData.title
    localPrice.value = pendingData.price
    localDescription.value = pendingData.description
    localIngredients.value = pendingData.ingredients
    localTags.value = pendingData.tags
    localIsActive.value = pendingData.isActive
  } else {
    localTitle.value = props.title
    localPrice.value = props.price || 0
    localDescription.value = props.description || ''
    localIngredients.value = [...props.ingredients || []]
    localTags.value = [...props.tags || []]
    localIsActive.value = props.isActive || true

    originalData.value = {
      title: props.title,
      price: props.price || 0,
      description: props.description || '',
      ingredients: [...props.ingredients || []],
      tags: [...props.tags || []],
      isActive: props.isActive || true
    }
  }
  showEditModal.value = true
}

// Dati originali per il confronto
const originalData = ref({
  title: props.title,
  price: props.price || 0,
  description: props.description || '',
  ingredients: [...props.ingredients || []],
  tags: [...props.tags || []],
  isActive: props.isActive || true
})

// Funzione per verificare se un campo è stato modificato
const isFieldModified = (field: keyof typeof originalData.value): boolean => {
  const currentMap = {
    title: localTitle.value,
    price: localPrice.value,
    description: localDescription.value,
    ingredients: localIngredients.value,
    tags: localTags.value,
    isActive: localIsActive.value
  }
  const curr = currentMap[field]
  const orig = originalData.value[field]

  if (Array.isArray(orig)) {
    return JSON.stringify(curr) !== JSON.stringify(orig)
  }
  return curr !== orig
}

const isImgModified = computed(() => !!imageFile.value)

const resetImage = () => {
  imageFile.value = null
  localImageSrc.value = props.imageSrc
  checkForChanges()
}

const isHoveringImg = ref(false)
const imageFile = ref<File | null>(null)
const localImageSrc = ref(props.imageSrc)
const fileInput = ref<HTMLInputElement | null>(null)

// Funzione per controllare le modifiche
const checkForChanges = () => {
  const currentData = {
    title: localTitle.value,
    price: localPrice.value,
    description: localDescription.value,
    ingredients: localIngredients.value,
    tags: localTags.value,
    isActive: localIsActive.value,
    imageFile: imageFile.value
  }

  const hasChanges = JSON.stringify(currentData) !== JSON.stringify({
    ...originalData.value,
    imageFile: null
  }) || imageFile.value !== null

  if (hasChanges) {
    pendingChangesStore.addProductChange(id.value, currentData)
  } else {
    pendingChangesStore.removeProductChange(id.value)
  }
}

const handleImageUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    imageFile.value = input.files[0]
    localImageSrc.value = URL.createObjectURL(imageFile.value)
    checkForChanges()
  }
}

// Effetto di watch per controllare le modifiche quando il modal è aperto
watchEffect(() => {
  if (showEditModal.value) {
    checkForChanges()
  }
})

// Funzione per salvare le modifiche come in sospeso
const saveAsPending = () => {
  const currentData = {
    title: localTitle.value,
    price: localPrice.value,
    description: localDescription.value,
    ingredients: localIngredients.value,
    tags: localTags.value,
    isActive: localIsActive.value
  }

  if (JSON.stringify(currentData) !== JSON.stringify(originalData.value)) {
    pendingChangesStore.addProductChange(id.value, currentData)
  } else {
    pendingChangesStore.removeProductChange(id.value)
  }

  showEditModal.value = false
}

// Funzione per resettare un campo specifico
const resetField = (field: keyof typeof originalData.value) => {
  switch (field) {
    case 'title':
      localTitle.value = originalData.value.title
      break
    case 'price':
      localPrice.value = originalData.value.price
      break
    case 'description':
      localDescription.value = originalData.value.description
      break
    case 'ingredients':
      localIngredients.value = [...originalData.value.ingredients]
      break
    case 'tags':
      localTags.value = [...originalData.value.tags]
      break
    case 'isActive':
      localIsActive.value = originalData.value.isActive
      break
  }
  checkForChanges()
}

// Funzione per resettare tutti i campi
const resetAll = () => {
  localTitle.value = originalData.value.title
  localPrice.value = originalData.value.price
  localDescription.value = originalData.value.description
  localIngredients.value = [...originalData.value.ingredients]
  localTags.value = [...originalData.value.tags]
  localIsActive.value = originalData.value.isActive
  checkForChanges()
}
</script>

<template>
  <div class="card-container"
    :class="{ 'inactive': hasPendingChanges ? pendingChangesStore.productChanges[id]?.isActive === false : !localIsActive }">
    <div v-if="hasPendingChanges" class="pending-dot"></div>

    <div class="switch-container">
      <button class="switch-btn" :class="localIsActive ? 'active' : 'inactive'"
        @click="localIsActive = !localIsActive; checkForChanges()">
      </button>
    </div>

    <button class="edit-btn" @click.stop="openEditModal">
      <IconEdit />
    </button>

    <div class="card-wrapper">
      <div class="card-side card-front">
        <div class="card-product">
          <button v-if="isImgModified" class="image-reset-btn reset-btn" @click.stop="resetImage" title="Ripristina immagine">
              ↺
          </button>
          <div class="image-wrapper" @mouseover="isHoveringImg = true" @mouseleave="isHoveringImg = false"
            @click="fileInput?.click()">
            <img :src="localImageSrc" :alt="imageAlt" class="product-image" />
            <div v-if="isHoveringImg" class="edit-overlay">
              <IconEdit class="img-edit-icon"/>
            </div>
            <input type="file" ref="fileInput" accept="image/*" @change="handleImageUpload" style="display: none" />
          </div>
          <div class="info">
            <h3 class="title">{{ localTitle }}</h3>
            <p class="price">{{ localPrice?.toFixed(2) }}€</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showEditModal" class="edit-modal">
      <div class="modal-backdrop" @click.self="saveAsPending">
        <div class="modal-content">
          <h2>Modifica Prodotto</h2>

          <div class="reset-controls">
            <button class="btn secondary" @click="resetAll">Ripristina tutto</button>
          </div>

          <div class="form-group">
            <label>
              Titolo:
              <!-- compare solo se effettivamente diverso -->
              <button v-if="isFieldModified('title')" class="reset-btn" @click="resetField('title')"
                title="Ripristina al valore originale">↺</button>
            </label>
            <input v-model="localTitle" />
          </div>

          <div class="form-group">
            <label>
              Prezzo (€):
              <button v-if="isFieldModified('price')" class="reset-btn" @click="resetField('price')"
                title="Ripristina al valore originale">↺</button>
            </label>
            <input type="number" v-model.number="localPrice" step="0.01" />
          </div>

          <div class="form-group">
            <label>
              Descrizione:
              <button v-if="isFieldModified('description')" class="reset-btn" @click="resetField('description')"
                title="Ripristina al valore originale">↺</button>
            </label>
            <textarea v-model="localDescription" />
          </div>

          <div class="form-group">
            <label>Ingredienti:</label>
            <div class="ingredients-list">
              <div v-for="ingredient in filtersStore.allIngredients" :key="ingredient" class="ingredient-item">
                <input type="checkbox" :value="ingredient" v-model="localIngredients" />
                {{ ingredient }}
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Tags:</label>
            <div class="tags-list">
              <div v-for="tag in filtersStore.allTags" :key="tag" class="tag-item">
                <input type="checkbox" :value="tag" v-model="localTags" />
                {{ tag }}
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn secondary" @click="saveAsPending">Conferma</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-container {
  width: 100%;
  max-width: 400px;
  height: 175px;
  position: relative;
}

.card-wrapper {
  width: 100%;
  height: 100%;
}

.card-front {
  width: 100%;
  height: 100%;
  border-radius: 20px;
  background-color: var(--card-bg);
  box-shadow: 0 2px 8px var(--card-shadow);
  transition: filter 0.3s ease, opacity 0.3s ease;
}

.card-product {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 16px;
  position: relative;
}

.image-wrapper {
  flex-shrink: 0;
  width: 100px;
  height: 100px;
  border-radius: 2.25vmax;
  overflow: hidden;
  position: relative;
  margin-right: 16px;
  background: var(--color-background-soft);
  transition: opacity 0.3s ease;
}

.image-wrapper:hover {
  opacity: 0.8;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 5px;
  border-radius: 2.25vmax;
}

.info {
  text-align: center;
  width: 100%;
}

.title {
  font-size: 1.2rem;
  margin: 0 0 8px 0;
  color: var(--poldo-primary);
  font-weight: bold;
}

.price {
  font-size: 1.1rem;
  margin: 0;
  color: var(--poldo-text);
  font-weight: 500;
}

.pending-dot {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 12px;
  height: 12px;
  background-color: #2196F3;
  border-radius: 50%;
  z-index: 3;
}

.edit-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2.25vmax;
  cursor: pointer;
}

.img-edit-icon {
  width: 4em !important;
  height: 4em !important;
  color: white;
}

.image-reset-btn {
  position: absolute;
  font-size: 2em !important;
  font-weight: bold;
  top: 27px;
  left: 85px;
  z-index: 2;
}

.image-wrapper:hover .edit-icon {
  transform: scale(1.1);
}

.edit-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: none;
  border: none;
  padding: 5px;
  cursor: pointer;
  z-index: 1;
  color: var(--poldo-text);
  font-size: 1.5rem;
  transition: opacity 0.3s ease;
}

.edit-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(42, 34, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 15px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px var(--card-shadow);
  border: 1px solid var(--color-border);
}

.modal-content h2 {
  color: var(--poldo-primary);
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 1.2rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--poldo-text);
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--card-bg);
  color: var(--poldo-text);
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: var(--poldo-primary);
  box-shadow: 0 0 0 2px rgba(255, 179, 71, 0.2);
  outline: none;
}

.ingredients-list,
.tags-list {
  max-height: 200px;
  overflow-y: auto;
  padding: 0.8rem;
  background: var(--background-soft);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.ingredient-item,
.tag-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border);
}

.ingredient-item:last-child,
.tag-item:last-child {
  border-bottom: none;
}

input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--poldo-primary);
}

input[type="checkbox"]:checked {
  background-color: var(--poldo-primary);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn.secondary {
  background: var(--poldo-primary);
  color: var(--poldo-text);
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn.secondary:hover {
  background: var(--poldo-accent);
  cursor: pointer;
}

.reset-controls {
  margin-bottom: 1rem;
  text-align: right;
}

.switch-container {
  position: absolute;
  top: 15px;
  right: 15px;
  display: flex;
  background: var(--color-background-soft);
  border-radius: 50px;
}

.switch-btn {
  display: flex;
  padding: 10px;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1;
}

.switch-btn.active {
  background: var(--poldo-primary);
}

.switch-btn.inactive {
  background: var(--disabled);
}

/* Stile per card inattiva */
.card-container.inactive .card-front {
  filter: grayscale(100%);
  opacity: 0.7;
}

.card-container.inactive .edit-btn {
  opacity: 0.7;
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

@media (max-width: 480px) {
  .modal-content {
    padding: 1rem;
  }

  .edit-icon {
    width: 24px;
    height: 24px;
  }
}
</style>
