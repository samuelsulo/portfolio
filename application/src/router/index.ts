import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    // The sticky navbar sits above the hero in the flow: lining the hero up with
    // the viewport top would slide it under the navbar and cover the portrait.
    if (to.hash === '#hero') return { top: 0, behavior: 'smooth' }
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
  routes: [
    { path: '/', name: 'home', component: HomeView },
    {
      path: '/work/:id',
      name: 'work',
      component: () => import('@/views/WorkView.vue'),
    },
    {
      path: '/3d',
      name: 'explore',
      component: () => import('@/views/ExploreView.vue'),
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
