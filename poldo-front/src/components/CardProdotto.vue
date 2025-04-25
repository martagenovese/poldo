<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useCartStore } from '@/stores/cart'

const props = defineProps<{
    imageSrc: string
    imageAlt?: string
    title: string
    description?: string
    ingredients?: string[]
    productId?: number
    inCartView?: boolean
    price?: number
}>()

// Generate a random ID if not provided
const id = ref(props.productId || Math.floor(Math.random() * 10000))
const quantity = ref(0)
const isFlipped = ref(false)
const cartStore = useCartStore()

// Check if this product is already in the cart
onMounted(() => {
    const cartItem = cartStore.items.find(item => item.id === id.value)
    if (cartItem) {
        quantity.value = cartItem.quantity
    }
})

// Watch for quantity changes to update cart
watch(quantity, (newValue) => {
    if (newValue > 0) {
        cartStore.addToCart({
            id: id.value,
            title: props.title,
            description: props.description,
            ingredients: props.ingredients,
            imageSrc: props.imageSrc,
            price: props.price || 0
        }, newValue - (cartStore.items.find(item => item.id === id.value)?.quantity || 0))
    } else if (newValue === 0) {
        cartStore.removeFromCart(id.value)
    }
}, { immediate: false })

const decreaseQuantity = () => {
    if (quantity.value > 0) {
        quantity.value--
    }
}

const increaseQuantity = () => {
    quantity.value++
}

const removeFromCart = () => {
    cartStore.removeFromCart(id.value)
    quantity.value = 0
}

const flipCard = (event: Event) => {
    // Only prevent flip when clicking on quantity controls
    if (!(event.target as HTMLElement).closest('.quantity-controls')) {
        isFlipped.value = !isFlipped.value
    }
}

// Handle scrolling in the details section without propagating events
const handleScroll = (event: Event) => {
    event.stopPropagation()
}

// Handle touch events to prevent parent scrolling when scrolling the details
const handleTouchStart = (event: TouchEvent) => {
    // Don't stop propagation for touchstart to allow the touch to be registered
    // This is important for detecting taps on the card
}

const handleTouchMove = (event: TouchEvent) => {
    // Prevent the parent container from scrolling when scrolling inside details
    event.stopPropagation()
}
</script>

<template>
    <div class="card-container" @click="flipCard">
        <div class="card-wrapper" :class="{ 'is-flipped': isFlipped }">
            <!-- Front Side -->
            <div class="card-side card-front">
                <div class="card-prodotto">
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
                <div class="card-prodotto">
                    <h3 class="title">{{ title }}</h3>
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
/* Card flip container */
.card-container {
    width: 240px;
    height: 270px;
    perspective: 1000px;
    cursor: pointer;
    /* padding: 10px; */
    -webkit-tap-highlight-color: transparent;
    /* Removes tap highlight on mobile */
    outline: none;
    /* Removes the outline on click */
    user-select: none;
    /* Prevents text selection */
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

.card-side {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    /* Safari support */
    border-radius: 20px;
    background-color: var(--card-bg);
    box-shadow: 0 2px 8px var(--card-shadow);
}

.card-front {
    z-index: 1;
}

.card-back {
    transform: rotateY(180deg);
    pointer-events: none;
    /* Disable pointer events on the back card container */
}



/* This is important - enable pointer events when flipped */
.card-wrapper.is-flipped .card-back {
    pointer-events: auto;
    /* Re-enable pointer events when card is flipped */
}

.card-back .card-prodotto,
.card-back .details,
.card-back .quantity-controls {
    pointer-events: auto;
    /* Enable pointer events for all content on back */
}

/* Card content */
.card-prodotto {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px;
    box-sizing: border-box;
    position: relative;
}

.card-prodotto>img{
    border-radius: 15px;
    height: 100px;
    width: 100px;
}


.info {
    text-align: center;
    width: 100%;
    margin-bottom: 30px;
}

.title {
    font-size: 1.2rem;
    margin: 0;
    margin-bottom: 8px;
    color: var(--poldo-primary);
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
    margin-top: 5px;
}

.descr{
    overflow-y: auto;
}

/* Back side specific styles */
.details {
    width: 100%;
    height: calc(100% - 80px);
    padding-right: 5px;
    /* -webkit-overflow-scrolling: touch; */
    /* Improved scrolling on iOS */
    scrollbar-width: thin;
    /* Firefox */
    position: relative;
    /* Establishes a new stacking context */
    z-index: 100;
    /* Higher than other elements to ensure it receives events */
    touch-action: pan-y;
    /* Allow only vertical touch scrolling */
    overscroll-behavior: contain;
    /* Prevent scroll chaining */
    pointer-events: auto !important;
    /* Force pointer events to be enabled */
    will-change: transform;
    /* Performance optimization for scrolling */
}

/* Custom scrollbar styling */
.details::-webkit-scrollbar {
    width: 5px;
}

.details::-webkit-scrollbar-track {
    background: var(--poldo-background-soft);
    border-radius: 10px;
}

.details::-webkit-scrollbar-thumb {
    background: var(--poldo-accent);
    border-radius: 10px;
}

.description-section,
.ingredients-section {
    margin-bottom: 15px;
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

.quantity-btn.plus:hover {
    background-color: var(--green);
    /* Slightly darker green on hover */
}

.quantity-btn.minus {
    background-color: var(--poldo-red);
}

.quantity-btn.minus:hover {
    background-color: var(--red);
    /* Slightly darker red on hover */
}

.quantity-btn.delete {
    background-color: var(--poldo-accent);
    color: var(--poldo-text);
}

.quantity-btn.delete:hover {
    background-color: var(--poldo-primary);
}

.quantity-btn.minus.disabled {
    background-color: var(--poldo-accent);
    cursor: not-allowed;
}

.quantity {
    font-size: 1.1rem;
    font-weight: bold;
    min-width: 20px;
    text-align: center;
}

@media (prefers-color-scheme: dark) {

    .short-description,
    .description-section p {
        color: var(--poldo-text);
    }
}
</style>