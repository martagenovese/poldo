<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import IconMenu from './icons/IconMenu.vue'

const router = useRouter()
const route = useRoute()
const showMenu = ref(false)

defineProps<{
  img_profilo: string
  nome: string
}>()

const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

// Function to get page title based on current route
const pageTitle = computed(() => {
  // Get name from the current route
  const routeName = route.name?.toString() || '';
  
  // Return formatted title or default to 'Home' if not found
  if (routeName === 'home') return 'Home';
  if (routeName === 'prodotti') return 'Prodotti';
  if (routeName === 'carrello') return 'Carrello';
  if (routeName === 'about') return 'About';
  
  return 'Home'; // Default fallback
})

const t = [
    {
        name: 'Home',
        path: '/'
    },
    {
        name: 'Prodotti',
        path: '/prodotti'
    },
    {
        name: 'Carrello',
        path: '/carrello'
    }
]
</script>


<!-- https://lh3.googleusercontent.com/a/ACg8ocLPv09a9-uNbEG-ZfRm5bWQUlyLOpBaKxHz88de_c6vB8RvQ_Plrg=s96-c -->

<template>
    <div class="navbar">
        <div class="navbar-left">
            <div class="menu-icon" @click="toggleMenu">
                <IconMenu />
            </div>
            <span class="titolo-pagina">Poldo {{ pageTitle }}</span>
        </div>


        <div class="dropdown-menu" v-show="showMenu">
            <ul>
                <li v-for="route in t" :key="route.path">
                    <router-link :to="route.path" @click="toggleMenu">
                        {{ route.name }}
                    </router-link>
                </li>
            </ul>
        </div>

        <img :src="img_profilo" alt="Profilo" />
    </div>
</template>


<style>
.navbar {
    height: 70px;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: var(--navbar-bg);
    color: white;
    border-radius: 20px;
    position: relative;
}

.navbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.navbar a {
    color: var(--navbar-text);
    text-decoration: none;
    padding: 0.5rem 1rem;
}

.menu-icon {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
}

.dropdown-menu {
    position: absolute;
    top: 70px;
    left: 0;
    background-color: var(--navbar-bg);
    border-radius: 0 0 10px 10px;
    width: 200px;
    z-index: 100;
    box-shadow: 0 4px 6px var(--card-shadow);
}

.dropdown-menu ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.dropdown-menu li {
    padding: 0;
}

.dropdown-menu a {
    display: block;
    padding: 12px 16px;
    text-decoration: none;
    color: var(--navbar-text);
}

.dropdown-menu a:hover {
    background-color: var(--poldo-background-soft);
}

.navbar>img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
}

.titolo-pagina {
    font-size: 1.5rem;
}
</style>
