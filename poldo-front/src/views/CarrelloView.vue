<script setup lang="ts">
import { useCartStore } from '@/stores/cart'

import CardGrid from '@/components/CardGrid.vue'
import CardProdotto from '@/components/CardProdotto.vue'
import Alert from '@/components/Alert.vue'

import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const cartStore = useCartStore()
const router = useRouter()

const hasItems = computed(() => cartStore.items.length > 0)

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
</script>

<template>
  <div class="carrello">
    <Alert v-if="showCheckoutAlert" type="error" :message="checkoutAlertMessage" @close="handleAlertClose" />

    <div v-if="!hasItems" class="empty-cart">
      <p>Il tuo carrello è vuoto</p>
      <button class="continue-btn" @click="continueShopping">Continua lo shopping</button>
    </div>

    <div v-else class="cart-summary">
      <div class="summary-header">
        <h2>Riepilogo ordine</h2>
      </div>

      <div class="summary-content">
        <!-- Receipt items -->
        <div class="receipt-items">
          <div v-for="item in cartStore.items" :key="item.id" class="receipt-item">
            <span class="product-info">x{{ item.quantity }} {{ item.title }}</span>
            <span class="item-total">€{{ (item.price * item.quantity).toFixed(2) }}</span>
          </div>
        </div>

        <!-- Receipt divider -->
        <div class="receipt-divider"></div>

        <!-- Receipt total -->
        <div class="receipt-total">
          <span>Totale</span>
          <span>€{{ cartStore.totalPrice.toFixed(2) }}</span>
        </div>
      </div>

      <div class="summary-actions">
        <button class="checkout-btn" @click="checkout">Procedi all'ordine</button>
        <button class="clear-btn" @click="clearCart">Svuota carrello</button>
        <button class="continue-btn" @click="continueShopping">Continua lo shopping</button>
      </div>
    </div>

    <div class="cart-content">
      <CardGrid minWidth="300px" class="cart-items-grid">
        <CardProdotto v-for="item in cartStore.items" :key="item.id" :productId="item.id" :title="item.title"
          :description="item.description" :ingredients="item.ingredients" :imageSrc="item.imageSrc" :price="item.price"
          :inCartView="true" :disableFlip="true" />
      </CardGrid>
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
  height: fit-content;
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
.receipt-item,
.receipt-total {
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 0.9rem;
}

.receipt-header {
  font-weight: bold;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--color-border);
  margin-bottom: 8px;
}

.receipt-items {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 10px;
}

.receipt-item {
  margin-bottom: 6px;
  padding: 4px 0;
}

.quantity-price {
  display: flex;
  min-width: 120px;
  justify-content: space-between;
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
  padding-right: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quantity {
  min-width: 30px;
  text-align: center;
}

.item-total {
  min-width: 70px;
  text-align: right;
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
}
</style>
