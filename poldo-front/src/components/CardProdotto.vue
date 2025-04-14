<script setup lang="ts">
import Card from './Card.vue'

defineProps<{
  imageSrc: string
  imageAlt?: string
  title: string
  description?: string
  width?: string
  height?: string
}>()
</script>

<template>
  <Card :width="width" :height="height">
    <div class="card-prodotto">
      <img :src="imageSrc" :alt="imageAlt || title" class="product-image" />

      <div class="info">
        <h3 class="title">{{ title }}</h3>
        <p class="description" v-if="description">{{ description }}</p>
      </div>
    </div>
  </Card>
</template>

<style scoped>
.card-prodotto {
  width: 100px;
  height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.product-image {
  width: 100%;
  height: auto;
  object-fit: cover;
  margin-bottom: 10px;
}

.info {
  text-align: center;
}

.title {
  font-size: 1.2rem;
  margin: 0;
}

.description {
  font-size: 0.95rem;
  color: #555;
  margin-top: 5px;
}
</style>