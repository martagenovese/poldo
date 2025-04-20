<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import Navbar from './components/Navbar.vue'
import MenuLaterale from './components/MenuLaterale.vue'

</script>

<template>
    <Navbar nome="Giacomo"
    img_profilo="https://lh3.googleusercontent.com/a/ACg8ocLPv09a9-uNbEG-ZfRm5bWQUlyLOpBaKxHz88de_c6vB8RvQ_Plrg=s96-c"/>
    <div class="app-container">
        <MenuLaterale 
            :pages="[
                { id: 1, name: 'Home', path: '/' },
                { id: 2, name: 'Prodotti', path: '/prodotti' },
                { id: 3, name: 'Ordine', path: '/ordine' },
            ]"
        />
        <main class="content">
            <RouterView />
        </main>
    </div>
</template>

<style>
.app-container {
    display: flex;
}
.content {
    flex: 1;
    padding: 20px;
}
</style>
