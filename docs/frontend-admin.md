# Frontend Admin

## Resumen
Panel de administracion en Nuxt. Gestiona catalogo, inventario, pedidos y clientes. Consume endpoints `admin` del backend con JWT.

## Ejecutar
```bash
cd frontend-admin
npm install
npm run dev
```

## Variables de entorno
- `NUXT_PUBLIC_API_URL`: base del API (default `http://localhost:4000`)
- `NUXT_PUBLIC_STORE_SLUG`: slug del store (default `default`)

## Rutas principales
- `/` Dashboard con metricas.
- `/login` Acceso al panel.
- `/products` listado de productos.
- `/products/new` alta de producto (crea variante base + stock).
- `/products/:id` edicion de producto + variante principal.
- `/orders` listado de pedidos.
- `/orders/:id` detalle y actualizacion de status.
- `/customers` listado de clientes.

## Headers de contexto
Todas las llamadas admin agregan:
- `Authorization: Bearer <token>`
- `x-store-slug`

## Acciones conectadas al API
- `POST /admin/products` crear producto con variante.
- `PATCH /admin/products/:id` editar datos del producto.
- `PATCH /admin/variants/:id` editar SKU/precio.
- `POST /admin/inventory/variants/:id/stock` ajustar stock.
- `GET /admin/orders` y `PATCH /admin/orders/:id` para estados.
- `GET /admin/customers` para listado.

## Autenticacion
Credenciales seed:
- `admin@cafedeorigen.com` / `admin123`
- `staff@cafedeorigen.com` / `admin123`
El token se guarda en `localStorage` y se envia en `Authorization`.

## Componentes clave
- `components/AdminSidebar.vue`: navegacion lateral.
- `components/AdminTopbar.vue`: acciones rapidas.
- `components/StatCard.vue`: tarjetas de metricas.
