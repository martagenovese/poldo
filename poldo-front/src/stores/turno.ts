import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTurnoStore = defineStore('turno', () => {
  const turnoSelezionato = ref('')
  
  // Function to update turno selection
  function selectTurno(turno: string) {
    turnoSelezionato.value = turno
  }
  
  return {
    turnoSelezionato,
    selectTurno
  }
}, {
  persist: true,
})