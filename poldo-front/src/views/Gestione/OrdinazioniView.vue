<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Alert from '@/components/Alert.vue'
import { useTurnoStore } from '@/stores/turno'

// Import the extracted components
import ProfessorTimeline from '@/components/Gestione/ProfessorTimeline.vue'
import TurnoTabs from '@/components/Gestione/TurnoTabs.vue'
import ProductTotals from '@/components/Gestione/ProductTotals.vue'
import ClassOrders from '@/components/Gestione/ClassOrders.vue'

// Import and initialize the turno store
const turnoStore = useTurnoStore()

// API configuration with the admin token
const API_CONFIG = {
  BASE_URL: 'http://figliolo.it:5005/v1',
  TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDgsInJ1b2xvIjoiYWRtaW4iLCJpYXQiOjE3NDQyNzk2ODMsImV4cCI6MTc3NTgzNzI4M30.AelK6BkvrydKSqNGuXbzWGzST4yctrHvdjy66XeoMHI"
}

// Headers for API requests using the admin token
const headers = new Headers({
  Authorization: `Bearer ${API_CONFIG.TOKEN}`,
  Accept: 'application/json',
  'Content-Type': 'application/json'
})

interface Product {
  idProdotto: number
  nome: string
  quantita: number
  prezzo: number
}

interface Order {
  idOrdine: number
  data: string
  nTurno: number
  giorno: string
  user: number
  classe: string
  confermato: boolean
  preparato: boolean
  oraRitiro?: string 
  prodotti: Product[]
  userRole?: string 
}

interface ClassOrder {
  classe: string
  data: string
  prodotti: Product[]
  confermato?: boolean
  oraRitiro?: string
}

interface TimeSlot {
  time: string
  orders: Order[]
}

interface Turno {
  id: number
  n: number
  giorno: string
  oraInizioOrdine: string
  oraFineOrdine: string
  oraInizioRitiro: string
  oraFineRitiro: string
  nome?: string 
}

const orders = ref<Order[]>([]) 
const classOrders = ref<ClassOrder[]>([]) 
const profOrders = ref<Order[]>([]) 
const loading = ref(true)
const error = ref<string | null>(null)
const selectedTurno = ref(1)
const showOrderDetails = ref(false)
const selectedOrderDetails = ref<Order[]>([])
const timeSlots = ref<TimeSlot[]>([])

// Get today's date in local timezone (YYYY-MM-DD)
const getTodayLocalDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  console.log("Formatted date:", `${year}-${month}-${day}`) // Debug log
  return `${year}-${month}-${day}`
}

// Use the function to get today's date in local timezone
const selectedDate = ref(getTodayLocalDate()) // Format: YYYY-MM-DD

// Use computed property to get available turni from the store
const availableTurni = computed(() => turnoStore.turni)

// Add a computed property for professor orders specifically 
const showProfessorTimeline = computed(() => profOrders.value.length > 0)

// TODO: usa libreria
const generateTimeSlots = () => {
  const slots: TimeSlot[] = []
  for (let hour = 7; hour <= 18; hour++) {
    for (let minute of ['00', '30']) {
      slots.push({
        time: `${hour}:${minute}`,
        orders: []
      })
    }
  }
  return slots
}

// Fetch professor orders - use turno=2
const fetchProfOrders = async () => {
  loading.value = true
  try {
    // Use turno 2 for professor orders, with startDate and endDate both set to the selected date
    const response = await fetch(`${API_CONFIG.BASE_URL}/ordini?startDate=${selectedDate.value}&endDate=${selectedDate.value}&nTurno=2`, { headers })
    console.log("selectedDate:", selectedDate.value) // Debug log
    if (!response.ok) {
      throw new Error(`API error with status ${response.status}`)
    }
    
    const data = await response.json()
    console.log("Professor orders data:", data) // Debug log
    
    // For professor orders, the classe attribute contains the professor's name
    // We can identify professors by checking if nTurno is 2
    profOrders.value = data.filter((order: any) => order.nTurno === 2)
  } catch (err) {
    console.error('Error fetching professor orders:', err)
    error.value = 'Errore nel caricamento degli ordini dei professori.'
    profOrders.value = []
  } finally {
    loading.value = false
  }
}

// Fetch orders by class
const fetchClassOrders = async () => {
  loading.value = true
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/ordini/classi?startDate=${selectedDate.value}&endDate=${selectedDate.value}&nTurno=${selectedTurno.value}`, { headers })

    if (!response.ok) {
      throw new Error(`API error with status ${response.status}`)
    }
    
    const data = await response.json()
    console.log("Class orders data:", data) // Debug log
    
    // For turno 2 (professors), use professor orders directly instead of class orders
    if (selectedTurno.value === 2) {
      // Use profOrders data converted to ClassOrder format
      classOrders.value = profOrders.value.map(order => ({
        classe: order.classe,
        data: order.data,
        prodotti: order.prodotti,
        confermato: order.confermato,
        oraRitiro: order.oraRitiro
      }))
    } else {
      // Normal case for student/class orders
      classOrders.value = data.filter((order: any) => {
        // Make sure to use orders for the selected turno
        return order.nTurno === selectedTurno.value;
      });
    }
  } catch (err) {
    console.error('Error fetching class orders:', err)
    error.value = 'Errore nel caricamento degli ordini per classe.'
  } finally {
    loading.value = false
  }
}

// Get turno times for the selected turno
const selectedTurnoTimes = computed(() => {
  const turno = turnoStore.turni.find(t => t.n === selectedTurno.value)
  if (!turno) {
    console.error(`Turno ${selectedTurno.value} not found!`);
    error.value = `Turno ${selectedTurno.value} non trovato. Selezionare un altro turno.`
    
    // Return null to indicate a missing turno, which will be handled in the UI
    return null;
  }
  
  return {
    orderStart: turno.oraInizio,
    orderEnd: turno.oraFine,
    pickupStart: turno.inizioRitiro,
    pickupEnd: turno.fineRitiro
  }
})

// Handle turno switch
const handleTurnoChange = (turno: number) => {
  selectedTurno.value = turno
  turnoStore.selectTurno(turno)
  fetchClassOrders()
}

// Handle date change
const handleDateChange = (event: Event) => {
  const newDate = (event.target as HTMLInputElement).value
  selectedDate.value = newDate
  
  fetchClassOrders()
  fetchProfOrders()
}

// Toggle order details modal
const toggleOrderDetails = (orders: Order[]) => {
  selectedOrderDetails.value = orders
  showOrderDetails.value = !showOrderDetails.value
}

onMounted(async () => {
  await turnoStore.fetchTurni()
  
  // If there's a previously selected turno in the store, use it
  if (turnoStore.turnoSelezionato > 0) {
    selectedTurno.value = turnoStore.turnoSelezionato
  } else if (availableTurni.value.length > 0) {
    // Otherwise set the first available turno - make sure to use the n property (ID)
    selectedTurno.value = availableTurni.value[0].n
    turnoStore.selectTurno(selectedTurno.value)
  }
  
  fetchClassOrders()
  fetchProfOrders() // Fetch professor orders independently
})
</script>

<template>
  <div class="ordinazioni-view">

    <!-- Loading and error states -->
    <div v-if="loading || turnoStore.loading" class="loading-indicator">
      <p>Caricamento ordinazioni...</p>
    </div>

    <div v-else-if="error || turnoStore.error" class="error-message">
      <p>{{ error || turnoStore.error }}</p>
      <button @click="turnoStore.fetchTurni().then(() => { fetchClassOrders(); fetchProfOrders(); })">Riprova</button>
    </div>

    <div v-else>
      <!-- Date selector -->
      <div class="date-selector">
        <label for="order-date">Data Ordini:</label>
        <input 
          type="date" 
          id="order-date" 
          :value="selectedDate" 
          @change="handleDateChange"
          class="date-input"
        />
      </div>

      <!-- Timeline section for professor orders using the ProfessorTimeline component -->
      <ProfessorTimeline 
        v-if="showProfessorTimeline"
        :profOrders="profOrders" 
        :turnoTimes="selectedTurnoTimes"
      />

      <!-- Orders section (bottom) -->
      <div class="orders-section">
        <!-- Use the TurnoTabs component -->
        <TurnoTabs 
          :availableTurni="availableTurni" 
          :selectedTurno="selectedTurno"
          @turnoChange="handleTurnoChange"
        />

        <div class="orders-content">
          <!-- Use the ProductTotals component -->
          <ProductTotals :classOrders="classOrders" />
          
          <!-- Use the ClassOrders component -->
          <ClassOrders 
            :classOrders="classOrders"
            :selectedTurno="selectedTurno"
          />
        </div>
      </div>
    </div>

    <!-- Order details modal -->
    <Alert 
      v-if="showOrderDetails" 
      type="info" 
      :message="'Dettagli Ordini'"
      @close="showOrderDetails = false"
    >
      <div class="order-details">
        <div v-for="order in selectedOrderDetails" :key="order.idOrdine" class="detail-item">
          <div class="detail-header">
            <span>Ordine #{{ order.idOrdine }}</span>
            <span>Classe {{ order.classe }}</span>
          </div>
          <div class="detail-products">
            <div v-for="product in order.prodotti" :key="product.idProdotto" class="detail-product">
              {{ product.nome }} x{{ product.quantita }}
            </div>
          </div>
        </div>
      </div>
    </Alert>
  </div>
</template>

<style scoped>
.ordinazioni-view {
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px;
  color: var(--poldo-text);
}

h1 {
  margin-bottom: 20px;
  color: var(--poldo-primary);
}

.loading-indicator,
.error-message,
.no-data {
  text-align: center;
  padding: 20px;
  color: var(--poldo-text);
}

.error-message {
  color: var(--poldo-red);
}

.error-message button {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: var(--poldo-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Date selector styles */
.date-selector {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-selector label {
  font-weight: 500;
  color: var(--poldo-primary);
}

.date-input {
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  width: 200px;
  background-color: var(--card-bg);
  color: var(--poldo-text);
}

/* Orders section styles */
.orders-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(80vh - 250px); 
  overflow: hidden;
}

.orders-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

/* Order details styles */
.order-details {
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
}

.detail-item {
  background-color: var(--card-bg);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px var(--card-shadow);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 5px;
}

.detail-products {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

/* Responsive styles */
@media (max-width: 768px) {
  .orders-content {
    flex-direction: column;
  }
}
</style>