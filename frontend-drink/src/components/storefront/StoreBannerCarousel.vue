<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import { useStorefrontBannersStore } from '../../stores/storefrontBanners'

const AUTOPLAY_DELAY = 6000

const bannersStore = useStorefrontBannersStore()
const { banners } = storeToRefs(bannersStore)

const activeIndex = ref(0)
const autoplayTimer = ref(null)
const isPaused = ref(false)
const failedImageIds = ref(new Set())

const activeBanner = computed(() => banners.value[activeIndex.value] ?? null)
const hasMultipleBanners = computed(() => banners.value.length > 1)
const hasActiveImage = computed(() =>
  activeBanner.value && !failedImageIds.value.has(activeBanner.value.id),
)
const isInternalDestination = computed(() => activeBanner.value?.ctaUrl?.startsWith('/'))

watch(
  () => banners.value.length,
  (length) => {
    if (!length) {
      activeIndex.value = 0
      stopAutoplay()
      return
    }

    if (activeIndex.value >= length) activeIndex.value = 0
    startAutoplay()
  },
)

onMounted(() => {
  void bannersStore.loadBanners()
})

onUnmounted(() => {
  stopAutoplay()
})

function startAutoplay() {
  stopAutoplay()

  if (!hasMultipleBanners.value || isPaused.value || prefersReducedMotion()) return
  autoplayTimer.value = window.setInterval(nextBanner, AUTOPLAY_DELAY)
}

function stopAutoplay() {
  if (autoplayTimer.value !== null) {
    window.clearInterval(autoplayTimer.value)
    autoplayTimer.value = null
  }
}

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

function setActiveBanner(index) {
  if (!banners.value.length) return
  activeIndex.value = (index + banners.value.length) % banners.value.length
  startAutoplay()
}

function nextBanner() {
  setActiveBanner(activeIndex.value + 1)
}

function previousBanner() {
  setActiveBanner(activeIndex.value - 1)
}

function pauseAutoplay() {
  isPaused.value = true
  stopAutoplay()
}

function resumeAutoplay() {
  isPaused.value = false
  startAutoplay()
}

function markImageAsFailed(bannerId) {
  failedImageIds.value = new Set([...failedImageIds.value, bannerId])
}
</script>

<template>
  <section
    v-if="activeBanner"
    class="store-banner-carousel"
    aria-roledescription="carrusel"
    aria-label="Promociones destacadas"
    @mouseenter="pauseAutoplay"
    @mouseleave="resumeAutoplay"
    @focusin="pauseAutoplay"
    @focusout="resumeAutoplay"
  >
    <div class="banner-shell">
      <Transition name="banner-fade" mode="out-in">
        <article :key="activeBanner.id" class="banner-slide">
          <RouterLink
            v-if="activeBanner.ctaUrl && isInternalDestination"
            class="banner-image-link"
            :to="activeBanner.ctaUrl"
            :aria-label="`Ir a ${activeBanner.title}`"
          >
            <picture v-if="hasActiveImage" class="banner-image">
              <source
                v-if="activeBanner.mobileImageUrl"
                media="(max-width: 640px)"
                :srcset="activeBanner.mobileImageUrl"
              />
              <img
                :src="activeBanner.imageUrl"
                :alt="activeBanner.altText || activeBanner.title"
                @error="markImageAsFailed(activeBanner.id)"
              />
            </picture>
          </RouterLink>
          <a
            v-else-if="activeBanner.ctaUrl"
            class="banner-image-link"
            :href="activeBanner.ctaUrl"
            :aria-label="`Ir a ${activeBanner.title}`"
          >
            <picture v-if="hasActiveImage" class="banner-image">
              <source
                v-if="activeBanner.mobileImageUrl"
                media="(max-width: 640px)"
                :srcset="activeBanner.mobileImageUrl"
              />
              <img
                :src="activeBanner.imageUrl"
                :alt="activeBanner.altText || activeBanner.title"
                @error="markImageAsFailed(activeBanner.id)"
              />
            </picture>
          </a>
          <picture v-else-if="hasActiveImage" class="banner-image">
            <source
              v-if="activeBanner.mobileImageUrl"
              media="(max-width: 640px)"
              :srcset="activeBanner.mobileImageUrl"
            />
            <img
              :src="activeBanner.imageUrl"
              :alt="activeBanner.altText || activeBanner.title"
              @error="markImageAsFailed(activeBanner.id)"
            />
          </picture>
        </article>
      </Transition>

      <div v-if="hasMultipleBanners" class="banner-controls">
        <div class="banner-dots" role="tablist" aria-label="Seleccionar promocion">
          <button
            v-for="(banner, index) in banners"
            :key="banner.id"
            class="banner-dot"
            :class="{ 'banner-dot--active': index === activeIndex }"
            type="button"
            role="tab"
            :aria-selected="index === activeIndex"
            :aria-label="`Mostrar promocion ${index + 1}: ${banner.title}`"
            @click="setActiveBanner(index)"
          ></button>
        </div>

        <div class="banner-arrows">
          <button class="banner-arrow" type="button" aria-label="Promocion anterior" @click="previousBanner">
            <span aria-hidden="true">←</span>
          </button>
          <button class="banner-arrow" type="button" aria-label="Siguiente promocion" @click="nextBanner">
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.store-banner-carousel {
  padding: 30px 8px 0;
}

.banner-shell {
  position: relative;
  max-width: 1280px;
  min-height: 330px;
  margin: 0 auto;
}

.banner-slide {
  position: relative;
  display: grid;
  min-height: 330px;
  overflow: hidden;
  border: 1px solid rgba(74, 13, 22, 0.14);
  border-radius: 28px;
  background:
    radial-gradient(circle at 82% 8%, rgba(234, 183, 191, 0.34), transparent 24%),
    linear-gradient(130deg, var(--wine-3), var(--ink) 72%);
  box-shadow: 0 30px 70px -46px rgba(42, 15, 20, 0.86);
}

.banner-image-link,
.banner-image,
.banner-image img {
  inset: 0;
  width: 100%;
  height: 100%;
}

.banner-image-link {
  display: block;
}

.banner-image-link:focus-visible {
  outline: 3px solid var(--text-accent);
  outline-offset: -3px;
}

.banner-image img {
  object-fit: contain;
  object-position: center;
}

.banner-controls {
  position: absolute;
  z-index: 2;
  right: 28px;
  bottom: 24px;
  left: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.banner-dots,
.banner-arrows {
  display: flex;
  align-items: center;
  gap: 9px;
}

.banner-dot {
  width: 28px;
  height: 4px;
  padding: 0;
  border-radius: 999px;
  background: rgba(246, 240, 230, 0.44);
  transition: width 0.2s ease, background 0.2s ease;
}

.banner-dot--active {
  width: 46px;
  background: var(--text-on-dark);
}

.banner-arrow {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid rgba(246, 240, 230, 0.42);
  border-radius: 50%;
  color: var(--text-on-dark);
  font-size: 18px;
  transition: background 0.2s ease, color 0.2s ease;
}

.banner-arrow:hover,
.banner-arrow:focus-visible {
  background: var(--text-on-dark);
  color: var(--wine-2);
}

.banner-fade-enter-active,
.banner-fade-leave-active {
  transition: opacity 0.32s ease, transform 0.32s ease;
}

.banner-fade-enter-from,
.banner-fade-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

@media (max-width: 720px) {
  .store-banner-carousel {
    padding-top: 22px;
  }

  .banner-shell,
  .banner-slide {
    min-height: 430px;
  }

  .banner-image img {
    object-fit: cover;
  }

  .banner-controls {
    right: 20px;
    bottom: 18px;
    left: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .banner-fade-enter-active,
  .banner-fade-leave-active,
  .banner-dot,
  .banner-arrow {
    transition: none;
  }
}
</style>
