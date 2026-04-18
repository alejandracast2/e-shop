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

const form = reactive({
  code: '',
  name: '',
  type: 'text',
  unit: '',
  isVariantAxis: false,
  isFilterable: false,
  isRequired: false,
  optionsText: '',
})

const loadAttributes = async () => {
  if (!auth.isAuthenticated) return

  loading.value = true
  feedback.value = ''

  try {
    const payload = await admin.authorizedRequest('/admin/attributes')
    attributes.value = Array.isArray(payload) ? payload : []
  } catch (error) {
    feedback.value = toErrorMessage(error, 'No se pudieron cargar los atributos.')
    feedbackType.value = 'error'
  } finally {
    loading.value = false
  }
}

watch(
  () => admin.requestScopeKey,
  () => {
    void loadAttributes()
  },
  { immediate: true },
)

const setFeedback = (message, type = 'success') => {
  feedback.value = message
  feedbackType.value = type
}

const createAttribute = async () => {
  saving.value = true
  setFeedback('')

  try {
    const options = form.optionsText
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => ({ value }))

    await admin.authorizedRequest('/admin/attributes', {
      method: 'POST',
      body: {
        code: form.code,
        name: form.name,
        type: form.type,
        unit: form.unit || undefined,
        isVariantAxis: form.isVariantAxis,
        isFilterable: form.isFilterable,
        isRequired: form.isRequired,
        options: options.length ? options : undefined,
      },
    })

    form.code = ''
    form.name = ''
    form.type = 'text'
    form.unit = ''
    form.isVariantAxis = false
    form.isFilterable = false
    form.isRequired = false
    form.optionsText = ''

    setFeedback('Atributo creado.')
    await loadAttributes()
  } catch (error) {
    setFeedback(toErrorMessage(error, 'No se pudo crear el atributo.'), 'error')
  } finally {
    saving.value = false
  }
}

const attributeCount = computed(() => attributes.value.length)
</script>

<template>
  <PageHeader
    title="Atributos"
    description="Define metadatos reutilizables para filtros, variantes y validaciones."
  >
    <template #actions>
      <span class="pill">{{ attributeCount }} atributos</span>
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
    <p class="muted">Cargando atributos...</p>
  </section>

  <section v-else class="grid-2 fade-in">
    <form class="panel" @submit.prevent="createAttribute">
      <h2>Nuevo atributo</h2>

      <div class="field-grid">
        <label class="field">
          <span>Codigo</span>
          <input v-model.trim="form.code" type="text" required />
        </label>

        <label class="field">
          <span>Nombre</span>
          <input v-model.trim="form.name" type="text" required />
        </label>

        <label class="field">
          <span>Tipo</span>
          <select v-model="form.type">
            <option value="text">text</option>
            <option value="number">number</option>
            <option value="boolean">boolean</option>
            <option value="date">date</option>
            <option value="select">select</option>
            <option value="multiselect">multiselect</option>
          </select>
        </label>

        <label class="field">
          <span>Unidad</span>
          <input v-model.trim="form.unit" type="text" placeholder="cm, gr, ml..." />
        </label>

        <label class="field field--full">
          <span>Opciones separadas por coma</span>
          <input v-model.trim="form.optionsText" type="text" placeholder="Rojo, Negro, Azul" />
        </label>
      </div>

      <div class="actions-row">
        <label class="checkbox-row">
          <input v-model="form.isVariantAxis" type="checkbox" />
          <span>Es eje de variante</span>
        </label>

        <label class="checkbox-row">
          <input v-model="form.isFilterable" type="checkbox" />
          <span>Es filtrable</span>
        </label>

        <label class="checkbox-row">
          <input v-model="form.isRequired" type="checkbox" />
          <span>Es requerido</span>
        </label>
      </div>

      <div class="actions-row">
        <button class="btn btn-primary" type="submit" :disabled="saving">
          {{ saving ? 'Guardando...' : 'Crear atributo' }}
        </button>
      </div>
    </form>

    <article class="panel">
      <h2>Listado</h2>

      <div v-if="attributes.length" class="list">
        <div v-for="attribute in attributes" :key="attribute.id" class="attribute-row">
          <div>
            <strong>{{ attribute.name }}</strong>
            <div class="muted">
              {{ attribute.code }} · {{ attribute.type }}
              <span v-if="attribute.unit"> · {{ attribute.unit }}</span>
            </div>
          </div>

          <div class="actions-row">
            <span v-if="attribute.isVariantAxis" class="pill">variante</span>
            <span v-if="attribute.isFilterable" class="pill">filtro</span>
            <span v-if="attribute.isRequired" class="pill">requerido</span>
          </div>

          <div class="muted">
            {{ attribute.options?.map((option) => option.value).join(', ') || 'Sin opciones' }}
          </div>
        </div>
      </div>

      <div v-else class="empty-state">Todavia no hay atributos definidos.</div>
    </article>
  </section>
</template>

<style scoped>
h2 {
  margin-top: 0;
}

.attribute-row {
  display: grid;
  gap: 10px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--outline);
}
</style>
