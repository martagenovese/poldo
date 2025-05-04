<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePendingChangesStore } from '@/stores/pendingChanges'
import { useProductsStore } from '@/stores/products'

const props = defineProps<{
    imageSrc: string
    imageAlt?: string
    title: string
    description?: string
    ingredients?: string[]
    productId?: number
    price?: number
    editable?: boolean
}>()

const pendingChangesStore = usePendingChangesStore()
const productsStore = useProductsStore()

const id = ref(props.productId || Math.floor(Math.random() * 10000))
const showEditModal = ref(false)
const localTitle = ref(props.title)
const localPrice = ref(props.price || 0)
const localDescription = ref(props.description || '')
const localIngredients = ref([...props.ingredients || []])
const newIngredient = ref('')

const hasPendingChanges = computed(() =>
  pendingChangesStore.hasProductChange(id.value)
)

const openEditModal = () => {
  const pendingData = pendingChangesStore.productChanges[id.value]
  if(pendingData) {
    localTitle.value = pendingData.title
    localPrice.value = pendingData.price
    localDescription.value = pendingData.description
    localIngredients.value = pendingData.ingredients
  } else {
    localTitle.value = props.title
    localPrice.value = props.price || 0
    localDescription.value = props.description || ''
    localIngredients.value = [...props.ingredients || []]
  }
  showEditModal.value = true
}

const addIngredient = () => {
  const ingredient = newIngredient.value.trim()
  if(ingredient && !localIngredients.value.includes(ingredient)) {
    localIngredients.value.push(ingredient)
    newIngredient.value = ''
  }
}

const saveAsPending = () => {
  const originalData = {
    title: props.title,
    price: props.price || 0,
    description: props.description || '',
    ingredients: props.ingredients || []
  }

  const newData = {
    title: localTitle.value,
    price: localPrice.value,
    description: localDescription.value,
    ingredients: localIngredients.value
  }

  if(JSON.stringify(originalData) !== JSON.stringify(newData)) {
    pendingChangesStore.addProductChange(id.value, newData)
  } else {
    pendingChangesStore.removeProductChange(id.value)
  }

  showEditModal.value = false
}
</script>

<template>
    <div class="card-container">
        <div v-if="hasPendingChanges" class="pending-dot"></div>
        <button class="edit-btn" @click.stop="openEditModal">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
            </svg>
        </button>

        <div class="card-wrapper">
            <div class="card-side card-front">
                <div class="card-prodotto">
                    <img :src="imageSrc" :alt="imageAlt" />
                    <div class="info">
                        <h3 class="title">{{ hasPendingChanges ? pendingChangesStore.productChanges[id].title : title }}</h3>
                        <div class="price">€{{ (hasPendingChanges ? pendingChangesStore.productChanges[id].price : price)?.toFixed(2) }}</div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showEditModal" class="edit-modal">
            <div class="modal-content">
                <h2>Modifica Prodotto</h2>

                <div class="form-group">
                    <label>Titolo:</label>
                    <input v-model="localTitle" />
                </div>

                <div class="form-group">
                    <label>Prezzo (€):</label>
                    <input type="number" v-model.number="localPrice" step="0.01" />
                </div>

                <div class="form-group">
                    <label>Descrizione:</label>
                    <textarea v-model="localDescription" />
                </div>

                <div class="form-group">
                    <label>Ingredienti:</label>
                    <div class="ingredients-list">
                        <div v-for="ingredient in productsStore.allIngredients" :key="ingredient" class="ingredient-item">
                            <label>
                                <input type="checkbox" :value="ingredient" v-model="localIngredients" />
                                {{ ingredient }}
                            </label>
                        </div>
                        <div class="new-ingredient">
                            <input v-model="newIngredient" placeholder="Nuovo ingrediente" @keyup.enter="addIngredient" />
                            <button @click="addIngredient">Aggiungi</button>
                        </div>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn secondary" @click="saveAsPending">Conferma</button>
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
}

.card-prodotto {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 16px;
    position: relative;
}

.card-prodotto>img {
    border-radius: 15px;
    height: 100px;
    width: 100px;
}

.info {
    text-align: center;
    width: 100%;
}

.title {
    font-size: 1.2rem;
    margin: 0;
    color: var(--poldo-primary);
    font-weight: bold;
}

.price {
    font-size: 1.1rem;
    color: var(--poldo-text);
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

.edit-btn {
    position: absolute;
    bottom: 10px;
    right: 10px;
    background: none;
    border: none;
    padding: 5px;
    cursor: pointer;
    z-index: 2;
    color: var(--poldo-text);
}

.edit-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(42, 34, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
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

.ingredients-list {
    max-height: 200px;
    overflow-y: auto;
    padding: 0.8rem;
    background: var(--background-soft);
    border-radius: 8px;
    border: 1px solid var(--color-border);
}

.ingredient-item {
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--color-border);
}

.ingredient-item:last-child {
    border-bottom: none;
}

.ingredient-item label {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    cursor: pointer;
    color: var(--poldo-text);
}

input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: var(--poldo-primary);
}

.new-ingredient {
    display: flex;
    gap: 0.8rem;
    margin-top: 1rem;
}

.new-ingredient input {
    flex: 1;
    padding: 0.6rem;
    border-radius: 6px;
}

.new-ingredient button {
    padding: 0.6rem 1rem;
    background: var(--poldo-green);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.3s ease;
}

.new-ingredient button:hover {
    background: var(--poldo-green);
    opacity: 0.9;
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

@media (max-width: 480px) {
    .modal-content {
        padding: 1rem;
    }

    .new-ingredient {
        flex-direction: column;
    }

    .new-ingredient button {
        width: 100%;
    }
}
</style>
