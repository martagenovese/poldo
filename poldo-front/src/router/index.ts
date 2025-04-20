import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProdottiView from '../views/ProdottiView.vue'
import CarrelloView from '../views/CarrelloView.vue'
import { useTurnoStore } from '../stores/turno'

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
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
      meta: { requiresTurno: true }
    },
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
