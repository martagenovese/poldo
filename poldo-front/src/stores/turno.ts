import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useTurnoStore = defineStore('turno', () => {
  const turnoSelezionato = ref('')
  
  // Initialize from localStorage if available
  if (typeof window !== 'undefined') {
    const savedTurno = localStorage.getItem('turnoSelezionato')
    if (savedTurno) {
      turnoSelezionato.value = savedTurno
    }
  }
  
  // Watch for changes and update localStorage
  watch(turnoSelezionato, (newValue) => {
    localStorage.setItem('turnoSelezionato', newValue)
  })
  
  // Function to update turno selection
  function selectTurno(turno: string) {
    turnoSelezionato.value = turno
  }
  
  return {
    turnoSelezionato,
    selectTurno
  }
})