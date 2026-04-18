<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import SectionCard from '@/components/SectionCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { platformEndpoints } from '@/data/platform-endpoints'

const groupedEndpoints = computed(() => {
  const groups = platformEndpoints.reduce((accumulator, endpoint) => {
    const current = accumulator[endpoint.group] || []
    return {
      ...accumulator,
      [endpoint.group]: [...current, endpoint],
    }
  }, {})

  return Object.entries(groups)
})

const toneByMethod = {
  GET: 'success',
  POST: 'accent',
  PATCH: 'warning',
  DELETE: 'danger',
}
</script>

<template>
  <div class="page-stack">
    <section class="hero-card">
      <p class="eyebrow">Mapa de plataforma</p>
      <h2>Todos los endpoints hoy accesibles para platform_admin</h2>
      <p>
        Esta pantalla documenta la cobertura exacta del frontend respecto a los
        endpoints del backend. No incluye endpoints de tienda o storefront porque
        este proyecto esta enfocado solo en plataforma.
      </p>
    </section>

    <SectionCard
      title="Cobertura actual"
      description="Cada card indica que endpoint existe, que hace y desde que vista se ejecuta."
    >
      <div class="endpoint-list">
        <div v-for="[group, endpoints] in groupedEndpoints" :key="group" class="stack-sm">
          <div class="inline-row">
            <h3>{{ group }}</h3>
            <StatusBadge :label="`${endpoints.length} endpoints`" tone="accent" />
          </div>

          <article v-for="endpoint in endpoints" :key="endpoint.path + endpoint.method" class="endpoint-card">
            <div class="endpoint-card__head">
              <div class="endpoint-card__title">
                <h3>{{ endpoint.path }}</h3>
                <p class="muted">{{ endpoint.summary }}</p>
              </div>
              <StatusBadge :label="endpoint.method" :tone="toneByMethod[endpoint.method] || 'neutral'" />
            </div>

            <div class="endpoint-card__body">
              <p class="helper-line">
                Superficie en la UI:
                <strong>{{ endpoint.surface }}</strong>
              </p>
              <div class="helper-chip">
                Payload esperado: {{ endpoint.payload.join(' | ') }}
              </div>
              <div>
                <RouterLink class="button button--secondary" :to="{ name: endpoint.routeName }">
                  Abrir {{ endpoint.surface }}
                </RouterLink>
              </div>
            </div>
          </article>
        </div>
      </div>
    </SectionCard>

    <SectionCard
      title="Notas de alcance"
      description="La UI esta orientada a operaciones reales, no a un cliente REST generico."
    >
      <div class="empty-state">
        <h3>Que queda cubierto</h3>
        <p>Login, listar y crear tenants, listar y crear stores, listar usuarios, detalle, crear, editar y eliminar.</p>
      </div>
      <div class="empty-state">
        <h3>Que no se mezcla aqui</h3>
        <p>Endpoints `admin/*` y `storefront/*` siguen perteneciendo a frontends por tenant o cliente final.</p>
      </div>
    </SectionCard>
  </div>
</template>
