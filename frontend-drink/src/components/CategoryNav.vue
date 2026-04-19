<script setup>
import { ref } from 'vue'

import { useStorefrontCategories } from '../composables/useStorefrontCategories'

const { categories: safeCategories, loading, error, loadCategories } = useStorefrontCategories()
const activeCategoryId = ref(null)

function hasChildren(category) {
  return Array.isArray(category.children) && category.children.length > 0
}

function openCategory(category) {
  if (!hasChildren(category)) {
    activeCategoryId.value = null
    return
  }

  activeCategoryId.value = category.id
}

function closeCategory() {
  activeCategoryId.value = null
}

function isCategoryOpen(category) {
  return activeCategoryId.value === category.id
}

function handleNavFocusOut(event) {
  const nextTarget = event.relatedTarget
  const currentTarget = event.currentTarget

  if (currentTarget instanceof Node && nextTarget instanceof Node && currentTarget.contains(nextTarget)) {
    return
  }

  closeCategory()
}

void loadCategories()
</script>

<template>
  <header class="site-header">
    <div class="brand">
      <img src="/la_cantina.png" alt="Logo de la tienda" width="100"  />
    </div>
    <nav
      class="category-nav"
      aria-label="Categorias"
      @mouseleave="closeCategory"
      @focusout="handleNavFocusOut"
    >
      <ul class="nav-list">
        <li v-if="loading" class="status">Cargando categorias...</li>
        <li v-else-if="error" class="status error">{{ error }}</li>
        <li v-else-if="safeCategories.length === 0" class="status">
          Sin categorias disponibles.
        </li>
        <li
          v-else
          v-for="category in safeCategories"
          :key="category.id"
          class="nav-item"
          :class="{
            'has-children': hasChildren(category),
            'is-open': isCategoryOpen(category),
          }"
          @mouseenter="openCategory(category)"
          @focusin="openCategory(category)"
        >
          <a class="nav-link" href="#">{{ category.name }}</a>
          <div v-if="hasChildren(category)" class="submenu">
            <div class="submenu-inner">
              <ul class="submenu-list">
                <li v-for="child in category.children" :key="child.id">
                  <a class="submenu-link" href="#">{{ child.name }}</a>
                </li>
              </ul>
              <div class="submenu-list submenu-meta">
                <a class="submenu-link" href="#">Solo en la tienda</a>
                <a class="submenu-link" href="#">Ver todos</a>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </nav>
  </header>
</template>

<style scoped>
.site-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 0 0;
  background: #ffffff;
}

.brand {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.logo {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.4px;
}

.tagline {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #6b6b6b;
}

.category-nav {
  position: relative;
  background: #0e0e0e;
}

.nav-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 28px;
  list-style: none;
  padding: 14px 32px;
  margin: 0;
}

.nav-item {
  position: static;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  color: #f5f5f5;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.4px;
  padding: 4px 0;
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -6px;
  width: 100%;
  height: 2px;
  background: #ffffff;
  opacity: 0;
  transform: scaleX(0.6);
  transform-origin: center;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.nav-item.is-open .nav-link::after,
.nav-item:hover .nav-link::after,
.nav-item:focus-within .nav-link::after {
  opacity: 1;
  transform: scaleX(1);
}

.submenu {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  background: #ffffff;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
  border-bottom: 1px solid #eeeeee;
  opacity: 0;
  transform: translateY(8px);
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
  z-index: 10;
}

.nav-item.is-open .submenu,
.nav-item:hover .submenu,
.nav-item:focus-within .submenu {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.submenu-inner {
  display: flex;
  gap: 64px;
  padding: 24px 32px 32px;
  max-width: 1100px;
  margin: 0 auto;
}

.submenu-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.submenu-link {
  text-decoration: none;
  color: #141414;
  font-size: 12px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  font-weight: 600;
}

.submenu-link:hover {
  color: #5a3d1b;
}

.submenu-meta {
  padding-left: 32px;
  border-left: 1px solid #f0f0f0;
}

.status {
  font-size: 13px;
  color: #d5d5d5;
}

.status.error {
  color: #ff9a8a;
}

@media (max-width: 900px) {
  .nav-list {
    justify-content: flex-start;
    gap: 20px;
    padding: 12px 20px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .nav-list::-webkit-scrollbar {
    display: none;
  }

  .submenu-inner {
    flex-direction: column;
    gap: 20px;
  }

  .submenu-meta {
    padding-left: 0;
    border-left: none;
    border-top: 1px solid #f0f0f0;
    padding-top: 12px;
  }
}

@media (max-width: 600px) {
  .site-header {
    padding: 16px 20px 0;
  }
}
</style>
