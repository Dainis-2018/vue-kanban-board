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
  // ADD THIS MISSING ROUTE - Individual project view
  {
    path: '/projects/:projectId',
    name: 'ProjectDetail',
    component: () => import('@/views/Projects.vue'),
    meta: { title: 'Project Details' }
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
  },
  // Catch-all 404 route
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Enhanced debugging and document title
router.beforeEach((to, from, next) => {
  console.log('🔥 Router Navigation:', {
    from: from.path,
    to: to.path,
    name: to.name,
    params: to.params
  })
  
  // If someone tries to go to /projects/proj-1, redirect to /kanban/proj-1
  if (to.path.startsWith('/projects/') && to.params.projectId) {
    console.log('🔄 Redirecting project detail to kanban:', to.params.projectId)
    next({ name: 'Kanban', params: { projectId: to.params.projectId } })
    return
  }
  
  document.title = to.meta.title ? `${to.meta.title} - Kanban Board` : 'Kanban Board'
  next()
})

// Log router errors
router.onError((error) => {
  console.error('🚨 Router Error:', error)
})

export default router