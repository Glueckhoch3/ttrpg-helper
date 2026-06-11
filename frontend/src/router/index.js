import { createRouter, createWebHistory } from 'vue-router'
import AdventureOverview from '@/views/AdventureOverview.vue'
import AdventureContent from '@/views/AdventureContent.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {path: '/', redirect: '/overview'},
    {path: '/overview', component: AdventureOverview},
    {
      path: '/content/:filename?',
      name: 'adventure-content',
      component: AdventureContent,
      props: route => ({
        filename: route.params.filename || 'testAdventure.json'
      })
    }
  ],
})

export default router
