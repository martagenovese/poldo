<script setup lang="ts">
import CardGrid from '@/components/CardGrid.vue';
import CardProdotto from '@/components/CardProdotto.vue';
import Filtri from '@/components/Filtri.vue';
import { useRouter } from 'vue-router';
import { useProductsStore } from '@/stores/products';
import { useCartStore } from '@/stores/cart';

const router = useRouter();
const productsStore = useProductsStore();
const cartStore = useCartStore();

// Function to navigate to the cart page
const goToCart = () => {
  router.push('/carrello');
};
</script>

<template>
  <div class="prodotti">
    <div class="prodotti-container">
      <CardGrid>
        <CardProdotto v-for="product in productsStore.products" :key="product.id" :productId="product.id"
          :title="product.title" :description="product.description" :ingredients="product.ingredients"
          :imageSrc="product.imageSrc" :price="product.price" />
      </CardGrid>
    </div>

    <Filtri :ingredients="productsStore.allIngredients" :tags="productsStore.allTags" :max-price="maxPrice" />

    <!-- Shopping Cart Button -->
    <button class="cart-button" @click="goToCart">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.prodotti {
  position: relative;
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

h1 {
  text-align: center;
  width: 100%;
  margin-bottom: 20px;
}

.prodotti-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: calc(100% - 20px);
  height: calc(100vh - 20px);
  overflow-y: auto;
  margin: 20px 0 20px 20px;
  padding: 0 0 0 020px;
}

.cart-button {
  position: fixed;
  bottom: 10px;
  right: 10px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: var(--poldo-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s, background-color 0.2s;
  z-index: 10;
}

.cart-button:hover {
  transform: scale(1.05);
  background-color: var(--poldo-accent);
}
</style>
