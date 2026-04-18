# frontend-admin2

Panel administrativo en Vue 3 + Vite que reemplaza a `frontend-admin` sin depender de Nuxt.

## Variables de entorno

Usa un archivo `.env` con estas variables:

```env
VITE_API_URL=http://localhost:4000
VITE_STORE_SLUG=default
```

- `VITE_API_URL`: URL base del backend.
- `VITE_STORE_SLUG`: store por defecto cuando el usuario no tiene una store fija asignada.

## Desarrollo

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

## Cobertura funcional

- Login admin con roles `tenant_owner`, `store_admin` y `store_staff`.
- Dashboard con metricas de productos, pedidos y clientes.
- Productos: listar, filtrar, crear, editar, archivar y reactivar.
- Categorias: crear, editar jerarquia y bloquear/reactivar.
- Atributos y tipos de producto.
- Pedidos: listado, filtro por estado y detalle editable segun rol.
- Pagos: listado y revision para roles con permisos.
- Clientes: listado con buscador.
