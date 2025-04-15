<script setup lang="ts">
defineProps<{
  columns?: number
  gap?: string
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
    <slot></slot>
  </div>
</template>

<style scoped>
.card-grid {
  display: grid;
  width: 100%;
  margin-top: 30px;
}
</style>