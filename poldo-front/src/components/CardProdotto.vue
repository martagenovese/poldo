<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useFavoritesStore } from '@/stores/favorites'

const props = defineProps<{
    imageSrc: string
    imageAlt?: string
    title: string
    description?: string
    ingredients?: string[]
    productId?: number
    inCartView?: boolean
    price?: number
    disableFlip?: boolean
}>()

const cartStore = useCartStore()
const favoritesStore = useFavoritesStore()
const isFlipped = ref(false)
const isFavorited = ref(false)
const quantity = ref(0)

// Genera ID random se non fornito
const id = ref(props.productId || Math.floor(Math.random() * 10000))

// Inizializza preferiti
onMounted(() => {
    isFavorited.value = favoritesStore.isFavorite(id.value)
    const cartItem = cartStore.items.find(item => item.id === id.value)
    quantity.value = cartItem?.quantity || 0
})

// Gestione preferiti
const toggleFavorite = () => {
    isFavorited.value = !isFavorited.value
    isFavorited.value
        ? favoritesStore.addFavorite(id.value)
        : favoritesStore.removeFavorite(id.value)
}

const increaseQuantity = () => {
    quantity.value++
}

const decreaseQuantity = () => {
    if (quantity.value > 0) {
        quantity.value--
    }
}

const removeFromCart = () => {
    quantity.value = 0
}

// Aggiorna carrello quando cambia quantità
watch(quantity, (newVal) => {
    if (newVal > 0) {
        cartStore.addToCart({
            id: id.value,
            title: props.title,
            description: props.description,
            ingredients: props.ingredients,
            imageSrc: props.imageSrc,
            price: props.price || 0
        }, newVal - (cartStore.items.find(item => item.id === id.value)?.quantity || 0))
    } else {
        cartStore.removeFromCart(id.value)
    }
})

// Gestione flip card
const flipCard = (event: Event) => {
    if (props.disableFlip) return
    if (!(event.target as HTMLElement).closest('.quantity-controls')) {
        isFlipped.value = !isFlipped.value
    }
}
</script>

<template>
    <div class="card-container" :class="{ 'clickable': !props.disableFlip }" @click="flipCard">
        <div class="card-wrapper" :class="{ 'is-flipped': isFlipped }">
            <!-- Front Side -->
            <div class="card-side card-front">
                <div class="card-prodotto">
                    <button class="favorite-btn" @click.stop="toggleFavorite">
                        <svg v-if="isFavorited" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                            viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5">
                            <path
                                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-width="1.5">
                            <path
                                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                    </button>

                    <img :src="imageSrc" :alt="imageAlt" />

                    <div class="info">
                        <h3 class="title">{{ title }}</h3>
                        <div v-if="price !== undefined" class="price">€{{ price.toFixed(2) }}</div>
                    </div>

                    <div class="quantity-controls">
                        <button v-if="inCartView" class="quantity-btn delete" @click.stop="removeFromCart">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                        </button>
                        <button class="quantity-btn minus" :class="{ 'disabled': quantity === 0 }"
                            @click.stop="decreaseQuantity">-</button>
                        <span class="quantity">{{ quantity }}</span>
                        <button class="quantity-btn plus" @click.stop="increaseQuantity">+</button>
                    </div>
                </div>
            </div>

            <!-- Back Side -->
            <div class="card-side card-back">
                <h3 class="title">{{ title }}</h3>
                <div class="scroll">
                    <div class="descr">

                        <!-- <div v-if="price !== undefined" class="price">€{{ price.toFixed(2) }}</div> -->

                        <div class="details" @wheel.stop="handleScroll" @touchstart="handleTouchStart"
                            @touchmove.stop="handleTouchMove">
                            <div class="description-section">
                                <h4>Descrizione</h4>
                                <p>{{ description || 'Nessuna descrizione disponibile' }}</p>
                            </div>

                            <div class="ingredients-section">
                                <h4>Ingredienti</h4>
                                <ul v-if="ingredients && ingredients.length > 0">
                                    <li v-for="(ingredient, index) in ingredients" :key="index">
                                        {{ ingredient }}
                                    </li>
                                </ul>
                                <p v-else>Nessun ingrediente disponibile</p>
                            </div>
                        </div>
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
    outline: none;
    user-select: none;
}

.card-container.clickable {
    cursor: pointer;
}

.card-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform 0.8s;
    transform-style: preserve-3d;
}

.card-wrapper.is-flipped {
    transform: rotateY(180deg);
}

.card-front {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border-radius: 20px;
    background-color: var(--card-bg);
    box-shadow: 0 2px 8px var(--card-shadow);
    z-index: 1;
}

.card-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border-radius: 20px;
    background-color: var(--card-bg);
    box-shadow: 0 2px 8px var(--card-shadow);
    transform: rotateY(180deg);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

.scroll {
    flex: 1;
    min-height: 0;
}

.card-wrapper.is-flipped .card-back {
    pointer-events: auto;
}

.card-back .card-prodotto,
.card-back .details,
.card-back .quantity-controls {
    pointer-events: auto;
}

/* Card content */
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
    text-align: center;
}

.card-back .title {
    font-size: 1.5rem;
    margin: 0;
    background-color: var(--poldo-primary);
    color: white;
    width: 100%;
    font-weight: bold;
}

.short-description {
    font-size: 0.95rem;
    color: var(--color-text);
    margin-top: 5px;
}

.price {
    font-size: 1.1rem;
    color: var(--poldo-text);
}

.descr {
    overflow-y: auto;
    height: 100%;
    box-sizing: border-box;
    padding: 5px 10px;
}

/* Back side specific styles */
.details {
    height: auto;
    padding-right: 5px;
    display: flex;
    flex-direction: column;
    gap: 15px;
}

/* Custom scrollbar styling */
.details::-webkit-scrollbar {
    width: 5px;
}


.ingredients-section ul {
    padding-left: 20px;
    margin: 5px 0;
}

.ingredients-section li {
    font-size: 0.9rem;
    margin-bottom: 2px;
}

.description-section p {
    font-size: 0.9rem;
    line-height: 1.3;
    margin: 5px 0;
}

.description-section h4,
.ingredients-section h4 {
    margin: 0 0 5px 0;
    font-size: 1rem;
    color: var(--poldo-primary);
}

/* Quantity controls */
.quantity-controls {
    position: absolute;
    bottom: 10px;
    right: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 2;
}

.quantity-btn {
    width: 25px;
    height: 25px;
    border-radius: 50%;
    border: none;
    color: var(--poldo-text);
    font-size: 1.2rem;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    line-height: 0;
    transition: background-color 0.2s;
}

.quantity-btn.plus {
    background-color: var(--poldo-green);
}

.quantity-btn.minus {
    background-color: var(--poldo-red);
}

.quantity-btn.minus.disabled {
    background-color: var(--disabled);
    cursor: not-allowed;
}

.quantity-btn.delete {
    background-color: var(--poldo-accent);
    color: var(--poldo-text);
}

.quantity-btn.delete:hover {
    background-color: var(--poldo-primary);
}

.quantity {
    font-size: 1.1rem;
    font-weight: bold;
    min-width: 20px;
    text-align: center;
}

.favorite-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    z-index: 2;
    color: var(--poldo-accent);
    transition: all 0.2s ease;
}

.favorite-btn:hover {
    transform: scale(1.1);
    color: var(--poldo-primary);
}

.favorite-btn svg {
    width: 24px;
    height: 24px;
}

@media (prefers-color-scheme: dark) {

    .short-description,
    .description-section p {
        color: var(--poldo-text);
    }
}
</style>
