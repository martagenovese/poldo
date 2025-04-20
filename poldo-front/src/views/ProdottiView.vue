<script setup lang="ts">
import CardGrid from '@/components/CardGrid.vue';
import CardProdotto from '@/components/CardProdotto.vue';
import Filtri from '@/components/Filtri.vue';
</script>

<template>
  <div class="prodotti">
    <div class="content-container">
      <h1>Prodotti</h1>
      <CardGrid>
        <CardProdotto title="Panino classico" imageSrc="https://lh3.googleusercontent.com/a/ACg8ocLPv09a9-uNbEG-ZfRm5bWQUlyLOpBaKxHz88de_c6vB8RvQ_Plrg=s96-c" />
        <CardProdotto title="Panino special" imageSrc="https://lh3.googleusercontent.com/a/ACg8ocLPv09a9-uNbEG-ZfRm5bWQUlyLOpBaKxHz88de_c6vB8RvQ_Plrg=s96-c" />
        <CardProdotto title="Panino veggie" imageSrc="https://lh3.googleusercontent.com/a/ACg8ocLPv09a9-uNbEG-ZfRm5bWQUlyLOpBaKxHz88de_c6vB8RvQ_Plrg=s96-c" />
        <CardProdotto title="Panino deluxe" imageSrc="https://lh3.googleusercontent.com/a/ACg8ocLPv09a9-uNbEG-ZfRm5bWQUlyLOpBaKxHz88de_c6vB8RvQ_Plrg=s96-c" />
      </CardGrid>
    </div>
    <Filtri />
  </div>
</template>

<style scoped>
.prodotti {
  padding: 1rem;
}

.content-container {
  margin-left: 12%; /* Add margin to account for the partially visible sidebar */
  width: 88%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

h1 {
  text-align: center;
  width: 100%;
}
</style>