import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/view/Home.vue'),
    meta: { label: 'Home' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/view/Login.vue'),
    meta: { label: 'Login' },
  },
  {
    path: '/activities',
    name: 'activities',
    component: () => import('@/view/Activities.vue'),
    meta: { label: 'Activities' },
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
