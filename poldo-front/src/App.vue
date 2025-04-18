<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import Navbar from './components/Navbar.vue'
import Filtri from './components/Filtri.vue';

</script>

<template>
    <Navbar nome="Giacomo"
    img_profilo="https://lh3.googleusercontent.com/a/ACg8ocLPv09a9-uNbEG-ZfRm5bWQUlyLOpBaKxHz88de_c6vB8RvQ_Plrg=s96-c"/>
    <RouterView />
    <Filtri />
</template>

<style>

</style>
