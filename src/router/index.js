import { createRouter, createWebHistory } from 'vue-router'
import RegisterView from '../views/RegisterView.vue'
import RegisterCompleteView from '../views/RegisterCompleteView.vue'
import RegisterDeclinedMainPrizeView from '../views/RegisterDeclinedMainPrizeView.vue'
import AdminView from '../views/AdminView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/register' },
    { path: '/admin', name: 'admin', component: AdminView },
    /** Один маршрут с alias — без redirect /register/↔/register (иначе возможен бесконечный цикл). */
    { path: '/register', alias: '/register/', name: 'register', component: RegisterView },
    { path: '/register/complete', name: 'register-complete', component: RegisterCompleteView },
    {
      path: '/register/declined-main-prize',
      name: 'register-declined-main-prize',
      component: RegisterDeclinedMainPrizeView,
    },
  ],
  scrollBehavior(to, _from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

export default router
