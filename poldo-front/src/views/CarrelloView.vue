<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import { useProductsStore } from '@/stores/products'
import Alert from '@/components/Alert.vue'
import QuantityControl from '@/components/ControlloQuantitaProdotto.vue'

import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const cartStore = useCartStore()
const productsStore = useProductsStore()
const router = useRouter()

const allProducts = computed(() => productsStore.products)
console.log('allProducts', allProducts.value)

const items = computed(() => cartStore.getItems())

const itemsDetails = computed(() => {
    return items.value.map(item => {
        const product = allProducts.value.find(p => p.id === item.id)
        return {
            ...item,
            ...product,
        }
    })
})

console.log('itemsDetails', itemsDetails.value)

const hasItems = computed(() => items.value.length > 0)



const totalPrice = computed(() => {
    return items.value.reduce((total, item) => {
        const product = allProducts.value.find(p => p.id === item.id)
        return total + (product.price * item.quantity)
    }, 0)
})

const continueShopping = () => {
    router.push('/prodotti')
}

const checkoutAlertMessage = ref('Checkout functionality will be implemented in the future!')
const showCheckoutAlert = ref(false)

const checkout = () => {
    showCheckoutAlert.value = true
}

const clearCart = () => {
    cartStore.clearCart()
}

const handleAlertClose = () => {
    showCheckoutAlert.value = false
}

const selectedMacro = ref('personale')

</script>

<template>
    <div class="carrello">
        <Alert v-if="showCheckoutAlert" type="error" :message="checkoutAlertMessage" @close="handleAlertClose" />

        <div class="category-switch">
            <div class="switch-container">
                <button class="switch-btn" :class="{ active: selectedMacro === 'personale' }"
                    @click="selectedMacro = 'personale'">
                    <svg class="icon" viewBox="0 0 24 24">
                        <path d="M18 6H6L2 22h20L18 6zm-6 7c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
                        <circle cx="12" cy="9" r="1" />
                    </svg>
                    <span>Personale</span>
                </button>

                <button class="switch-btn" :class="{ active: selectedMacro === 'classe' }"
                    @click="selectedMacro = 'classe'">
                    <svg class="icon" viewBox="0 0 24 24">
                        <path d="M21 5V3H3v2l8 9v5H6v2h12v-2h-5v-5l8-9zM7.43 7L5.66 5h12.69l-1.78 2H7.43z" />
                    </svg>
                    <span>Classe</span>
                </button>
            </div>
        </div>

        <div v-if="selectedMacro === 'personale'">
            <div v-if="!hasItems" class="empty-cart">
                <p>Il tuo carrello è vuoto</p>
                <button class="continue-btn" @click="continueShopping">Continua lo shopping</button>
            </div>


            <div v-else class="cart-summary">
                <div class="summary-header">
                    <h2>Riepilogo ordine personale</h2>
                </div>

                <div class="summary-content">
                    <!-- Receipt items -->
                    <div class="receipt-items">
                        <div v-for="item in itemsDetails" :key="item.id" class="receipt-item">
                            <img :src="item.imageSrc" alt="Product Image" class="product-image" />
                            <span class="product-info">
                                x{{ item.quantity }}
                                {{
                                    item.title
                                }}
                            </span>
                            <div class="quantity-price">
                                <QuantityControl :productId="item.id" :delete="false" />
                                <span class="item-total">
                                    €{{
                                        (item.quantity * item.price).toFixed(2)
                                    }}
                                </span>
                            </div>
                        </div>
                    </div>


                    <!-- Receipt total -->
                    <div class="receipt-total">
                        <span>Totale</span>
                        <span>€{{ totalPrice.toFixed(2) }}</span>
                    </div>
                </div>

                <div class="summary-actions">
                    <button class="checkout-btn" @click="checkout">Procedi all'ordine</button>
                    <button class="clear-btn" @click="clearCart">Svuota carrello</button>
                    <button class="continue-btn" @click="continueShopping">Continua lo shopping</button>
                </div>
            </div>
        </div>


    </div>
</template>

<style scoped>
.carrello {
    height: calc(100vh - 100px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 20px 0;
}

h1,
h2 {
    color: var(--poldo-text);
}

.empty-cart {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-top: 50px;
    padding: 30px;
    background-color: var(--card-bg);
    border-radius: 10px;
    box-shadow: 0 2px 8px var(--card-shadow);
}

.empty-cart p {
    font-size: 1.2rem;
    margin-bottom: 20px;
}

.cart-content {
    display: flex;
    flex-direction: column;
    gap: 30px;
    overflow-y: auto;
    padding: 25px;
    margin-bottom: 40px;
}

.product-image {
    width: 30px;
    height: 30px;
    border-radius: 10px;
}

:deep(.cart-product-card .card-prodotto) {
    padding: 10px !important;
}

:deep(.cart-product-card .title) {
    font-size: 1rem !important;
    margin-bottom: 4px !important;
}

:deep(.cart-product-card .price) {
    font-size: 0.9rem !important;
    margin-top: 2px !important;
}

:deep(.cart-product-card .quantity-controls) {
    bottom: 5px !important;
}

/* Adjust quantity buttons size */
:deep(.cart-product-card .quantity-btn) {
    width: 20px !important;
    height: 20px !important;
    font-size: 1rem !important;
}

.cart-summary {
    background-color: var(--card-bg);
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 8px var(--card-shadow);
    position: relative;
    top: auto;
}

.summary-header {
    margin-bottom: 20px;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 10px;
}

.summary-content {
    overflow-y: auto;
}

.summary-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-size: 1rem;
}

.summary-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.checkout-btn,
.continue-btn,
.clear-btn {
    padding: 12px 20px;
    border: none;
    border-radius: 25px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
}

.checkout-btn:hover {
    transform: translateY(-2px);
}

.checkout-btn {
    background-color: var(--poldo-primary);
    color: white;
    font-weight: bold;
}

.checkout-btn:hover {
    background-color: var(--poldo-accent);
    transform: translateY(-2px);
}

.continue-btn {
    background-color: var(--poldo-background-soft);
    color: var(--poldo-text);
}

.continue-btn:hover {
    background-color: var(--color-background-mute);
}

.clear-btn {
    background-color: var(--poldo-red);
    color: white;
}

.clear-btn:hover {
    background-color: var(--red);
}

/* Receipt styling */
.receipt-header,
.receipt-total {
    display: flex;
    justify-content: space-between;
    width: 100%;
    font-size: 0.9rem;
}


.receipt-item {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
    width: 100%;
    font-size: 0.9rem;
    padding: 8px 0;
    border-bottom: 1px solid var(--color-border);
}

.receipt-header {
    font-weight: bold;
    padding-bottom: 8px;
    border-bottom: 1px dashed var(--color-border);
    margin-bottom: 8px;
}

.receipt-items {
    max-height: 200px;
    padding: 4px 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    justify-content: flex-start;
}

.quantity-price {
    display: flex;
}

.product-name {
    flex: 1;
    padding-right: 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.product-info {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.quantity {
    min-width: 30px;
    text-align: center;
}

.item-total {
    text-align: right;
    width: 60px;
}

.receipt-divider {
    height: 1px;
    width: 100%;
    background-color: var(--color-border);
    margin: 10px 0;
}

.receipt-total {
    font-weight: bold;
    font-size: 1.1rem;
    color: var(--poldo-primary);
    margin-bottom: 10px;
}


/* Switch */
.category-switch {
    display: flex;
    justify-content: center;
    margin: 15px 0;
}

.switch-container {
    display: flex;
    background: var(--color-background-soft);
    border-radius: 50px;
    padding: 5px;
    box-shadow: 0 2px 8px var(--poldo-card-shadow);
}


.switch-btn {
    display: flex;
    align-items: center;
    padding: 10px 20px;
    border: none;
    border-radius: 50px;
    background: none;
    cursor: pointer;
    transition: all 0.3s ease;
    gap: 8px;
}

.switch-btn span {
    font-weight: 500;
    color: var(--poldo-text);
    transition: color 0.3s ease;
}

.switch-btn.active {
    background: var(--poldo-primary);
    box-shadow: 0 2px 8px rgba(239, 194, 12, 0.3);
}

.switch-btn.active .icon {
    stroke: var(--poldo-background);
}

.switch-btn.active span {
    color: var(--poldo-background);
}

.icon {
    width: 24px;
    height: 24px;
    stroke: var(--poldo-text);
    stroke-width: 1.5;
    fill: none;
    transition: stroke 0.3s ease;
}

/* Responsive layout for small screens */
@media (max-width: 600px) {
    .cart-items-list {
        grid-template-columns: repeat(1, 1fr);
        gap: 8px;
    }

    :deep(.cart-product-card) {
        width: 130px !important;
        height: 160px !important;
    }

    .switch-btn {
        padding: 8px 15px;
    }
}
</style>
