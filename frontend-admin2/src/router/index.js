import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import ProductsView from '@/views/ProductsView.vue'
import ProductCreateView from '@/views/ProductCreateView.vue'
import ProductEditView from '@/views/ProductEditView.vue'
import CategoriesView from '@/views/CategoriesView.vue'
import AttributesView from '@/views/AttributesView.vue'
import ProductTypesView from '@/views/ProductTypesView.vue'
import OrdersView from '@/views/OrdersView.vue'
import OrderDetailView from '@/views/OrderDetailView.vue'
import PaymentsView from '@/views/PaymentsView.vue'
import CustomersView from '@/views/CustomersView.vue'
import BannersView from '@/views/BannersView.vue'
import { pinia } from '@/stores'
import { useAuthStore } from '@/stores/auth'
import { useAdminStore } from '@/stores/admin'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        guestOnly: true,
        title: 'Ingreso',
      },
    },
    {
      path: '/',
      component: AdminLayout,
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
          path: 'products',
          name: 'products',
          component: ProductsView,
          meta: {
            title: 'Productos',
          },
        },
        {
          path: 'products/new',
          name: 'product-create',
          component: ProductCreateView,
          meta: {
            title: 'Nuevo producto',
          },
        },
        {
          path: 'products/:id',
          name: 'product-edit',
          component: ProductEditView,
          meta: {
            title: 'Editar producto',
          },
        },
        {
          path: 'categories',
          name: 'categories',
          component: CategoriesView,
          meta: {
            title: 'Categorias',
          },
        },
        {
          path: 'attributes',
          name: 'attributes',
          component: AttributesView,
          meta: {
            title: 'Atributos',
          },
        },
        {
          path: 'product-types',
          name: 'product-types',
          component: ProductTypesView,
          meta: {
            title: 'Tipos de producto',
          },
        },
        {
          path: 'orders',
          name: 'orders',
          component: OrdersView,
          meta: {
            title: 'Pedidos',
          },
        },
        {
          path: 'orders/:id',
          name: 'order-detail',
          component: OrderDetailView,
          meta: {
            title: 'Detalle de pedido',
          },
        },
        {
          path: 'payments',
          name: 'payments',
          component: PaymentsView,
          meta: {
            title: 'Pagos',
          },
        },
        {
          path: 'customers',
          name: 'customers',
          component: CustomersView,
          meta: {
            title: 'Clientes',
          },
        },
        {
          path: 'banners',
          name: 'banners',
          component: BannersView,
          meta: {
            title: 'Banners',
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

router.beforeEach(async (to) => {
  const auth = useAuthStore(pinia)
  const admin = useAdminStore(pinia)

  auth.hydrate()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  if (to.meta.requiresAuth && !auth.hasAdminAccess) {
    admin.clearContext()
    auth.logout()
    return {
      name: 'login',
      query: { reason: 'admin_role' },
    }
  }

  if (to.meta.requiresAuth) {
    await admin.ensureStoreContext().catch(() => undefined)
  }

  if (to.meta.guestOnly && auth.isAuthenticated && auth.hasAdminAccess) {
    return { name: 'dashboard' }
  }

  return true
})

router.afterEach((to) => {
  if (typeof document === 'undefined') return

  const pageTitle = to.meta.title ? `${to.meta.title} | E-Shop Admin` : 'E-Shop Admin'
  document.title = pageTitle
})

export default router
