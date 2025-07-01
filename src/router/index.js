import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { title: 'Dashboard' }
  },
  {
    path: '/projects',
    name: 'Projects',
    component: () => import('@/views/Projects.vue'),
    meta: { title: 'Projects' }
  },
  {
    path: '/kanban/:projectId?',
    name: 'Kanban',
    component: () => import('@/views/Kanban.vue'),
    meta: { title: 'Kanban Board' }
  },
  {
    path: '/roadmap/:projectId?',
    name: 'Roadmap',
    component: () => import('@/views/Roadmap.vue'),
    meta: { title: 'Project Roadmap' }
  },
  {
    path: '/teams',
    name: 'Teams',
    component: () => import('@/views/Teams.vue'),
    meta: { title: 'Teams' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Update document title based on route
router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - Kanban Board` : 'Kanban Board'
  next()
})

export default router