<script setup lang="ts">
defineProps<{
  columns?: number
  gap?: string
  cards: Array<any>
}>()
</script>

<template>
  <div 
    class="card-grid"
    :style="{
      'grid-template-columns': `repeat(${columns || 3}, 1fr)`,
      'gap': gap || '20px'
    }"
  >
    <component
      v-for="(card, index) in cards"
      :key="index"
      :is="card.component"
      v-bind="card.props"
    />
  </div>
</template>

<style scoped>
.card-grid {
  display: grid;
  width: 100%;
  margin-top: 30px;
}
</style>