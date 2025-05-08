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
  userData?: any // Added for user data
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
const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Use the function to get today's date in local timezone
const selectedDate = ref(formatDate(new Date())) // Format: YYYY-MM-DD

// Use computed property to get available turni from the store
const availableTurni = computed(() => turnoStore.turni)

// Always show the professor timeline, regardless of selected turno
const showProfessorTimeline = computed(() => {  
  // Always show the timeline if we have professor orders, regardless of selected turno
  return profOrders.value.length > 0;
})


// User cache to avoid multiple API calls for the same user
const userCache = ref<{[key: number]: any}>({});

// Fetch user information by ID
const fetchUserById = async (userId: number) => {
  // If we already have the user data in cache, return it
  if (userCache.value[userId]) {
    return userCache.value[userId];
  }
  
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/utenti/${userId}`, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user data for ID ${userId}`);
    }
    
    const userData = await response.json();
    
    // Store in cache for future use
    userCache.value[userId] = userData;
    
    return userData;
  } catch (error) {
    console.error(`Error fetching user data for ID ${userId}:`, error);
    return null;
  }
}

// Fetch professor orders - use /classi/prof endpoint
const fetchProfOrders = async () => {
  loading.value = true
  try {
    console.log("Fetching professor orders for date:", selectedDate.value);
    
    // Use /classi/prof endpoint for professor orders
    const url = `${API_CONFIG.BASE_URL}/ordini/classi/prof?startDate=${selectedDate.value}&endDate=${selectedDate.value}&nTurno=2`;
    console.log("API URL:", url);
    
    const response = await fetch(url, { headers })
    
    if (!response.ok) {
      throw new Error(`API error with status ${response.status}`)
    }
    
    const data = await response.json()
    console.log("Professor orders data:", data) // Debug log
    console.log("Professor orders count:", data.length);
    
    // Show detailed info for first order if exists
    console.log("First professor order:", data.length > 0 ? {
      idOrdine: data[0].idOrdine,
      classe: data[0].classe,
      oraRitiro: data[0].oraRitiro,
      oraRitiroType: typeof data[0].oraRitiro,
      hasRitiro: !!data[0].oraRitiro,
      user: data[0].user,
      prodotti: data[0].prodotti?.length || 0
    } : "No orders") // Debug first order 
    
    // For professor orders, process each order and fetch user information
    const processedOrders = [];
    for (const order of data) {
      try {
        // Ensure the order has all required properties to avoid errors
        const processedOrder = {
          ...order,
          prodotti: Array.isArray(order.prodotti) ? order.prodotti : [],
          classe: order.classe || 'Sconosciuto',
          userRole: 'prof', // Add role explicitly for better filtering
          // Make sure oraRitiro is present and in the correct format (HH:MM)
          oraRitiro: order.oraRitiro ? order.oraRitiro : null
        };
        
        // Debug oraRitiro value
        if (order.oraRitiro) {
          console.log(`Order ${order.idOrdine} has oraRitiro: ${order.oraRitiro} (${typeof order.oraRitiro})`);
        }
        
        // Fetch user information if there's a user ID
        if (order.user) {
          const userData = await fetchUserById(order.user);
          if (userData) {
            processedOrder.userData = userData; // Add user data to the order
          }
        }
        
        processedOrders.push(processedOrder);
      } catch (err) {
        console.error("Error processing professor order:", err, order);
      }
    }
      console.log("Processed orders with oraRitiro:", processedOrders.filter(o => o.oraRitiro).length);
    console.log("Sample processed order:", processedOrders.length > 0 ? {
      idOrdine: processedOrders[0].idOrdine,
      classe: processedOrders[0].classe,
      oraRitiro: processedOrders[0].oraRitiro,
      hasRitiro: !!processedOrders[0].oraRitiro,
      user: processedOrders[0].user,
      userData: processedOrders[0].userData,
      prodotti: processedOrders[0].prodotti?.length || 0
    } : "No orders");
    
    profOrders.value = processedOrders;
    
    console.log("Processed professor orders:", profOrders.value.length)
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
    
    // Filter orders for the selected turno and ensure they have proper structure
    classOrders.value = data
      .map((order: any) => ({
        ...order,
        prodotti: Array.isArray(order.prodotti) ? order.prodotti : [],
        classe: order.classe || 'Sconosciuta',
        confermato: order.confermato === undefined ? true : order.confermato
      }))
    
    console.log("Processed class orders:", classOrders.value.length)
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
  console.log("Selected turno times:", selectedTurno.value, turno) // Debug log
  if (!turno) {
    console.error(`Turno ${selectedTurno.value} not found!`);
    error.value = `Turno ${selectedTurno.value} non trovato. Selezionare un altro turno.`
    
    // Return default values to prevent errors
    return {
      orderStart: '08:00',
      orderEnd: '10:00',
      pickupStart: '11:00',
      pickupEnd: '13:00'
    };
  }
  
  // Ensure all time properties have valid values
  return {
    orderStart: turno.oraInizio || '08:00',
    orderEnd: turno.oraFine || '10:00',
    pickupStart: turno.inizioRitiro || '11:00',
    pickupEnd: turno.fineRitiro || '13:00'
  }
})

// Handle turno switch
const handleTurnoChange = async (turno: number) => {
  selectedTurno.value = turno;
  turnoStore.selectTurno(turno);
  
  // Always make sure we have professor data loaded
  await fetchProfOrders();
  
  if (turno === 2) {
    // When switching to turno 2 (professors), use the professor orders
    console.log(`Using professor orders for turno ${turno}, found ${profOrders.value.length} orders`);
    
    // For turno 2, we also need to update classOrders with professor data
    // Since the ClassOrders component uses classOrders
    classOrders.value = profOrders.value.map(order => ({
      ...order,
      classe: order.classe || 'Sconosciuto',
      data: order.data,
      prodotti: Array.isArray(order.prodotti) ? order.prodotti : [],
      confermato: order.confermato === undefined ? true : order.confermato,
      oraRitiro: order.oraRitiro,
      userData: order.userData
    }));
    
    console.log("Updated classOrders with professor data:", classOrders.value.length);
  } else {
    // For other turnos, fetch class orders
    await fetchClassOrders();
  }
}

// Handle date change
const handleDateChange = async (event: Event) => {
  const newDate = (event.target as HTMLInputElement).value
  selectedDate.value = newDate
  
  // Always fetch professor data
  await fetchProfOrders()
  
  if (selectedTurno.value === 2) {
    // If we're in turno 2, use professor data for class orders
    classOrders.value = profOrders.value.map(order => ({
      ...order,
      classe: order.classe || 'Sconosciuto',
      data: order.data,
      prodotti: Array.isArray(order.prodotti) ? order.prodotti : [],
      confermato: order.confermato === undefined ? true : order.confermato,
      oraRitiro: order.oraRitiro,
      userData: order.userData
    }));
    console.log("Updated classOrders with professor data:", classOrders.value.length);
  } else {
    // For other turnos, fetch class orders
    await fetchClassOrders()
  }
}

// Toggle order details modal
const toggleOrderDetails = (orders: Order[]) => {
  selectedOrderDetails.value = orders
  showOrderDetails.value = !showOrderDetails.value
}

onMounted(async () => {
  await turnoStore.fetchTurni()
  
  // Always fetch professor data regardless of selected turno
  await fetchProfOrders()
  
  // Now set up the selected turno based on store data or default
  if (turnoStore.turnoSelezionato > 0) {
    selectedTurno.value = turnoStore.turnoSelezionato
  } else if (availableTurni.value.length > 0) {
    // Select the first available turno
    selectedTurno.value = availableTurni.value[0].n
  }
  
  // Update the store with our selection
  turnoStore.selectTurno(selectedTurno.value)
  console.log("Selected turno:", selectedTurno.value)
  
  // Handle data loading based on selected turno
  if (selectedTurno.value === 2) {
    // For turno 2, use professor data already loaded
    classOrders.value = profOrders.value.map(order => ({
      ...order,
      classe: order.classe || 'Sconosciuto',
      data: order.data,
      prodotti: Array.isArray(order.prodotti) ? order.prodotti : [],
      confermato: order.confermato === undefined ? true : order.confermato,
      oraRitiro: order.oraRitiro,
      userData: order.userData
    }));
  } else {
    // For other turnos, fetch class orders
    await fetchClassOrders()
  }
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

    <div v-else>      <!-- Date selector -->
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
        @reload="fetchProfOrders"
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