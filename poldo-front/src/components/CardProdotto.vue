<script setup lang="ts">
import Card from './Card.vue'

defineProps<{
  imageSrc: string
  imageAlt?: string
  title: string
  description?: string
}>()
</script>

<template>
  <Card width="200px" height="250px">
    <div class="card-prodotto">
      <img :src="imageSrc" :alt="imageAlt" />

      <div class="info">
        <h3 class="title">{{ title }}</h3>
        <p class="description" v-if="description">{{ description }}</p>
      </div>
    </div>
  </Card>
</template>

<style scoped>
.card-prodotto {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  box-sizing: border-box;
}

.info {
  text-align: center;
  width: 100%;
}

.title {
  font-size: 1.2rem;
  margin: 0;
  margin-bottom: 8px;
}

.description {
  font-size: 0.95rem;
  color: #555;
  margin-top: 5px;
}

@media (prefers-color-scheme: dark) {
  .description {
    color: #aaa;
  }
}
</style>