import { createRouter, createWebHistory } from 'vue-router'

const home = () => import("../views/home.vue");
const products = () => import("../views/Products.vue");

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: home,
    },
    {
      path: "/products",
      name: "products",
      component: products,
    }
  ],
})

export default router
