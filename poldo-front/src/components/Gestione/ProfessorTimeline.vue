<template>
  <div class="timeline-section">
    <h2>Ordini Professori</h2>
    <div v-if="profOrders.length === 0" class="no-data">
      Nessun ordine da visualizzare sulla timeline
    </div>
    <div v-else class="timeline-container" ref="timelineRef">
      <div class="timeline-slots">
        <div 
          v-for="slot in timelineSlots" 
          :key="slot.time" 
          class="timeline-slot"
          :style="{ left: `${slot.position}%` }"
        >
          <div class="slot-time">{{ slot.label }}</div>
        </div>
      </div>

      <div class="timeline-orders">
        <div 
          v-for="order in timelineProfOrders" 
          :key="order.idOrdine" 
          class="timeline-order"
          :style="{ left: `${order.position}%` }"
        >
          <div class="order-detail-card">
            <div class="order-info">
              <span class="order-id">Ordine #{{ order.idOrdine }}</span>
              <span v-if="order.oraRitiro" class="order-time">{{ formatTime(order.oraRitiro) }}</span>
            </div>
            <div class="order-products">
              <div v-for="product in order.prodotti" :key="product.idProdotto" class="order-product">
                {{ product.nome }} x{{ product.quantita }}
              </div>
            </div>
            <div class="order-total">
              {{ formatCurrency(calculateOrderTotal(order)) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Current time indicator -->
      <div class="current-time-indicator" :style="{ left: `${currentTimePosition}%` }">
        <div class="time-label">{{ new Date(currentTime).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' }) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Define interfaces for component
interface Product {
  idProdotto: number;
  nome: string;
  quantita: number;
  prezzo: number;
}

interface Order {
  idOrdine: number;
  oraRitiro?: string;
  prodotti: Product[];
}

interface TurnoTimes {
  orderStart: string;
  orderEnd: string;
  pickupStart: string;
  pickupEnd: string;
}

interface TimelineOrder extends Order {
  position: number;
}

// Define props with proper types
const props = defineProps({
  profOrders: {
    type: Array as () => Order[],
    required: true
  },
  turnoTimes: {
    type: Object as () => TurnoTimes | null,
    required: true,
    // Provide default value to avoid null errors
    default: () => ({
      orderStart: '08:00',
      orderEnd: '10:00',
      pickupStart: '11:00',
      pickupEnd: '13:00'
    })
  }
})

// Current time management
const currentTime = ref(new Date())
const timelineRef = ref<HTMLElement | null>(null)
let timeUpdateInterval: number | undefined

// Function to update current time
const updateCurrentTime = () => {
  currentTime.value = new Date()
}

// Format time from database format to display format (HH:MM)
const formatTime = (time: string) => {
  if (!time) return ''
  
  // If time includes seconds (HH:MM:SS), remove them
  if (time.includes(':')) {
    const parts = time.split(':')
    return `${parts[0]}:${parts[1]}`
  }
  
  return time
}

// Convert a time string (HH:MM) to minutes since midnight
const timeToMinutes = (timeString: string): number => {
  if (!timeString) return 0
  
  try {
    const [hours, minutes] = timeString.split(':').map(Number)
    if (isNaN(hours) || isNaN(minutes)) return 0
    return hours * 60 + (minutes || 0)
  } catch (error) {
    console.error('Error parsing time:', error)
    return 0
  }
}

// Calculate the position on the timeline based on time
const calculateTimePosition = (time: string): number => {
  const startTime = 7 * 60 // 7:00 AM in minutes
  const endTime = 19 * 60 // 7:00 PM in minutes
  const timeInMinutes = timeToMinutes(time)
  
  // Calculate position as percentage
  return ((timeInMinutes - startTime) / (endTime - startTime)) * 100
}

// Calculated time slots for the timeline
const timelineSlots = computed(() => {
  const slots = []
  for (let hour = 7; hour <= 19; hour++) {
    slots.push({
      time: `${hour}:00`,
      position: calculateTimePosition(`${hour}:00`),
      label: `${hour}:00`
    })
  }
  return slots
})

// Calculate the current time position for the indicator
const currentTimePosition = computed(() => {
  const now = currentTime.value
  const timeString = `${now.getHours()}:${now.getMinutes()}`
  return calculateTimePosition(timeString)
})

// Organize professor orders by time
const timelineProfOrders = computed<TimelineOrder[]>(() => {
  if (!Array.isArray(props.profOrders)) return []
  
  return props.profOrders.map(order => {
    try {
      // Default to order time or current time + 30 min if not available
      const now = new Date()
      const futureTime = new Date(now.getTime() + 30 * 60000)
      const defaultTime = `${futureTime.getHours()}:${futureTime.getMinutes()}`
      
      const pickupTime = order.oraRitiro || formatTime(defaultTime)
      
      return {
        ...order,
        position: calculateTimePosition(pickupTime)
      }
    } catch (error) {
      console.error('Error processing order:', error, order)
      // Return a default position if there's an error
      return {
        ...order,
        position: 50 // Place in middle of timeline if there's an error
      }
    }
  })
})

// Calculate total price for an order
const calculateOrderTotal = (order: Order): number => {
  if (!order.prodotti || !Array.isArray(order.prodotti)) return 0
  
  return order.prodotti.reduce((total, product) => {
    const price = product.prezzo || 0
    const quantity = product.quantita || 0
    return total + (price * quantity)
  }, 0)
}

// Format price as currency
const formatCurrency = (amount: number): string => {
  return `€${amount.toFixed(2)}`
}

onMounted(() => {
  // Set up timer to update current time
  updateCurrentTime()
  timeUpdateInterval = window.setInterval(updateCurrentTime, 60000) // Update every minute
  
  // Scroll the timeline to position the current time indicator at around 20%
  setTimeout(() => {
    if (timelineRef.value) {
      const timelineWidth = timelineRef.value.scrollWidth
      const viewportWidth = timelineRef.value.clientWidth
      const scrollPosition = (currentTimePosition.value / 100 * timelineWidth) - (viewportWidth * 0.2)
      timelineRef.value.scrollLeft = Math.max(0, scrollPosition)
    }
  }, 500) // Small delay to ensure the DOM is ready
})

onUnmounted(() => {
  // Clear the interval when component is unmounted
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval)
  }
})
</script>

<style scoped>
.timeline-section {
  height: 20vh; /* Set to 20% of the viewport height */
  min-height: 180px;
  margin-bottom: 20px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 15px;
  background-color: var(--card-bg);
  box-shadow: 0 2px 8px var(--card-shadow);
  flex-shrink: 0; /* Prevent timeline from shrinking when space is tight */
}

.timeline-section h2 {
  margin-top: 0;
  font-size: 1.4rem;
  color: var(--poldo-primary);
}

.no-data {
  text-align: center;
  padding: 20px;
  color: var(--poldo-text);
}

.timeline-container {
  position: relative;
  height: calc(100% - 40px); 
  overflow-x: auto;
  white-space: nowrap;
  border-top: 2px solid var(--poldo-primary);
  padding-top: 10px;
  background-color: var(--poldo-background-soft);
  border-radius: 4px;
}

.timeline-slots {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  pointer-events: none;
}

.timeline-slot {
  position: absolute;
  top: 0;
  height: 100%;
  border-left: 1px dashed var(--color-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  pointer-events: none;
  width: 2px;
}

.slot-time {
  font-size: 0.8rem;
  color: var(--poldo-text);
  margin-bottom: 5px;
  transform: translateX(-50%);
  white-space: nowrap;
}

/* Orders on timeline */
.timeline-orders {
  position: relative;
  height: calc(100% - 25px); /* Account for time labels at bottom */
  margin-top: 10px;
  padding-bottom: 20px;
}

.timeline-order {
  position: absolute;
  top: 5px;
  transform: translateX(-50%);
  max-width: 200px;
  padding: 0;
  pointer-events: auto;
  z-index: 1;
}

.order-detail-card {
  padding: 8px;
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 4px var(--card-shadow);
  white-space: normal;
  width: 180px;
  max-height: calc(100% - 20px);
  overflow-y: auto;
  font-size: 0.85rem;
  border-left: 3px solid var(--poldo-primary);
}

.order-detail-card .order-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 5px;
  font-weight: bold;
}

.order-detail-card .order-id {
  color: var(--poldo-primary);
  font-size: 0.8rem;
}

.order-detail-card .order-time {
  font-size: 0.8rem;
  background-color: var(--poldo-background-soft);
  padding: 2px 4px;
  border-radius: 4px;
}

.order-detail-card .order-products {
  margin: 5px 0;
  max-height: 70px;
  overflow-y: auto;
}

.order-detail-card .order-product {
  padding: 2px 0;
  border-bottom: 1px dotted var(--color-border);
  font-size: 0.8rem;
}

.order-detail-card .order-product:last-child {
  border-bottom: none;
}

.order-detail-card .order-total {
  margin-top: 5px;
  font-weight: bold;
  color: var(--poldo-accent);
  text-align: right;
  font-size: 0.9rem;
}

/* Current time indicator */
.current-time-indicator {
  position: absolute;
  top: 0;
  height: 100%;
  width: 2px;
  background-color: var(--poldo-red);
  pointer-events: none;
  z-index: 2;
}

.current-time-indicator .time-label {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--poldo-red);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .timeline-container {
    height: 120px;
  }
}
</style>