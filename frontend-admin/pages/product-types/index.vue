<template>
  <section class="fade-in">
    <div class="page-head">
      <div>
        <h1 class="title">Tipos de producto</h1>
        <p class="muted">
          Define sets de atributos para reutilizar en nuevos productos.
        </p>
      </div>
    </div>
  </section>

  <section class="grid grid-2 fade-in">
    <form class="card form" @submit.prevent="createType">
      <h3>Nuevo tipo</h3>
      <label>
        Nombre
        <input v-model="form.name" required />
      </label>
      <div class="attribute-list">
        <div v-for="attr in attributes" :key="attr.id" class="attribute-row">
          <label class="checkbox">
            <input
              type="checkbox"
              v-model="selectedAttributes"
              :value="attr.id"
            />
            {{ attr.name }} ({{ attr.code }})
          </label>
          <div v-if="selectedAttributes.includes(attr.id)" class="attribute-flags">
            <label class="checkbox">
              <input type="checkbox" v-model="attributeFlags[attr.id].isRequired" />
              requerido
            </label>
            <label class="checkbox">
              <input type="checkbox" v-model="attributeFlags[attr.id].isVariantAxis" />
              variante
            </label>
          </div>
        </div>
      </div>
      <button class="btn btn-primary" type="submit" :disabled="saving">
        {{ saving ? 'Guardando...' : 'Crear tipo' }}
      </button>
      <p v-if="message" class="muted">{{ message }}</p>
    </form>

    <div class="card">
      <h3>Listado</h3>
      <div v-if="productTypes.length" class="list">
        <div v-for="type in productTypes" :key="type.id" class="list-row">
          <strong>{{ type.name }}</strong>
          <div class="muted">
            {{
              type.attributes
                ?.map((attr) => attr.attributeDefinition?.name || '')
                .filter(Boolean)
                .join(', ') || 'Sin atributos'
            }}
          </div>
        </div>
      </div>
      <p v-else class="muted">Sin tipos aun.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { AttributeDefinition, ProductType } from '~/types';

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

const { data: attrData } = await useFetch<AttributeDefinition[]>('/admin/attributes', {
  baseURL: config.public.apiUrl,
  server: false,
  headers: apiHeaders,
});

const { data: typeData, refresh } = await useFetch<ProductType[]>(
  '/admin/product-types',
  {
    baseURL: config.public.apiUrl,
    server: false,
    headers: apiHeaders,
  },
);

const attributes = computed(() => attrData.value ?? []);
const productTypes = computed(() => typeData.value ?? []);

const form = reactive({
  name: '',
});

const selectedAttributes = ref<string[]>([]);
const attributeFlags = reactive<Record<string, { isRequired: boolean; isVariantAxis: boolean }>>(
  {},
);

watch(
  () => attributes.value,
  (list) => {
    list.forEach((attr) => {
      if (!attributeFlags[attr.id]) {
        attributeFlags[attr.id] = { isRequired: false, isVariantAxis: false };
      }
    });
  },
  { immediate: true },
);

const createType = async () => {
  message.value = '';
  saving.value = true;
  try {
    const payload = selectedAttributes.value.map((id) => ({
      attributeDefinitionId: id,
      isRequired: attributeFlags[id]?.isRequired ?? false,
      isVariantAxis: attributeFlags[id]?.isVariantAxis ?? false,
    }));
    await $fetch('/admin/product-types', {
      baseURL: config.public.apiUrl,
      method: 'POST',
      headers: apiHeaders.value,
      body: {
        name: form.name,
        attributes: payload.length ? payload : undefined,
      },
    });
    message.value = 'Tipo creado.';
    form.name = '';
    selectedAttributes.value = [];
    await refresh();
  } catch (error) {
    message.value = 'No se pudo crear el tipo.';
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
  gap: 12px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
}

input {
  border: 1px solid var(--outline);
  border-radius: 10px;
  padding: 8px 10px;
}

.attribute-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.attribute-row {
  border: 1px solid var(--outline);
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attribute-flags {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--muted);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-row {
  border-bottom: 1px solid var(--outline);
  padding-bottom: 10px;
}
</style>
