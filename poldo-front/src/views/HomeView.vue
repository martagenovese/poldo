<script setup lang="ts">

import CardGrid from '@/components/CardGrid.vue';
import CardProdotto from '@/components/CardProdotto.vue'
// import Filtri from '@/components/Filtri.vue'
import MenuLaterale  from '@/components/MenuLaterale.vue'

</script>

<template>
    <main>
        <MenuLaterale 
            :pages="[
                { id: 1, name: 'Home', path: '/' },
                { id: 2, name: 'Prodotti', path: '/prodotti' },
                { id: 3, name: 'Carrello', path: '/carrello' },
            ]"
        />
        
        <CardGrid>
            <CardProdotto title="panino" imageSrc="https://lh3.googleusercontent.com/a/ACg8ocLPv09a9-uNbEG-ZfRm5bWQUlyLOpBaKxHz88de_c6vB8RvQ_Plrg=s96-c"></CardProdotto>
            <CardProdotto title="panino" imageSrc="https://lh3.googleusercontent.com/a/ACg8ocLPv09a9-uNbEG-ZfRm5bWQUlyLOpBaKxHz88de_c6vB8RvQ_Plrg=s96-c"></CardProdotto>
            <CardProdotto title="panino" imageSrc="https://lh3.googleusercontent.com/a/ACg8ocLPv09a9-uNbEG-ZfRm5bWQUlyLOpBaKxHz88de_c6vB8RvQ_Plrg=s96-c"></CardProdotto>
            <CardProdotto title="panino" imageSrc="https://lh3.googleusercontent.com/a/ACg8ocLPv09a9-uNbEG-ZfRm5bWQUlyLOpBaKxHz88de_c6vB8RvQ_Plrg=s96-c"></CardProdotto>
        </CardGrid>

        <!-- <Filtri /> -->
    </main>
</template>
