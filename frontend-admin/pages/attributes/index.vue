<template>
  <section class="fade-in">
    <div class="page-head">
      <div>
        <h1 class="title">Atributos</h1>
        <p class="muted">
          Define atributos para filtros y variantes (color, talle, material).
        </p>
      </div>
    </div>
  </section>

  <section class="grid grid-2 fade-in">
    <form class="card form" @submit.prevent="createAttribute">
      <h3>Nuevo atributo</h3>
      <label>
        Codigo
        <input v-model="form.code" required />
      </label>
      <label>
        Nombre
        <input v-model="form.name" required />
      </label>
      <label>
        Tipo
        <select v-model="form.type">
          <option value="text">text</option>
          <option value="number">number</option>
          <option value="boolean">boolean</option>
          <option value="date">date</option>
          <option value="select">select</option>
          <option value="multiselect">multiselect</option>
        </select>
      </label>
      <label>
        Unidad (opcional)
        <input v-model="form.unit" />
      </label>
      <label class="checkbox">
        <input v-model="form.isVariantAxis" type="checkbox" />
        Es eje de variante
      </label>
      <label class="checkbox">
        <input v-model="form.isFilterable" type="checkbox" />
        Es filtrable
      </label>
      <label class="checkbox">
        <input v-model="form.isRequired" type="checkbox" />
        Es requerido
      </label>
      <label>
        Opciones (separadas por coma)
        <input v-model="form.optionsText" placeholder="Rojo, Negro, Azul" />
      </label>
      <button class="btn btn-primary" type="submit" :disabled="saving">
        {{ saving ? 'Guardando...' : 'Crear atributo' }}
      </button>
      <p v-if="message" class="muted">{{ message }}</p>
    </form>

    <div class="card">
      <h3>Listado</h3>
      <div v-if="attributes.length" class="list">
        <div v-for="attribute in attributes" :key="attribute.id" class="list-row">
          <div>
            <strong>{{ attribute.name }}</strong>
            <div class="muted">
              {{ attribute.code }} · {{ attribute.type }}
              <span v-if="attribute.unit">· {{ attribute.unit }}</span>
            </div>
          </div>
          <div class="tags">
            <span v-if="attribute.isVariantAxis" class="pill">variante</span>
            <span v-if="attribute.isFilterable" class="pill">filtro</span>
            <span v-if="attribute.isRequired" class="pill">requerido</span>
          </div>
          <div class="muted options">
            {{ attribute.options?.map((o) => o.value).join(', ') || 'Sin opciones' }}
          </div>
        </div>
      </div>
      <p v-else class="muted">Sin atributos aun.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { AttributeDefinition } from '~/types';

definePageMeta({ middleware: 'auth' });

const config = useRuntimeConfig();
const { authHeaders, hydrate } = useAuth();
hydrate();

const saving = ref(false);
const message = ref('');

const apiHeaders = computed(() => ({
  ...authHeaders.value,
  'x-store-slug': config.public.storeSlug,
}));

const { data, refresh } = await useFetch<AttributeDefinition[]>('/admin/attributes', {
  baseURL: config.public.apiUrl,
  server: false,
  headers: apiHeaders,
});

const attributes = computed(() => data.value ?? []);

const form = reactive({
  code: '',
  name: '',
  type: 'text',
  unit: '',
  isVariantAxis: false,
  isFilterable: false,
  isRequired: false,
  optionsText: '',
});

const createAttribute = async () => {
  message.value = '';
  saving.value = true;
  try {
    const options = form.optionsText
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => ({ value }));
    await $fetch('/admin/attributes', {
      baseURL: config.public.apiUrl,
      method: 'POST',
      headers: apiHeaders.value,
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
    });
    message.value = 'Atributo creado.';
    form.code = '';
    form.name = '';
    form.type = 'text';
    form.unit = '';
    form.isVariantAxis = false;
    form.isFilterable = false;
    form.isRequired = false;
    form.optionsText = '';
    await refresh();
  } catch (error) {
    message.value = 'No se pudo crear el atributo.';
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 18px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
}

input,
select {
  border: 1px solid var(--outline);
  border-radius: 10px;
  padding: 8px 10px;
}

.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--muted);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.list-row {
  border-bottom: 1px solid var(--outline);
  padding-bottom: 12px;
  display: grid;
  gap: 6px;
}

.tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.options {
  font-size: 12px;
}
</style>
