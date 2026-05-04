import { createRouter, createWebHistory } from 'vue-router'

const home = () => import("../views/home.vue");
const products = () => import("../views/Products.vue");
const favorites = () => import("../views/Favorites.vue");

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
    },
    {
      path: "/favorites",
      name: "favorites",
      component: favorites,
    }
  ],
})

export default router
