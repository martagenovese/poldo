import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProdottiView from '../views/ProdottiView.vue'
import CarrelloView from '../views/CarrelloView.vue'
import { useTurnoStore } from '../stores/turno'
import NewProdottiView from '../views/bar/NewProdottiView.vue'
import ModificaView from '../views/bar/ModificaView.vue'
import AuthView from '@/views/AuthView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/prodotti',
      name: 'prodotti',
      component: ProdottiView,
      meta: { requiresTurno: true }
    },
    {
      path: '/carrello',
      name: 'carrello',
      component: CarrelloView,
      meta: { requiresTurno: true }
    },
    {
        path: '/inserisciprodotto',
      name: 'inserisciProdotto',
      component: NewProdottiView,
    },
    {
      path: '/modifica',
      name: 'modifica',
      component: ModificaView,
    },
    {
      path: '/autenticazione',
      name: 'autenticazione',
      component: AuthView,
      meta: { requiresTurno: true }
    }
  ],
})

// Navigation guard to check if turno is selected
router.beforeEach((to, from, next) => {
  // Skip check for routes that don't require turno
  if (!to.meta.requiresTurno) {
    next()
    return
  }
  
  // Check if turno is selected
  const turnoStore = useTurnoStore()
  if (!turnoStore.turnoSelezionato) {
    // Redirect to home if no turno is selected
    next({ name: 'home' })
  } else {
    // Continue navigation if turno is selected
    next()
  }
})

export default router
