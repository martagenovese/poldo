<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import Navbar from './components/Navbar.vue'
</script>

<template>
    <Navbar nome="Giacomo"
        img_profilo="https://lh3.googleusercontent.com/a/ACg8ocLPv09a9-uNbEG-ZfRm5bWQUlyLOpBaKxHz88de_c6vB8RvQ_Plrg=s96-c" />
    <div class="container">
        <main>
            <RouterView />
        </main>
    </div>
</template>

<style>
main {
    flex: 1;
    /* padding: 20px; */
    background-color: var(--background);
    height: calc(100vh - 100px);
}
</style>
