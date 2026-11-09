import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ListenView from '../views/ListenView.vue'
import ListeDetailView from '../views/ListeDetailView.vue'
import MaerkteView from '../views/MaerkteView.vue'
import MarktAnsichtView from '../views/MarktAnsichtView.vue'
import LoginCallbackView from '../views/LoginCallbackView.vue'
import EinladungView from '../views/EinladungView.vue'
import { anmelden, oktaAuth } from '../auth/okta'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/login/callback', name: 'login-callback', component: LoginCallbackView },
    { path: '/listen', name: 'listen', component: ListenView, meta: { requiresAuth: true } },
    { path: '/listen/:id', name: 'liste', component: ListeDetailView, meta: { requiresAuth: true } },
    { path: '/einladung/:token', name: 'einladung', component: EinladungView, meta: { requiresAuth: true } },
    { path: '/maerkte', name: 'maerkte', component: MaerkteView, meta: { requiresAuth: true } },
    { path: '/maerkte/:id', name: 'markt-ansicht', component: MarktAnsichtView, meta: { requiresAuth: true } },
  ],
})

// Geschützte Seiten nur mit Anmeldung, sonst geht es zur Okta-Anmeldeseite
router.beforeEach(async (to) => {
  if (to.meta.requiresAuth && !(await oktaAuth.isAuthenticated())) {
    await anmelden(to.fullPath)
    return false
  }
})

export default router
