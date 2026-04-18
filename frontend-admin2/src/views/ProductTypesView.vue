<script setup>
import { computed, reactive, ref, watch } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { useAdminStore } from '@/stores/admin'
import { useAuthStore } from '@/stores/auth'
import { toErrorMessage } from '@/lib/api'

const auth = useAuthStore()
const admin = useAdminStore()

const loading = ref(false)
const saving = ref(false)
const feedback = ref('')
const feedbackType = ref('success')
const attributes = ref([])
const productTypes = ref([])
const selectedAttributes = ref([])
const attributeFlags = reactive({})

const form = reactive({
  name: '',
})

const loadData = async () => {
  if (!auth.isAuthenticated) return

  loading.value = true
  feedback.value = ''

  try {
    const [attributePayload, typePayload] = await Promise.all([
      admin.authorizedRequest('/admin/attributes'),
      admin.authorizedRequest('/admin/product-types'),
    ])

    attributes.value = Array.isArray(attributePayload) ? attributePayload : []
    productTypes.value = Array.isArray(typePayload) ? typePayload : []

    attributes.value.forEach((attribute) => {
      if (!attributeFlags[attribute.id]) {
        attributeFlags[attribute.id] = {
          isRequired: false,
          isVariantAxis: false,
        }
      }
    })
  } catch (error) {
    feedback.value = toErrorMessage(error, 'No se pudieron cargar los tipos de producto.')
    feedbackType.value = 'error'
  } finally {
    loading.value = false
  }
}

watch(
  () => admin.requestScopeKey,
  () => {
    void loadData()
  },
  { immediate: true },
)

const setFeedback = (message, type = 'success') => {
  feedback.value = message
  feedbackType.value = type
}

const createType = async () => {
  saving.value = true
  setFeedback('')

  try {
    const payload = selectedAttributes.value.map((attributeId) => ({
      attributeDefinitionId: attributeId,
      isRequired: attributeFlags[attributeId]?.isRequired || false,
      isVariantAxis: attributeFlags[attributeId]?.isVariantAxis || false,
    }))

    await admin.authorizedRequest('/admin/product-types', {
      method: 'POST',
      body: {
        name: form.name,
        attributes: payload.length ? payload : undefined,
      },
    })

    form.name = ''
    selectedAttributes.value = []
    setFeedback('Tipo de producto creado.')
    await loadData()
  } catch (error) {
    setFeedback(toErrorMessage(error, 'No se pudo crear el tipo de producto.'), 'error')
  } finally {
    saving.value = false
  }
}

const selectedCount = computed(() => selectedAttributes.value.length)
</script>

<template>
  <PageHeader
    title="Tipos de producto"
    description="Agrupa atributos en sets reutilizables para formularios y catalogo."
  >
    <template #actions>
      <span class="pill">{{ selectedCount }} atributos elegidos</span>
    </template>
  </PageHeader>

  <div
    v-if="feedback"
    class="status-message fade-in"
    :class="feedbackType === 'error' ? 'status-message--error' : 'status-message--success'"
  >
    {{ feedback }}
  </div>

  <section v-if="loading" class="panel fade-in">
    <p class="muted">Cargando tipos y atributos...</p>
  </section>

  <section v-else class="grid-2 fade-in">
    <form class="panel" @submit.prevent="createType">
      <h2>Nuevo tipo</h2>

      <label class="field">
        <span>Nombre</span>
        <input v-model.trim="form.name" type="text" required />
      </label>

      <div class="type-attribute-list">
        <article v-for="attribute in attributes" :key="attribute.id" class="type-attribute-item">
          <label class="checkbox-row">
            <input v-model="selectedAttributes" type="checkbox" :value="attribute.id" />
            <span>{{ attribute.name }} ({{ attribute.code }})</span>
          </label>

          <div v-if="selectedAttributes.includes(attribute.id)" class="actions-row">
            <label class="checkbox-row">
              <input v-model="attributeFlags[attribute.id].isRequired" type="checkbox" />
              <span>requerido</span>
            </label>

            <label class="checkbox-row">
              <input v-model="attributeFlags[attribute.id].isVariantAxis" type="checkbox" />
              <span>variante</span>
            </label>
          </div>
        </article>
      </div>

      <div class="actions-row">
        <button class="btn btn-primary" type="submit" :disabled="saving">
          {{ saving ? 'Guardando...' : 'Crear tipo' }}
        </button>
      </div>
    </form>

    <article class="panel">
      <h2>Listado</h2>

      <div v-if="productTypes.length" class="list">
        <div v-for="type in productTypes" :key="type.id" class="list-row">
          <div>
            <strong>{{ type.name }}</strong>
            <div class="muted">
              {{
                type.attributes
                  ?.map((attribute) => attribute.attributeDefinition?.name)
                  .filter(Boolean)
                  .join(', ') || 'Sin atributos'
              }}
            </div>
          </div>
          <span class="pill">{{ type.attributes?.length || 0 }} atributos</span>
        </div>
      </div>

      <div v-else class="empty-state">Todavia no hay tipos creados.</div>
    </article>
  </section>
</template>

<style scoped>
h2 {
  margin-top: 0;
}

.type-attribute-list {
  display: grid;
  gap: 10px;
}

.type-attribute-item {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--outline);
  background: rgba(255, 255, 255, 0.55);
}
</style>
