<script setup>
defineProps({
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
