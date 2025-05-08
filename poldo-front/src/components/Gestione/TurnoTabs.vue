<template>  <div class="turno-tabs">
    <!-- Changed to show all turni, including turno 2 for professors -->
    <button 
      v-for="turno in availableTurni" 
      :key="turno.n" 
      class="turno-tab" 
      :class="{ 'active': selectedTurno === turno.n }"
      @click="$emit('turnoChange', turno.n)"
    >
      {{ getTurnoName(turno) }}
    </button>
  </div>
</template>

<script setup lang="ts">
// Define the Turno interface
interface Turno {
  n: number
  oraInizio: string
  oraFine: string
  inizioRitiro: string
  fineRitiro: string
  nome: string
}

// Define props with proper types
const props = defineProps({
  availableTurni: {
    type: Array as () => Turno[],
    required: true
  },
  selectedTurno: {
    type: Number,
    required: true
  }
})

// Define emits
defineEmits(['turnoChange'])

// Simplified getTurnoName function - just use the nome property directly
const getTurnoName = (turno: Turno): string => {
  // If turno 2, label it clearly as Professor orders
  if (turno.n === 2) {
    return turno.nome || 'Turno Professori';
  }
  
  // If the nome property exists, use it
  if (turno.nome) {
    return turno.nome
  }
  
  // Fallback in case nome is missing
  return `Turno ${turno.n}`
}
</script>

<style scoped>
.turno-tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 15px;
}

.turno-tab {
  padding: 10px 20px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-weight: bold;
  color: var(--poldo-text);
}

.turno-tab.active {
  border-bottom-color: var(--poldo-primary);
  color: var(--poldo-primary);
}
</style>