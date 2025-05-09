<template>  <div class="timeline-section">
    <div class="timeline-header">
      <h2>Timeline Ordini Professori</h2>
      <div class="timeline-header-actions">
        <span class="orders-count">{{ profOrders.length }} ordini</span>
        <button @click="$emit('reload')" class="reload-btn">Ricarica</button>
      </div>
    </div>    <div v-if="profOrders.length === 0" class="no-data">
      Nessun ordine da visualizzare sulla timeline
    </div>
    <div v-else-if="!timelineProfOrders || timelineProfOrders.length === 0" class="no-data">
      <p>Ci sono {{ profOrders.length }} ordini di professori, ma nessuno con orario di ritiro valido.</p>
      <div class="debug-info">
        <h4>Debug Ordini ({{ profOrders.length }})</h4>
        
        <div class="debug-controls">
          <button @click="$emit('reload')" class="debug-btn">Ricarica Dati</button>
        </div>
        
        <div class="debug-table">          <div class="debug-header">
            <div class="debug-col">#ID</div>
            <div class="debug-col">Professore</div>
            <div class="debug-col">Prodotti</div>
            <div class="debug-col">Ora Ritiro</div>
            <div class="debug-col">Formato</div>
            <div class="debug-col">Posizione</div>
          </div>
          
          <div v-for="(order, index) in profOrders" :key="index" class="debug-row">
            <div class="debug-col">{{ order.idOrdine }}</div>
            <div class="debug-col">{{ order.userData?.cognome || 'N/A' }}</div>
            <div class="debug-col">{{ order.prodotti?.length || 0 }} prodotti</div>
            <div class="debug-col" :class="{'missing': !order.oraRitiro}">
              {{ order.oraRitiro || 'MANCANTE' }}
            </div>
            <div class="debug-col">{{ order.oraRitiro ? formatTime(order.oraRitiro) : 'N/A' }}</div>
            <div class="debug-col">{{ order.oraRitiro ? calculateTimePosition(formatTime(order.oraRitiro)) + '%' : 'N/A' }}</div>
          </div>
        </div>
      </div>
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
        >          <div class="order-detail-card">
            <div class="order-header">
              <div class="order-info">
                <span class="order-id">
                  {{ getUserDisplayName(order) }}
                </span>
                <span v-if="order.oraRitiro" class="order-time">{{ formatTime(order.oraRitiro) }}</span>
              </div>
              <div class="order-id-number">Ordine #{{ order.idOrdine }}</div>
            </div>
            <div class="order-products-title">Prodotti ordinati:</div>
            <div class="order-products">
              <div v-for="product in order.prodotti" :key="product.idProdotto" class="order-product">
                <span class="product-quantity">x{{ product.quantita }}</span>
                <span class="product-name">{{ product.nome }}</span>
                <span class="product-price">{{ formatCurrency(product.prezzo * product.quantita) }}</span>
              </div>
            </div>
            <div class="order-total">
              Totale: {{ formatCurrency(calculateOrderTotal(order)) }}
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

// Definisce le interfacce per il componente
interface Product {
  idProdotto: number;
  nome: string;
  quantita: number;
  prezzo: number;
}

interface Order {
  idOrdine: number;
  user?: number;
  classe?: string;
  oraRitiro?: string;
  prodotti: Product[];
  userData?: any;
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

// Definisce le props con tipi appropriati
const props = defineProps({
  profOrders: {
    type: Array as () => Order[],
    required: true
  },
  turnoTimes: {
    type: Object as () => TurnoTimes | null,
    required: true,
    // Fornisce un valore predefinito per evitare errori null
    default: () => ({
      orderStart: '08:00',
      orderEnd: '10:00',
      pickupStart: '11:00',
      pickupEnd: '13:00'
    })
  }
})

// Definisce gli eventi emessi
const emit = defineEmits(['reload'])

// Gestione dell'ora corrente
const currentTime = ref(new Date())
const timelineRef = ref<HTMLElement | null>(null)
let timeUpdateInterval: number | undefined

// Funzione per aggiornare l'ora corrente
const updateCurrentTime = () => {
  currentTime.value = new Date()
}

// Formatta l'orario dal formato del database al formato di visualizzazione (HH:MM)
const formatTime = (time: string | number) => {
  if (!time) {
    console.warn('Orario vuoto passato a formatTime');
    return '';
  }
  
  try {
    
    // Se l'orario è un numero, convertilo prima in stringa
    if (typeof time === 'number') {
      time = time.toString();
    } else if (typeof time !== 'string') {
      // Se l'orario non è una stringa o un numero, torna a stringa vuota
      time = '';
    }
    
    // Assicurati di lavorare con una stringa
    const timeStr = String(time);
    
    // Se l'orario include i secondi (HH:MM:SS), rimuovili
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      if (parts.length >= 2) {
        // Assicurati che ore e minuti siano a due cifre
        const hours = parts[0].padStart(2, '0');
        const minutes = parts[1].padStart(2, '0');
        return `${hours}:${minutes}`;
      }
    }
    
    // Se l'orario è nel formato HHMM (es. 1430), convertilo in HH:MM
    if (timeStr.length === 4 && !timeStr.includes(':') && !isNaN(Number(timeStr))) {
      return `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}`;
    }
    
    // Se l'orario è solo un'ora (es. "14"), aggiungi i minuti
    if (timeStr.length <= 2 && !isNaN(Number(timeStr))) {
      return `${timeStr.padStart(2, '0')}:00`;
    }
    
    // Se l'orario contiene un punto invece di due punti (es. "14.30")
    if (timeStr.includes('.')) {
      const [hours, minutes] = timeStr.split('.');
      return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    }
    
    // Ultima risorsa: prova a estrarre le cifre e formattarle
    const digits = timeStr.replace(/[^0-9]/g, '');
    if (digits.length >= 3) {
      const hours = digits.substring(0, 2);
      const minutes = digits.substring(2, 4).padEnd(2, '0');
      return `${hours}:${minutes}`;
    }
    
    console.warn(`Impossibile formattare l'orario: "${time}"`);
    return timeStr;
  } catch (error) {
    console.error('Errore nella formattazione dell\'orario:', time, error);
    return String(time) || '';
  }
}

// Converte una stringa di orario (HH:MM) in minuti dalla mezzanotte
const timeToMinutes = (timeString: string): number => {
  if (!timeString) {
    console.warn('Stringa di orario vuota passata a timeToMinutes');
    return 0;
  }
  
  try {
    // Se già nel formato HH:MM, semplicemente converti in minuti
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        console.warn(`Formato HH:MM non valido in "${timeString}"`);
        return 0;
      }
      return hours * 60 + (minutes || 0);
    }
    
    // Se nel formato HHMM (es. "1430")
    if (timeString.length === 4 && !timeString.includes(':') && !isNaN(Number(timeString))) {
      const hours = Number(timeString.substring(0, 2));
      const minutes = Number(timeString.substring(2, 4));
      if (isNaN(hours) || isNaN(minutes)) {
        console.warn(`Formato HHMM non valido in "${timeString}"`);
        return 0;
      }
      return hours * 60 + minutes;
    }
    
    // Se solo ore (es. "14")
    if (timeString.length <= 2 && !isNaN(Number(timeString))) {
      const hours = Number(timeString);
      return hours * 60;
    }
    
    // Se è qualcosa come "12.30" (con punto invece di due punti)
    if (timeString.includes('.')) {
      const [hours, minutes] = timeString.split('.').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        console.warn(`Formato ore.minuti non valido in "${timeString}"`);
        return 0;
      }
      return hours * 60 + minutes;
    }
    
    console.warn(`Formato orario non riconosciuto: "${timeString}"`);
    
    // Ultima risorsa: prova a estrarre i numeri e usarli
    const numbersOnly = timeString.replace(/[^0-9]/g, '');
    if (numbersOnly.length >= 3) {
      const hours = Number(numbersOnly.substring(0, 2));
      const minutes = Number(numbersOnly.substring(2));
      return hours * 60 + (minutes || 0);
    }
    
    return 0;
  } catch (error) {
    console.error(`Errore nell'analisi dell'orario "${timeString}":`, error);
    return 0;
  }
}

// Calcola la posizione sulla timeline in base all'orario
const calculateTimePosition = (time: string): number => {
  // Usa un intervallo più ampio per la timeline (7:00 AM a 3:00 PM)
  const startTime = 7 * 60; // 7:00 in minuti
  const endTime = 15 * 60; // 15:00 in minuti
  const timeInMinutes = timeToMinutes(time);
    
  // Calcola la posizione come percentuale
  return Math.max(0, Math.min(100, ((timeInMinutes - startTime) / (endTime - startTime)) * 100));
}

// Slot temporali calcolati per la timeline
const timelineSlots = computed(() => {
  const slots = []
  // Crea slot per ogni mezz'ora dalle 7:00 alle 15:00 (3 PM)
  for (let hour = 7; hour <= 15; hour++) {
    // Aggiungi l'ora intera
    slots.push({
      time: `${hour}:00`,
      position: calculateTimePosition(`${hour}:00`),
      label: `${hour}:00`
    })
    
    // Aggiungi la mezz'ora (tranne per l'ultima ora)
    if (hour < 15) {
      slots.push({
        time: `${hour}:30`,
        position: calculateTimePosition(`${hour}:30`),
        label: `${hour}:30`
      })
    }
  }
  return slots
})

// Calcola la posizione dell'ora corrente per l'indicatore
const currentTimePosition = computed(() => {
  const now = currentTime.value
  const timeString = `${now.getHours()}:${now.getMinutes()}`
  return calculateTimePosition(timeString)
})

// Organizza gli ordini dei professori per orario
const timelineProfOrders = computed<TimelineOrder[]>(() => { 
  if (!Array.isArray(props.profOrders)) {
    console.warn("profOrders non è un array");
    return [];
  }
  
  if (props.profOrders.length === 0) {
    console.warn("Nessun ordine di professori da visualizzare");
    return [];
  }
  
  // Filtra gli ordini solo per quelli con oraRitiro
  const ordersWithRitiro = props.profOrders.filter(order => 
    order && typeof order === 'object' && order.oraRitiro !== undefined && order.oraRitiro !== null
  );
  
  
  if (ordersWithRitiro.length === 0) {
    console.warn("Nessun ordine con ritiro trovato");
    return [];
  }
    return ordersWithRitiro.map(order => {
    try {
      // Usa l'orario di ritiro dell'ordine
      const pickupTime = formatTime(order.oraRitiro || '');
      const position = calculateTimePosition(pickupTime);
      
      if (isNaN(position) || position < 0 || position > 100) {
        console.error(`Posizione non valida per l'ordine ${order.idOrdine}:`, position);
        // Prova a recuperare con una posizione predefinita nell'intervallo visibile
        return {
          ...order,
          position: 50 // Posiziona al centro della timeline
        };
      }
      
      return {
        ...order,
        position: position
      };
    } catch (error) {
      console.error('Errore nell\'elaborazione dell\'ordine:', error, order);
      // Restituisci una posizione predefinita se c'è un errore
      return {
        ...order,
        position: 50 // Posiziona al centro della timeline se c'è un errore
      };
    }
  });
})

// Calcola il prezzo totale per un ordine
const calculateOrderTotal = (order: Order): number => {
  if (!order.prodotti || !Array.isArray(order.prodotti)) return 0
  
  return order.prodotti.reduce((total, product) => {
    const price = product.prezzo || 0
    const quantity = product.quantita || 0
    return total + (price * quantity)
  }, 0)
}

// Formatta il prezzo come valuta
const formatCurrency = (amount: number): string => {
  return `€${amount.toFixed(2)}`
}

// Ottieni il nome di visualizzazione dell'utente dai dati utente o torna alla classe
const getUserDisplayName = (order: any): string => {
  // Se abbiamo userData, usa il nome dell'utente da quello
  if (order.userData && (order.userData.nome || order.userData.cognome)) {
    return `Prof. ${order.userData.cognome || ''} ${order.userData.nome || ''}`.trim();
  }
  
  // Fallback alla classe se disponibile
  if (order.classe) {
    return `Prof. ${order.classe}`;
  }
  
  // Ultima risorsa - mostra l'ID utente se disponibile
  if (order.user) {
    return `Prof. #${order.user}`;
  }
  
  // Se tutto il resto fallisce
  return 'Professore sconosciuto';
}

onMounted(() => {
  // Imposta un timer per aggiornare l'ora corrente
  updateCurrentTime()
  timeUpdateInterval = window.setInterval(updateCurrentTime, 60000) // Aggiorna ogni minuto
  
  // Scorri la timeline per posizionare l'indicatore dell'ora corrente a circa il 20%
  setTimeout(() => {
    if (timelineRef.value) {
      const timelineWidth = timelineRef.value.scrollWidth
      const viewportWidth = timelineRef.value.clientWidth
      const scrollPosition = (currentTimePosition.value / 100 * timelineWidth) - (viewportWidth * 0.2)
      timelineRef.value.scrollLeft = Math.max(0, scrollPosition)
    }
  }, 500) // Piccolo ritardo per assicurarsi che il DOM sia pronto
})

onUnmounted(() => {
  // Cancella l'intervallo quando il componente viene smontato
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
  max-width: 250px;
  padding: 0;
  pointer-events: auto;
  z-index: 1;
}

.order-detail-card {
  padding: 10px;
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 4px var(--card-shadow);
  white-space: normal;
  width: 220px;
  max-height: calc(100% - 20px);
  overflow-y: auto;
  font-size: 0.85rem;
  border-left: 3px solid var(--poldo-primary);
}

.order-detail-card .order-header {
  margin-bottom: 8px;
}

.order-detail-card .order-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  padding-bottom: 5px;
  font-weight: bold;
  border-bottom: 1px solid var(--color-border);
}

.order-detail-card .order-id-number {
  font-size: 0.75rem;
  color: var(--poldo-text);
  opacity: 0.7;
}

.order-detail-card .order-id {
  color: var(--poldo-primary);
  font-size: 0.9rem;
}

.order-detail-card .order-time {
  font-size: 0.8rem;
  background-color: var(--poldo-background-soft);
  padding: 2px 4px;
  border-radius: 4px;
}

.order-detail-card .order-products-title {
  font-size: 0.8rem;
  font-weight: bold;
  margin-bottom: 4px;
  color: var(--poldo-text);
}

.order-detail-card .order-products {
  margin: 0 0 8px 0;
  max-height: 120px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 2px;
  background-color: var(--poldo-background-soft);
}

.order-detail-card .order-product {
  padding: 4px;
  border-bottom: 1px dotted var(--color-border);
  font-size: 0.8rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.order-detail-card .product-quantity {
  font-weight: bold;
  color: var(--poldo-primary);
  margin-right: 6px;
  min-width: 24px;
  text-align: center;
}

.order-detail-card .product-name {
  flex: 1;
}

.order-detail-card .product-price {
  width: 100%;
  text-align: right;
  font-size: 0.75rem;
  color: var(--poldo-accent);
  margin-top: 2px;
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
  background-color: var(--poldo-background-soft);
  padding: 4px 8px;
  border-radius: 4px;
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

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.timeline-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.orders-count {
  background-color: var(--poldo-background-soft);
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  color: var(--poldo-text);
}

.reload-btn {
  padding: 5px 10px;
  background-color: var(--poldo-primary, #4caf50);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.reload-btn:hover {
  background-color: var(--poldo-primary-dark, #388e3c);
}

@media (max-width: 768px) {
  .timeline-container {
    height: 120px;
  }
}

.debug-info {
  margin-top: 15px;
  padding: 10px;
  border: 1px dashed #ccc;
  background-color: #f9f9f9;
  text-align: left;
  font-size: 0.8rem;
  max-height: 300px;
  overflow-y: auto;
}

.debug-order {
  margin-bottom: 5px;
  padding: 3px;
  border-bottom: 1px solid #eee;
}

.debug-controls {
  margin-bottom: 10px;
  display: flex;
  gap: 10px;
}

.debug-btn {
  padding: 5px 10px;
  background-color: var(--poldo-primary, #4caf50);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.debug-table {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow-x: auto;
}

.debug-header {
  display: flex;
  background-color: #eee;
  font-weight: bold;
  padding: 5px;
  border-bottom: 2px solid #ddd;
}

.debug-row {
  display: flex;
  border-bottom: 1px solid #eee;
  padding: 5px;
}

.debug-row:nth-child(even) {
  background-color: rgba(0,0,0,0.02);
}

.debug-col {
  flex: 1;
  padding: 2px 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.missing {
  color: #d32f2f;
  font-weight: bold;
}
</style>