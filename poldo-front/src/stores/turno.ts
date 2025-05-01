import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTurnoStore = defineStore('turno', () => {
  const selectedTurno = ref<string>('')

  const selectTurno = (turno: string) => {
    selectedTurno.value = turno
  }

  return {
    turnoSelezionato: selectedTurno,
    selectTurno
  }
}, {
  persist: true
})
