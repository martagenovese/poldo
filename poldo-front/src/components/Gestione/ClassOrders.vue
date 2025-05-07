<template>
  <div class="class-orders">
    <h3>{{ orderTypeTitle }}</h3>
    <div v-if="!classOrders || classOrders.length === 0" class="no-data">
      Nessun ordine da visualizzare
    </div>
    <div v-else class="class-list">
      <Card 
        v-for="order in safeClassOrders" 
        :key="order.classe || 'unknown'" 
        class="class-card"
      >
        <h4>
          <!-- If turno is 2 (for professors), display as professor name -->
          <span v-if="selectedTurno === 2">
            Prof. {{ order.classe || 'Sconosciuto' }}
          </span>
          <!-- Otherwise display as class -->
          <span v-else>
            Classe {{ order.classe || 'Sconosciuta' }}
          </span>
        </h4>
        <div v-if="order.oraRitiro && order.confermato" class="class-order-pickup">
          <span class="pickup-time">Ritiro: {{ formatTime(order.oraRitiro) }}</span>
        </div>
        <div class="class-products">
          <div v-if="!order.prodotti || order.prodotti.length === 0" class="no-products">
            Nessun prodotto ordinato
          </div>
          <template v-else>
            <div v-for="product in order.prodotti" :key="product.idProdotto || generateKey(product)" class="class-product">
              <span>{{ product.nome || 'Prodotto senza nome' }}</span>
              <span>x{{ product.quantita || 0 }}</span>
            </div>
          </template>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from '@/components/Card.vue'
import { useTurnoStore } from '@/stores/turno'

// Initialize the turno store
const turnoStore = useTurnoStore()

// Define interfaces for the component
interface Product {
  idProdotto?: number;
  nome?: string;
  quantita?: number;
  prezzo?: number;
}

interface ClassOrder {
  classe?: string;
  prodotti?: Product[];
  oraRitiro?: string;
  confermato?: boolean;
}

// Define props with proper type definitions and defaults
const props = defineProps({
  classOrders: {
    type: Array as () => ClassOrder[],
    required: true,
    default: () => []
  },
  selectedTurno: {
    type: Number,
    required: true,
    default: 1
  }
})

// Generate a unique key for products without ID
let keyCounter = 0
const generateKey = (item: any): string => {
  return `item_${keyCounter++}_${Date.now()}`
}

// Create a computed property that ensures safe access to classOrders
const safeClassOrders = computed<ClassOrder[]>(() => {
  if (!Array.isArray(props.classOrders)) {
    console.warn('classOrders is not an array:', props.classOrders)
    return []
  }
  
  console.log("ClassOrders component received:", props.classOrders.length, "orders", props.classOrders)
  
  // Filter out any invalid orders and ensure all required properties exist
  return props.classOrders.filter(order => order && typeof order === 'object').map(order => {
    // Ensure prodotti is an array
    const prodotti = Array.isArray(order.prodotti) 
      ? order.prodotti.filter(p => p && typeof p === 'object')
      : []
    
    return {
      ...order,
      classe: order.classe || '',
      prodotti
    }
  })
})

// Format time from database format to display format (HH:MM)
const formatTime = (time?: string): string => {
  if (!time) return ''
  
  // If time includes seconds (HH:MM:SS), remove them
  if (time.includes(':')) {
    const parts = time.split(':')
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`
    }
  }
  
  return time
}

// Determine the appropriate title based on selected turno
const orderTypeTitle = computed(() => {
  // Find the selected turno in the store
  const turno = turnoStore.turni.find(t => t.n === props.selectedTurno)
  
  // If we have the turno with a name, use it
  if (turno && turno.nome) {
    return `Ordini ${turno.nome}`
  }
  
  // Special case for professors (turno 2)
  if (props.selectedTurno === 2) {
    return 'Ordini Professori'
  }
  
  // Fallback 
  return 'Ordini per Classe'
})
</script>

<style scoped>
.class-orders {
  width: 100%;
  padding-left: 20px;
  border-left: 1px solid var(--color-border);
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

.class-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.class-card {
  width: calc(50% - 15px);
  margin-bottom: 15px;
}

.class-products {
  margin-top: 10px;
}

.class-product {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--color-border);
}

.class-product:last-child {
  border-bottom: none;
}

.class-order-pickup {
  margin: 5px 0 10px;
  font-size: 0.9rem;
  color: var(--poldo-primary);
  font-weight: 500;
}

.pickup-time {
  display: inline-block;
  padding: 3px 8px;
  background-color: var(--poldo-background-soft);
  border-radius: 4px;
}

.no-products {
  font-style: italic;
  color: var(--poldo-text);
  opacity: 0.7;
  padding: 5px 0;
}

@media (max-width: 768px) {
  .class-orders {
    border-left: none;
    border-top: 1px solid var(--color-border);
    padding-top: 20px;
    padding-left: 0;
  }

  .class-card {
    width: 100%;
  }
}
</style>