<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import IconMenu from './icons/IconMenu.vue'
import { useTurnoStore } from '@/stores/turno'

const router = useRouter()
const route = useRoute()
const showMenu = ref(false)
// Use the shared turno store instead of local state
const turnoStore = useTurnoStore()

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

// Check if a turno is selected using the store
const hasSelectedTurno = computed(() => {
  return !!turnoStore.turnoSelezionato
})

// Navigation routes that should be available in the dropdown
const navRoutes = [
  {
    name: 'Home',
    path: '/',
    requiresTurno: false
  },
  {
    name: 'Prodotti',
    path: '/prodotti',
    requiresTurno: true
  },
  {
    name: 'Carrello',
    path: '/carrello',
    requiresTurno: true
  }
]

// Handle navigation with turno check
const navigate = (path: string, requiresTurno: boolean) => {
  if (requiresTurno && !hasSelectedTurno.value) {
    // Don't navigate, just close the menu
    showMenu.value = false
  } else {
    router.push(path)
    showMenu.value = false
  }
}
</script>

<template>
  <div class="navbar" :class="{ 'menu-open': showMenu }">
    <div class="navbar-left">
      <div class="menu-icon" @click="toggleMenu">
        <IconMenu />
      </div>
      <div class="title-container">
        <div class="main-title">Poldo {{ pageTitle }}</div>
        <div class="turno-subtitle" v-if="hasSelectedTurno">
          {{ turnoStore.turnoSelezionato === 'primo' ? 'Primo Turno' : 'Secondo Turno' }}
        </div>
      </div>
    </div>

    <div class="dropdown-menu" v-show="showMenu">
      <ul>
        <li v-for="route in navRoutes" :key="route.path">
          <a 
            href="#" 
            @click.prevent="navigate(route.path, route.requiresTurno)"
            :class="{ 'disabled': route.requiresTurno && !hasSelectedTurno }"
          >
            {{ route.name }}
            <span v-if="route.requiresTurno && !hasSelectedTurno" class="lock-icon">🔒</span>
          </a>
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

.navbar.menu-open {
    border-radius: 20px 20px 20px 0;
}

.navbar-left {
    display: flex;
    align-items: center;
    gap: 16px;
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
    color: white;
}

.dropdown-menu a.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    position: relative;
}

.lock-icon {
    margin-left: 8px;
    font-size: 0.8rem;
}

.dropdown-menu a:hover {
    background-color: var(--poldo-background-soft);
}

.navbar>img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
}

.title-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.main-title {
  font-size: 1.3rem;
  font-weight: 600;
}

.turno-subtitle {
  font-size: 0.75rem;
  opacity: 0.9;
  margin-top: 0px;
}

.poldo-text {
  display: none; /* Hide the old Poldo text */
}

.titolo-pagina {
  display: none; /* Hide the old page title */
}

.turno-indicator {
  display: none; /* Hide the old turno indicator */
}
</style>
