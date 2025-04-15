<script setup lang="ts">

defineProps<{
  width?: string;
  height?: string;
}>();
</script>

<template>
  <div 
    class="card"
    :style="{
      width: width || 'auto',
      height: height || 'auto'
    }"
  >

  <slot></slot>

  </div>
</template>

<style scoped>
.card {
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
  transition: all 0.3s;
  
  /* Stile predefinito (light mode) */
  background: var(--vt-c-white);
  color: var(--vt-c-black);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@media (prefers-color-scheme: dark) {
  .card {
    background: var(--vt-c-black);
    color: var(--vt-c-white);
    box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
  }
}
</style>