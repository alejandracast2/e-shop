import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.vue';
import Products from './views/Products.vue';
import ProductDetail from './views/ProductDetail.vue';
import Cart from './views/Cart.vue';

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/products', name: 'products', component: Products },
  { path: '/products/:id', name: 'product-detail', component: ProductDetail },
  { path: '/cart', name: 'cart', component: Cart }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

export default router;
