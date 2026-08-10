<script setup>
import { reactive, ref, watch } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { toErrorMessage } from '@/lib/api'
import { useAdminStore } from '@/stores/admin'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const admin = useAdminStore()

const createEmptyForm = () => ({
  title: '',
  subtitle: '',
  imageUrl: '',
  mobileImageUrl: '',
  ctaLabel: '',
  ctaUrl: '',
  altText: '',
  position: 0,
  isActive: true,
  startsAt: '',
  endsAt: '',
})

const banners = ref([])
const loading = ref(false)
const saving = ref(false)
const deletingId = ref('')
const togglingId = ref('')
const editingId = ref('')
const feedback = ref('')
const feedbackType = ref('success')
const form = reactive(createEmptyForm())

const setFeedback = (message, type = 'success') => {
  feedback.value = message
  feedbackType.value = type
}

const toDateTimeInput = (value) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}

const normalizeOptional = (value) => {
  const normalized = value.trim()
  return normalized || null
}

const toIsoDate = (value) => (value ? new Date(value).toISOString() : null)

const resetForm = () => {
  Object.assign(form, createEmptyForm())
  editingId.value = ''
}

const loadBanners = async () => {
  if (!auth.isAuthenticated) return

  loading.value = true
  feedback.value = ''

  try {
    const payload = await admin.authorizedRequest('/admin/banners')
    banners.value = Array.isArray(payload) ? payload : []
  } catch (error) {
    setFeedback(toErrorMessage(error, 'No se pudieron cargar los banners.'), 'error')
  } finally {
    loading.value = false
  }
}

watch(
  () => admin.requestScopeKey,
  () => {
    resetForm()
    void loadBanners()
  },
  { immediate: true },
)

const validateDates = () => {
  if (!form.startsAt || !form.endsAt) return true

  if (new Date(form.endsAt) > new Date(form.startsAt)) return true

  setFeedback('La fecha de finalizacion debe ser posterior a la de inicio.', 'error')
  return false
}

const buildPayload = () => ({
  title: form.title.trim(),
  subtitle: normalizeOptional(form.subtitle),
  imageUrl: form.imageUrl.trim(),
  mobileImageUrl: normalizeOptional(form.mobileImageUrl),
  ctaLabel: normalizeOptional(form.ctaLabel),
  ctaUrl: normalizeOptional(form.ctaUrl),
  altText: normalizeOptional(form.altText),
  position: Number(form.position || 0),
  isActive: form.isActive,
  startsAt: toIsoDate(form.startsAt),
  endsAt: toIsoDate(form.endsAt),
})

const saveBanner = async () => {
  if (!validateDates()) return

  saving.value = true
  feedback.value = ''

  try {
    const isEditing = Boolean(editingId.value)
    await admin.authorizedRequest(isEditing ? `/admin/banners/${editingId.value}` : '/admin/banners', {
      method: isEditing ? 'PATCH' : 'POST',
      body: buildPayload(),
    })

    setFeedback(isEditing ? 'Banner actualizado.' : 'Banner creado.')
    resetForm()
    await loadBanners()
  } catch (error) {
    setFeedback(toErrorMessage(error, 'No se pudo guardar el banner.'), 'error')
  } finally {
    saving.value = false
  }
}

const editBanner = (banner) => {
  editingId.value = banner.id
  form.title = banner.title || ''
  form.subtitle = banner.subtitle || ''
  form.imageUrl = banner.imageUrl || ''
  form.mobileImageUrl = banner.mobileImageUrl || ''
  form.ctaLabel = banner.ctaLabel || ''
  form.ctaUrl = banner.ctaUrl || ''
  form.altText = banner.altText || ''
  form.position = Number(banner.position || 0)
  form.isActive = banner.isActive !== false
  form.startsAt = toDateTimeInput(banner.startsAt)
  form.endsAt = toDateTimeInput(banner.endsAt)
  feedback.value = ''
}

const toggleBanner = async (banner) => {
  togglingId.value = banner.id
  feedback.value = ''

  try {
    await admin.authorizedRequest(`/admin/banners/${banner.id}`, {
      method: 'PATCH',
      body: { isActive: banner.isActive === false },
    })
    setFeedback(banner.isActive === false ? 'Banner activado.' : 'Banner desactivado.')
    await loadBanners()
  } catch (error) {
    setFeedback(toErrorMessage(error, 'No se pudo actualizar el estado.'), 'error')
  } finally {
    togglingId.value = ''
  }
}

const removeBanner = async (banner) => {
  if (!window.confirm(`Eliminar el banner “${banner.title}”? Esta accion se puede restaurar solo desde base de datos.`)) {
    return
  }

  deletingId.value = banner.id
  feedback.value = ''

  try {
    await admin.authorizedRequest(`/admin/banners/${banner.id}`, { method: 'DELETE' })
    if (editingId.value === banner.id) resetForm()
    setFeedback('Banner eliminado.')
    await loadBanners()
  } catch (error) {
    setFeedback(toErrorMessage(error, 'No se pudo eliminar el banner.'), 'error')
  } finally {
    deletingId.value = ''
  }
}

const publicationStatus = (banner) => {
  if (banner.isActive === false) return 'Inactivo'

  const now = Date.now()
  if (banner.startsAt && new Date(banner.startsAt).getTime() > now) return 'Programado'
  if (banner.endsAt && new Date(banner.endsAt).getTime() <= now) return 'Finalizado'
  return 'Publicado'
}
</script>

<template>
  <PageHeader
    title="Banners"
    description="Crea promociones por tienda, define su visibilidad y programa su vigencia."
  />

  <div
    v-if="feedback"
    class="status-message fade-in"
    :class="feedbackType === 'error' ? 'status-message--error' : 'status-message--success'"
  >
    {{ feedback }}
  </div>

  <section class="banner-layout fade-in">
    <form class="panel" @submit.prevent="saveBanner">
      <div class="form-heading">
        <div>
          <h2>{{ editingId ? 'Editar banner' : 'Nuevo banner' }}</h2>
          <p class="muted">La imagen de escritorio es obligatoria. El CTA es opcional, pero requiere texto y destino.</p>
        </div>
        <button v-if="editingId" class="btn btn-ghost" type="button" :disabled="saving" @click="resetForm">
          Cancelar
        </button>
      </div>

      <div class="field-grid">
        <label class="field">
          <span>Titulo</span>
          <input v-model.trim="form.title" type="text" maxlength="160" required />
        </label>

        <label class="field">
          <span>Posicion</span>
          <input v-model.number="form.position" type="number" min="0" required />
        </label>

        <label class="field field--full">
          <span>Texto secundario</span>
          <textarea v-model.trim="form.subtitle" rows="3" placeholder="Describe la promocion o coleccion." />
        </label>

        <label class="field field--full">
          <span>URL de imagen de escritorio</span>
          <input v-model.trim="form.imageUrl" type="url" placeholder="https://..." required />
        </label>

        <label class="field field--full">
          <span>URL de imagen movil</span>
          <input v-model.trim="form.mobileImageUrl" type="url" placeholder="https://..." />
        </label>

        <label class="field">
          <span>Texto del boton</span>
          <input v-model.trim="form.ctaLabel" type="text" maxlength="80" placeholder="Ver coleccion" />
        </label>

        <label class="field">
          <span>Destino del boton</span>
          <input v-model.trim="form.ctaUrl" type="text" placeholder="/product/ejemplo o https://..." />
        </label>

        <label class="field field--full">
          <span>Texto alternativo de imagen</span>
          <input v-model.trim="form.altText" type="text" maxlength="240" placeholder="Descripcion accesible de la imagen" />
        </label>

        <label class="field">
          <span>Inicio de publicacion</span>
          <input v-model="form.startsAt" type="datetime-local" />
        </label>

        <label class="field">
          <span>Fin de publicacion</span>
          <input v-model="form.endsAt" type="datetime-local" />
        </label>
      </div>

      <label class="checkbox-row">
        <input v-model="form.isActive" type="checkbox" />
        <span>Banner activo</span>
      </label>

      <div class="actions-row">
        <button class="btn btn-primary" type="submit" :disabled="saving">
          {{ saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear banner' }}
        </button>
      </div>
    </form>

    <article class="panel preview-panel">
      <h2>Vista previa de imagen</h2>
      <div v-if="form.imageUrl" class="image-preview">
        <img :src="form.imageUrl" :alt="form.altText || form.title || 'Vista previa del banner'" />
        <div class="image-preview__overlay">
          <strong>{{ form.title || 'Titulo del banner' }}</strong>
          <span v-if="form.subtitle">{{ form.subtitle }}</span>
          <span v-if="form.ctaLabel" class="preview-cta">{{ form.ctaLabel }}</span>
        </div>
      </div>
      <div v-else class="empty-preview">Agrega una URL de imagen para ver la vista previa.</div>
    </article>
  </section>

  <section v-if="loading" class="panel fade-in">
    <p class="muted">Cargando banners...</p>
  </section>

  <section v-else class="panel fade-in">
    <div class="table-heading">
      <div>
        <h2>Banners de la tienda</h2>
        <p class="muted">El menor numero de posicion se muestra primero.</p>
      </div>
      <span class="pill">{{ banners.length }} total</span>
    </div>

    <div v-if="banners.length" class="table-wrap">
      <table class="table banner-table">
        <thead>
          <tr>
            <th>Imagen</th>
            <th>Banner</th>
            <th>CTA</th>
            <th>Orden</th>
            <th>Vigencia</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="banner in banners" :key="banner.id">
            <td>
              <img class="banner-thumb" :src="banner.imageUrl" :alt="banner.altText || banner.title" />
            </td>
            <td>
              <strong>{{ banner.title }}</strong>
              <p v-if="banner.subtitle" class="cell-copy">{{ banner.subtitle }}</p>
            </td>
            <td>
              <template v-if="banner.ctaLabel && banner.ctaUrl">
                <strong>{{ banner.ctaLabel }}</strong>
                <a :href="banner.ctaUrl" target="_blank" rel="noopener noreferrer" class="destination-link">
                  {{ banner.ctaUrl }}
                </a>
              </template>
              <span v-else>-</span>
            </td>
            <td>{{ banner.position || 0 }}</td>
            <td>
              <div>{{ banner.startsAt ? new Date(banner.startsAt).toLocaleString() : 'Inmediata' }}</div>
              <div class="muted">{{ banner.endsAt ? `Hasta ${new Date(banner.endsAt).toLocaleString()}` : 'Sin fecha final' }}</div>
            </td>
            <td><span class="pill">{{ publicationStatus(banner) }}</span></td>
            <td>
              <div class="actions-row">
                <button class="btn btn-ghost" type="button" @click="editBanner(banner)">Editar</button>
                <button
                  class="btn btn-ghost"
                  type="button"
                  :disabled="togglingId === banner.id"
                  @click="toggleBanner(banner)"
                >
                  {{ banner.isActive === false ? 'Activar' : 'Desactivar' }}
                </button>
                <button
                  class="btn btn-danger"
                  type="button"
                  :disabled="deletingId === banner.id"
                  @click="removeBanner(banner)"
                >
                  Eliminar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="empty-state">Todavia no hay banners creados para esta tienda.</div>
  </section>
</template>

<style scoped>
.banner-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.85fr);
  gap: 18px;
  margin-bottom: 18px;
}

.form-heading,
.table-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

h2 {
  margin: 0;
}

.form-heading p,
.table-heading p {
  margin: 6px 0 0;
}

.checkbox-row {
  margin: 18px 0;
}

.preview-panel {
  min-width: 0;
}

.image-preview {
  position: relative;
  overflow: hidden;
  min-height: 260px;
  border-radius: var(--radius-lg);
  background: var(--surface-muted);
}

.image-preview img {
  display: block;
  width: 100%;
  min-height: 260px;
  object-fit: cover;
}

.image-preview__overlay {
  position: absolute;
  inset: auto 0 0;
  display: grid;
  gap: 8px;
  padding: 20px;
  color: #fff;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
}

.preview-cta {
  width: fit-content;
  padding: 7px 12px;
  border-radius: 999px;
  background: #fff;
  color: #1b1b1b;
  font-size: 0.85rem;
  font-weight: 700;
}

.empty-preview {
  display: grid;
  min-height: 260px;
  place-items: center;
  padding: 24px;
  border: 1px dashed var(--outline);
  border-radius: var(--radius-lg);
  color: var(--muted);
  text-align: center;
}

.banner-table {
  min-width: 1120px;
}

.banner-thumb {
  display: block;
  width: 112px;
  height: 62px;
  border-radius: 10px;
  object-fit: cover;
  background: var(--surface-muted);
}

.cell-copy {
  max-width: 270px;
  margin: 6px 0 0;
  color: var(--muted);
}

.destination-link {
  display: block;
  max-width: 180px;
  margin-top: 4px;
  overflow: hidden;
  color: var(--color-accent);
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1120px) {
  .banner-layout {
    grid-template-columns: 1fr;
  }
}
</style>
