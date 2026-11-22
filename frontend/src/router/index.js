import { createRouter, createWebHistory } from 'vue-router'

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/sessions' },
    { path: '/sessions', component: () => import('@/views/SessionsView.vue') },
    { path: '/sessions/:id', component: () => import('@/views/SessionView.vue'), props: true },
    { path: '/story', component: () => import('@/views/StoryView.vue') },
    { path: '/npcs', component: () => import('@/views/NpcsView.vue') },
    { path: '/maps', component: () => import('@/views/MapsView.vue') },
    { path: '/maps/:id', component: () => import('@/views/MapView.vue'), props: true },
  ],
})
