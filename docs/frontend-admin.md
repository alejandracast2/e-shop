# Frontend Admin

## Resumen
Panel de administracion en Nuxt. Permite gestionar productos, pedidos y clientes desde el navegador.

## Ejecutar
```bash
cd frontend-admin
npm install
npm run dev
```

## Variables de entorno
- `NUXT_PUBLIC_API_URL`: base del API (default `http://localhost:4000`)

## Rutas principales
- `/` Dashboard con metricas.
- `/login` Acceso al panel.
- `/products` listado de productos.
- `/products/new` alta de producto.
- `/products/:id` edicion de producto.
- `/orders` listado de pedidos.
- `/orders/:id` detalle y actualizacion de status.
- `/customers` listado de clientes.

## Componentes clave
- `components/AdminSidebar.vue`: navegacion lateral.
- `components/AdminTopbar.vue`: acciones rapidas.
- `components/StatCard.vue`: tarjetas de metricas.

## Acciones conectadas al API
- `POST /products` para crear articulos.
- `PATCH /products/:id` para editar y activar/desactivar.
- `GET /orders` y `PATCH /orders/:id` para estados.
- `GET /customers` para listado.

## Autenticacion
Credenciales seed:
- `admin@eshop.com` / `admin123`
- `staff@eshop.com` / `admin123`
El token se guarda en `localStorage` y se envia en `Authorization`.

## Estilos
- `assets/admin.css`: paleta y tipografia distincta al frontend de clientes.
- Layout con sidebar fijo y topbar sticky.
