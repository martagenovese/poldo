import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProdottiView from '../views/ProdottiView.vue'
import CarrelloView from '../views/CarrelloView.vue'
import { useTurnoStore } from '../stores/turno'
import NewProdottiView from '../views/Gestione/NewProdottiView.vue'
import ModificaView from '../views/Gestione/ProdottiView.vue'

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
      path: '/gestione/prodotti',
      name: 'modificaProdotti',
      component: ModificaView,
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

  
  const turnoStore = useTurnoStore()
  if (turnoStore.turnoSelezionato === -1) {
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router
