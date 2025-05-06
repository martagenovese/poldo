<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useProductsStore } from '@/stores/products';
import type { Product } from '@/stores/products';


const router = useRouter();
const productsStore = useProductsStore();

// Form state
const newProduct = ref({
  title: '',
  description: '',
  price: 0,
  ingredients: '',
  imageSrc: ''
});

// Function to add a new product
const addProduct = () => {
  if (newProduct.value.title && newProduct.value.price > 0) {
    productsStore.addProduct({
      title: newProduct.value.title,
      description: newProduct.value.description,
      price: newProduct.value.price,
      ingredients: newProduct.value.ingredients.split(',').map(ingredient => ingredient.trim()),
      imageSrc: newProduct.value.imageSrc,
      tags: [],
      isActive: true
    });
    alert('Prodotto aggiunto con successo!');
    router.push('/prodotti');
  } else {
    alert('Compila tutti i campi obbligatori!');
  }
};
</script>

<template>
  <div class="new-product">
    <h1>Aggiungi un nuovo prodotto</h1>
    <form @submit.prevent="addProduct" class="form-container">
      <div class="form-group">
        <label for="title">Titolo</label>
        <input id="title" v-model="newProduct.title" type="text" required />
      </div>

      <div class="form-group">
        <label for="description">Descrizione</label>
        <textarea id="description" v-model="newProduct.description"></textarea>
      </div>

      <div class="form-group">
        <label for="price">Prezzo</label>
        <input id="price" v-model.number="newProduct.price" type="number" min="0" required />
      </div>

      <div class="form-group">
        <label for="ingredients">Ingredienti (separati da virgola)</label>
        <input id="ingredients" v-model="newProduct.ingredients" type="text" />
      </div>

      <div class="form-group">
        <label for="imageSrc">URL Immagine</label>
        <input id="imageSrc" v-model="newProduct.imageSrc" type="text" />
      </div>

      <button type="submit" class="submit-btn">Aggiungi Prodotto</button>
    </form>
  </div>
  <div class="lista-prodotti">
    <CardGrid>
      <CardProdotto v-for="product in productsStore.products" :key="product.id" :productId="product.id" />
    </CardGrid>
  </div>

</template>

<style scoped>
.new-product {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

label {
  font-weight: bold;
  margin-bottom: 5px;
}

input,
textarea {
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  font-size: 1rem;
}

textarea {
  resize: vertical;
}

.submit-btn {
  padding: 10px 20px;
  background-color: var(--poldo-primary);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: background-color 0.3s;
}

.submit-btn:hover {
  background-color: var(--poldo-accent);
}
</style>
