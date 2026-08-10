# API Backend (NestJS)

## Resumen
Backend en NestJS con TypeORM y Postgres. Arquitectura multi-tenant (tenant + store) en una sola base. Expone endpoints admin y storefront, con auth JWT y roles por tenant/store.

## Requisitos
- Node.js 20+
- Postgres 16+ (o Docker Compose)

## Variables de entorno
- `DB_HOST`: host de Postgres (default `localhost`)
- `DB_PORT`: puerto (default `5432`)
- `DB_USER`: usuario (default `postgres`)
- `DB_PASS`: password (default `postgres`)
- `DB_NAME`: nombre de DB (default `ecommerce`)
- `PORT`: puerto del API (default `4000`)
- `CORS_ORIGIN`: origins permitidos separados por coma (en desarrollo se permiten `http://localhost:3000` y `http://localhost:5173` por defecto)
- `JWT_SECRET`: secreto JWT
- `JWT_EXPIRES_IN`: expiracion JWT (ej `8h`)
- `DEFAULT_STORE_SLUG`: slug de store fallback (default `default`)
- `GOOGLE_CLIENT_ID`: OAuth Web Client ID de Google (opcional; habilita el inicio con Google)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: SMTP para enviar códigos de acceso y recuperación. En desarrollo, sin `SMTP_HOST`, el código se registra solamente en la consola del backend.

## Ejecutar
```bash
cd backend
npm install
npm run start:dev
```

En producción, antes de desplegar esta versión ejecuta la migración de autenticación:

```bash
npm run migration:run
```

## Seed
```bash
cd backend
npm run seed
```
Incluye tenant/store, roles, usuarios admin/staff, catalogo amplio con categorias, atributos, tipos, variantes e inventario, clientes y multiples ordenes con distintos estados de pago.

Credenciales seed:
- `platform@eshop.com` / `admin123` (platform_admin)
- `owner@cafedeorigen.com` / `admin123` (tenant_owner)
- `admin@cafedeorigen.com` / `admin123` (store_admin)
- `staff@cafedeorigen.com` / `admin123` (store_staff)

## Contexto tenant/store
La resolucion de store se hace por:
- Header `x-store-id`
- Header `x-store-slug`
- Subdominio `slug.dominio.com`
- Fallback `DEFAULT_STORE_SLUG`

## Autenticacion
`POST /auth/login`
```json
{ "email": "admin@cafedeorigen.com", "password": "admin123" }
```
Respuesta:
```json
{ "accessToken": "...", "user": { "id": "...", "email": "...", "roles": [] } }
```
Usar `Authorization: Bearer <token>` en endpoints admin.

## Modulos principales
- `TenancyModule`: tenants, stores, settings, middleware de contexto.
- `IamModule`: roles, permisos, user_roles.
- `CatalogModule`: categorias, atributos, product types, productos y variantes.
- `InventoryModule`: warehouses, inventory_levels, reservas.
- `CartsModule`: carritos y items.
- `CheckoutModule`: confirmacion de checkout + pago offline.
- `OrdersModule`: ordenes, items, direcciones, eventos.
- `PaymentsModule`: payment_methods, intents, proofs, confirm/reject.
- `CustomersModule`: clientes y direcciones.

## Endpoints (resumen)

### Auth
- `POST /auth/login`
- `POST /auth/customer/register`
- `POST /auth/customer/login`
- `POST /auth/customer/email-code/request`
- `POST /auth/customer/email-code/verify`
- `POST /auth/customer/password/reset`
- `POST /auth/customer/google`
- `PATCH /auth/customer/profile`

Los endpoints `customer` requieren un contexto explícito de tienda mediante
`x-store-slug` o `x-store-id`. Al registrarse, el usuario se vincula al tenant y
store actuales mediante el rol `customer` y un perfil `Customer`. El checkout
requiere JWT customer, una fecha de nacimiento que confirme mayoría de edad y
un documento de identidad.

### Platform
- `POST /platform/tenants`
- `GET /platform/tenants`
- `POST /platform/tenants/:tenantId/stores`
- `GET /platform/tenants/:tenantId/stores`

### Admin (requiere JWT + roles)
- `GET /admin/products`
- `POST /admin/products`
- `PATCH /admin/products/:id`
- `POST /admin/products/:id/variants`
- `GET /admin/banners`
- `POST /admin/banners`
- `PATCH /admin/banners/:id`
- `DELETE /admin/banners/:id`
- `PATCH /admin/variants/:id`
- `GET /admin/categories`
- `POST /admin/categories`
- `GET /admin/attributes`
- `POST /admin/attributes`
- `GET /admin/product-types`
- `POST /admin/product-types`
- `POST /admin/inventory/variants/:variantId/stock`
- `GET /admin/orders`
- `GET /admin/orders/:id`
- `PATCH /admin/orders/:id`
- `GET /admin/payments`
- `POST /admin/payments/:intentId/confirm`
- `POST /admin/payments/:intentId/reject`
- `GET /admin/customers`
- `GET /admin/customers/:id`

Payload de imagenes en `POST /admin/products` y `PATCH /admin/products/:id`:

```json
{
  "images": [
    {
      "url": "https://cdn.example.com/producto.jpg",
      "sortOrder": 0,
      "isCover": true
    }
  ]
}
```

Tambien se puede enviar `fileId` si el archivo ya existe en la tabla `files`.
En `PATCH`, omitir `images` conserva las imagenes actuales; enviar `images: []` las elimina.

### Storefront (public)
- `GET /storefront/banners`
- `GET /storefront/categories`
- `GET /storefront/products`
- `GET /storefront/products/:slug`
- `POST /storefront/cart`
- `POST /storefront/cart/items`
- `PATCH /storefront/cart/items/:id`
- `POST /storefront/checkout/confirm`
- `GET /storefront/orders/:orderNumber`
- `GET /storefront/payments/methods`
- `POST /storefront/payments/:intentId/proof`

## Notas tecnicas
- `autoLoadEntities` activo en TypeORM.
- `synchronize` habilitado fuera de produccion.
- Toda entidad operativa incluye `tenantId` y `storeId` para aislamiento.
