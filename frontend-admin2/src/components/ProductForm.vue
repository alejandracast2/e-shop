<script setup>
const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  categories: {
    type: Array,
    default: () => [],
  },
  productTypes: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  submitLabel: {
    type: String,
    required: true,
  },
  loadingLabel: {
    type: String,
    default: 'Guardando...',
  },
  errorMessage: {
    type: String,
    default: '',
  },
  disableStock: {
    type: Boolean,
    default: false,
  },
  stockHint: {
    type: String,
    default: '',
  },
})

defineEmits(['submit'])

const ensureImages = () => {
  if (!Array.isArray(props.form.images)) {
    props.form.images = []
  }

  return props.form.images
}

const normalizeImageOrder = () => {
  const images = ensureImages()
  images.forEach((image, index) => {
    image.sortOrder = index
    image.isCover = index === 0
  })
}

const addImage = () => {
  const images = ensureImages()
  images.push({
    url: '',
    sortOrder: images.length,
    isCover: images.length === 0,
  })
  normalizeImageOrder()
}

const removeImage = (index) => {
  ensureImages().splice(index, 1)
  normalizeImageOrder()
}
</script>

<template>
  <form class="panel fade-in" @submit.prevent="$emit('submit')">
    <div class="field-grid">
      <label class="field field--full">
        <span>Titulo</span>
        <input v-model.trim="form.title" type="text" required />
      </label>

      <label class="field">
        <span>Slug</span>
        <input v-model.trim="form.slug" type="text" required />
      </label>

      <label class="field">
        <span>Marca</span>
        <input v-model.trim="form.brand" type="text" />
      </label>

      <label class="field">
        <span>SKU</span>
        <input v-model.trim="form.sku" type="text" />
      </label>

      <label class="field">
        <span>Codigo de barras</span>
        <input v-model.trim="form.barcode" type="text" />
      </label>

      <label class="field">
        <span>Categoria</span>
        <select v-model="form.categoryId">
          <option value="">Sin categoria</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.label || category.name }}
          </option>
        </select>
      </label>

      <label class="field">
        <span>Tipo de producto</span>
        <select v-model="form.productTypeId">
          <option value="">Sin tipo</option>
          <option v-for="type in productTypes" :key="type.id" :value="type.id">
            {{ type.name }}
          </option>
        </select>
      </label>

      <label class="field field--full">
        <span>Descripcion</span>
        <textarea v-model.trim="form.description" rows="4" />
      </label>

      <div class="field field--full image-manager">
        <div class="image-manager__header">
          <span>Imagenes</span>
          <button
            class="image-manager__add"
            type="button"
            title="Agregar imagen"
            aria-label="Agregar imagen"
            @click="addImage"
          >
            +
          </button>
        </div>

        <div v-if="form.images?.length" class="image-manager__list">
          <div
            v-for="(image, index) in form.images"
            :key="image.id || `image-${index}`"
            class="image-manager__row"
          >
            <input
              v-model.trim="image.url"
              type="url"
              placeholder="https://..."
              @blur="normalizeImageOrder"
            />
            <span v-if="index === 0" class="image-manager__cover">Portada</span>
            <span v-else class="image-manager__cover-placeholder" aria-hidden="true"></span>
            <button
              class="image-manager__remove"
              type="button"
              title="Quitar imagen"
              aria-label="Quitar imagen"
              @click="removeImage(index)"
            >
              x
            </button>
          </div>
        </div>
      </div>

      <label class="field field--full">
        <span>Etiquetas</span>
        <input
          v-model.trim="form.tagsText"
          type="text"
          placeholder="15%, nuevo, edicion limitada"
        />
      </label>

      <label class="field">
        <span>Precio</span>
        <input v-model.number="form.price" type="number" min="0" step="0.01" required />
      </label>

      <label class="field">
        <span>{{ disableStock ? 'Stock visible' : 'Stock' }}</span>
        <input
          v-model.number="form.stock"
          type="number"
          min="0"
          :disabled="disableStock"
          required
        />
      </label>

      <label class="field">
        <span>Estado</span>
        <select v-model="form.status">
          <option value="active">active</option>
          <option value="draft">draft</option>
          <option value="archived">archived</option>
        </select>
      </label>
    </div>

    <p v-if="stockHint" class="muted">{{ stockHint }}</p>
    <div v-if="errorMessage" class="status-message status-message--error">{{ errorMessage }}</div>

    <div class="actions-row">
      <button class="btn btn-primary" type="submit" :disabled="loading">
        {{ loading ? loadingLabel : submitLabel }}
      </button>
      <slot name="actions" />
    </div>
  </form>
</template>

<style scoped>
.image-manager {
  gap: 10px;
}

.image-manager__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.image-manager__add,
.image-manager__remove {
  display: inline-grid;
  flex: 0 0 auto;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid var(--outline);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: var(--text);
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
}

.image-manager__add {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.image-manager__list {
  display: grid;
  gap: 10px;
}

.image-manager__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 8px;
}

.image-manager__cover {
  min-width: 72px;
  padding: 8px 10px;
  border-radius: 999px;
  background: var(--surface-muted);
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 800;
  text-align: center;
}

.image-manager__cover-placeholder {
  width: 72px;
}

.image-manager__remove {
  color: var(--danger);
  font-size: 1.2rem;
}

@media (max-width: 640px) {
  .image-manager__row {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .image-manager__cover {
    grid-column: 1 / -1;
    justify-self: start;
  }

  .image-manager__cover-placeholder {
    display: none;
  }
}
</style>
