import { createRouter, createWebHistory } from 'vue-router'
import PlatformLayout from '@/layouts/PlatformLayout.vue'
import DashboardView from '@/views/DashboardView.vue'
import EndpointsView from '@/views/EndpointsView.vue'
import LoginView from '@/views/LoginView.vue'
import TenantsView from '@/views/TenantsView.vue'
import UsersView from '@/views/UsersView.vue'
import { useAuthStore } from '@/stores/auth'
import { pinia } from '@/stores'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        guestOnly: true,
        title: 'Ingreso de plataforma',
      },
    },
    {
      path: '/',
      component: PlatformLayout,
      meta: {
        requiresAuth: true,
      },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: DashboardView,
          meta: {
            title: 'Dashboard',
          },
        },
        {
          path: 'tenants',
          name: 'tenants',
          component: TenantsView,
          meta: {
            title: 'Tenants y Stores',
          },
        },
        {
          path: 'users',
          name: 'users',
          component: UsersView,
          meta: {
            title: 'Usuarios',
          },
        },
        {
          path: 'endpoints',
          name: 'endpoints',
          component: EndpointsView,
          meta: {
            title: 'Endpoints',
          },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore(pinia)
  auth.hydrate()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  if (to.meta.requiresAuth && !auth.isPlatformAdmin) {
    auth.logout()
    return {
      name: 'login',
      query: { reason: 'platform_admin' },
    }
  }

  if (to.meta.guestOnly && auth.isAuthenticated && auth.isPlatformAdmin) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
