<script setup>
import { computed, onMounted } from 'vue';
import { useStore } from '../store';

const store = useStore();

const featured = computed(() => store.state.products.slice(0, 3));

onMounted(store.loadProducts);
</script>

<template>
  <section class="hero">
    <div class="hero-card">
      <p class="pill">Drop 02</p>
      <h1>Threadline Atelier</h1>
      <p>
        Contemporary wardrobe staples inspired by slow craft. Curated essentials
        with sharp cuts, soft textures, and confident color.
      </p>
      <div class="hero-meta">
        <span class="pill">Ships in 48h</span>
        <span class="pill">Ethical fibers</span>
        <span class="pill">Small batch</span>
      </div>
    </div>
    <div class="hero-card hero-panel">
      <h2>Studio notes</h2>
      <p>
        Mixing clean silhouettes with unexpected hues. Each piece is cut for
        movement and layered comfort.
      </p>
      <div class="hero-meta">
        <span class="pill">Seasonal fit guide</span>
        <span class="pill">Signature textures</span>
      </div>
    </div>
  </section>

  <section class="section collection">
    <div class="section-title">
      <div>
        <p class="section-kicker">Collections</p>
        <h2>Capsule wardrobe</h2>
      </div>
      <router-link class="link" to="/products">Explore</router-link>
    </div>
    <div class="collection-grid">
      <article class="collection-card">
        <div class="collection-media collection-media-one">
          <span>City Tailoring</span>
        </div>
        <div class="collection-body">
          <h3>City Tailoring</h3>
          <p>Sharp shoulders, softened lines, and tones that move from day to night.</p>
          <div class="tag-row">
            <span class="tag">Blazers</span>
            <span class="tag">Wide-leg</span>
            <span class="tag">Midweight</span>
          </div>
        </div>
      </article>
      <article class="collection-card">
        <div class="collection-media collection-media-two">
          <span>Soft Geometry</span>
        </div>
        <div class="collection-body">
          <h3>Soft Geometry</h3>
          <p>Layered knits with sculpted seams. Designed to drape, not cling.</p>
          <div class="tag-row">
            <span class="tag">Knitwear</span>
            <span class="tag">Texture</span>
            <span class="tag">Neutral</span>
          </div>
        </div>
      </article>
      <article class="collection-card">
        <div class="collection-media collection-media-three">
          <span>Travel Ease</span>
        </div>
        <div class="collection-body">
          <h3>Travel Ease</h3>
          <p>Wrinkle-aware essentials built for movement, packing, and long days.</p>
          <div class="tag-row">
            <span class="tag">Stretch</span>
            <span class="tag">Lightweight</span>
            <span class="tag">Layering</span>
          </div>
        </div>
      </article>
    </div>
  </section>

  <section class="section">
    <div class="section-title">
      <h2>Featured pieces</h2>
      <router-link class="link" to="/products">Browse all</router-link>
    </div>

    <div v-if="store.state.loading" class="loading">Loading products...</div>
    <div v-else-if="store.state.error" class="notice error">{{ store.state.error }}</div>

    <div v-else class="grid">
      <article v-for="product in featured" :key="product.id" class="card">
        <router-link class="card-link" :to="`/products/${product.id}`">
          <div class="card-image">
            <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" />
            <span v-else>THREADLINE</span>
          </div>
          <h3>{{ product.name }}</h3>
          <p>{{ product.description || 'Limited run with crafted finish.' }}</p>
        </router-link>
        <div class="card-footer">
          <span class="price">{{ store.formatCurrency(product.price) }}</span>
          <button class="btn btn-primary" @click="store.addToCart(product)">
            Add to cart
          </button>
        </div>
      </article>
    </div>
  </section>

  <section class="section lookbook">
    <div class="section-title">
      <div>
        <p class="section-kicker">Lookbook</p>
        <h2>Modern silhouettes</h2>
      </div>
      <span class="pill">Styled in studio</span>
    </div>
    <div class="lookbook-grid">
      <article class="lookbook-card">
        <div class="lookbook-media">
          <span>Layered set</span>
        </div>
        <div>
          <h3>Layered in motion</h3>
          <p>Pair structured outerwear with soft knits for a balanced profile.</p>
        </div>
      </article>
      <article class="lookbook-card">
        <div class="lookbook-media alt">
          <span>Studio light</span>
        </div>
        <div>
          <h3>Monochrome depth</h3>
          <p>Deep neutrals sharpen the silhouette while keeping the look quiet.</p>
        </div>
      </article>
    </div>
  </section>

  <section class="section split-panel">
    <div>
      <h3>Fit advisory</h3>
      <p>
        Our garments are designed with a tailored drape. Choose your true size
        for a sharp profile or size up for a relaxed look.
      </p>
    </div>
    <div>
      <h3>Materials</h3>
      <p>
        Organic cotton, recycled blends, and plant-based dyes. Each production
        run is documented and audited for impact.
      </p>
    </div>
    <div>
      <h3>Studio care</h3>
      <p>
        Low heat wash, line dry, and avoid harsh detergents to keep the fibers
        crisp and the color deep.
      </p>
    </div>
  </section>
</template>
