<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import Navbar from './components/Navbar.vue'
</script>

<template>
    <div class="app-wrapper">
        <Navbar nome="Giacomo"
        img_profilo="https://lh3.googleusercontent.com/a/ACg8ocLPv09a9-uNbEG-ZfRm5bWQUlyLOpBaKxHz88de_c6vB8RvQ_Plrg=s96-c"/>
        <div class="app-container">
            <main class="content">
                <RouterView />
            </main>
        </div>
    </div>
</template>

<style>
.app-wrapper {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    max-height: 100vh;
    overflow: hidden;
    background-color: var(--background);
    color: var(--poldo-text);
}

.app-container {
    display: flex;
    flex: 1;
    overflow: hidden;
    background-color: var(--background);
}

.content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    height: calc(100vh - 70px); /* Adjust based on your navbar height */
    background-color: var(--background);
}
</style>
