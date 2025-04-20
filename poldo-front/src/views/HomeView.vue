<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CardTurno from '@/components/CardTurno.vue'
import { useTurnoStore } from '@/stores/turno'

// Use the central turno store
const turnoStore = useTurnoStore()

// Method for handling turno selection
const selezionaTurno = (turno: string) => {
  turnoStore.selectTurno(turno)
}
</script>

<template>
  <div class="home">
    <div class="turni-container">
      <CardTurno 
        title="Primo Turno" 
        timeRangeOrder="10:30 - 11:15"
        timeRangeTake="11:15 - 12:00"
        :isSelected="turnoStore.turnoSelezionato === 'primo'"
        :isOtherSelected="turnoStore.turnoSelezionato === 'secondo'"
        @select="selezionaTurno('primo')"
      />
      
      <CardTurno 
        title="Secondo Turno" 
        timeRangeOrder="11:30 - 12:15"
        timeRangeTake="12:15 - 13:00"
        :isSelected="turnoStore.turnoSelezionato === 'secondo'"
        :isOtherSelected="turnoStore.turnoSelezionato === 'primo'"
        @select="selezionaTurno('secondo')"
      />
    </div>
  </div>
</template>

<style scoped>
.home {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: calc(100vh - 70px); /* Adjust for navbar height */
  overflow: hidden; /* Prevent scrolling */
  box-sizing: border-box;
}

.turni-container {
  display: flex;
  gap: 30px;
  margin-top: 2vh; /* Use viewport-relative units */
  flex-wrap: wrap;
  justify-content: center;
  max-height: calc(100% - 10vh); /* Leave some space for margins */
  width: 100%;
}

h1 {
  margin-top: 3vh;
  margin-bottom: 1vh;
}

p {
  margin-bottom: 3vh;
}
</style>
