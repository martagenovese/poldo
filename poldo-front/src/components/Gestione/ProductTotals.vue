<template>
  <div class="product-totals">
    <h3>Totali Prodotti</h3>
    <div v-if="uniqueProducts.length === 0" class="no-data">
      Nessun prodotto da visualizzare
    </div>
    <div v-else class="product-list">
      <div v-for="product in uniqueProducts" :key="product.idProdotto" class="product-item">
        <div class="product-name">{{ product.nome }}</div>
        <div class="product-quantity">{{ getTotalQuantity(product.idProdotto) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Define interfaces for component
interface Product {
  idProdotto: number;
  nome: string;
  quantita: number;
  prezzo: number;
}

interface ClassOrder {
  classe: string;
  prodotti: Product[];
  // Other properties may be present
}

// Define props with better type definition
const props = defineProps({
  classOrders: {
    type: Array as () => ClassOrder[],
    required: true,
    default: () => []
  }
})

// Get unique products from all class orders with error handling
const uniqueProducts = computed(() => {
  const products = new Map()
  
  if (!Array.isArray(props.classOrders)) {
    console.error('classOrders is not an array:', props.classOrders)
    return []
  }
  
  props.classOrders.forEach(order => {
    // Verify the order has a prodotti property that is an array
    if (!order || !Array.isArray(order.prodotti)) {
      return
    }
    
    order.prodotti.forEach(product => {
      // Skip products without an ID
      if (product.idProdotto === undefined) {
        return
      }
      
      if (!products.has(product.idProdotto)) {
        products.set(product.idProdotto, {
          idProdotto: product.idProdotto,
          nome: product.nome || 'Prodotto senza nome',
          prezzo: product.prezzo || 0
        })
      }
    })
  })
  
  return Array.from(products.values())
})

// Calculate total quantity for a product across all classes with error handling
const getTotalQuantity = (productId: number): number => {
  if (!Array.isArray(props.classOrders)) {
    return 0
  }
  
  return props.classOrders.reduce((total, order) => {
    // Skip orders without prodotti array
    if (!order || !Array.isArray(order.prodotti)) {
      return total
    }
    
    const product = order.prodotti.find(p => p.idProdotto === productId)
    // Make sure quantita is a number, default to 0 if not
    const quantity = product && typeof product.quantita === 'number' ? product.quantita : 0
    
    return total + quantity
  }, 0)
}
</script>

<style scoped>
.product-totals {
  width: 100%;
  padding-right: 20px;
  overflow-y: auto;
  height: 100%;
}

h3 {
  margin-bottom: 15px;
  color: var(--poldo-primary);
  font-size: 1.2rem;
}

.no-data {
  text-align: center;
  padding: 20px;
  color: var(--poldo-text);
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.product-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 4px var(--card-shadow);
}

.product-name {
  font-weight: 500;
}

.product-quantity {
  font-weight: bold;
  color: var(--poldo-primary);
}
</style>