import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/view/Home.vue'),
    meta: { label: 'Home' },
  },
  {
    path: '/components',
    name: 'components',
    component: () => import('@/view/Components.vue'),
    meta: { label: 'Components' },
  },
  {
    path: '/blocks',
    name: 'blocks',
    component: () => import('@/view/Blocks.vue'),
    meta: { label: 'Blocks' },
  },
  {
    path: '/charts',
    name: 'charts',
    component: () => import('@/view/Charts.vue'),
    meta: { label: 'Charts' },
  },
  {
    path: '/themes',
    name: 'themes',
    component: () => import('@/view/Themes.vue'),
    meta: { label: 'Themes' },
  },
  {
    path: '/colors',
    name: 'colors',
    component: () => import('@/view/Colors.vue'),
    meta: { label: 'Colors' },
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
