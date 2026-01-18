# Frontend Customer

## Resumen
Aplicacion Nuxt para clientes. Muestra catalogo, detalle, carrito y checkout con pago por transferencia. Consume endpoints `storefront` del backend.

## Ejecutar
```bash
cd frontend-customer
npm install
npm run dev
```

## Variables de entorno
- `NUXT_PUBLIC_API_URL`: base del API (default `http://localhost:4000`)
- `NUXT_PUBLIC_STORE_SLUG`: slug del store (default `default`)

## Rutas principales
- `/` Catalogo y hero.
- `/product/:slug` Detalle de producto.
- `/cart` Carrito y resumen.
- `/checkout` Checkout y confirmacion de pago offline.
- `/orders` Consulta de pedido por numero + email.

## Flujo de compra
1. El usuario filtra por categoria o busca productos (`GET /storefront/categories`, `GET /storefront/products`).
2. Agrega variantes al carrito (localStorage).
3. En checkout se crea un cart en backend.
4. Se confirma checkout con `POST /storefront/checkout/confirm`.
5. Se devuelve orden + intent de pago + instrucciones por metodo.
6. Opcional: el cliente envia comprobante con `POST /storefront/payments/:intentId/proof`.

## Headers de contexto
Todas las llamadas storefront agregan `x-store-slug` para resolver el store.

## Flujos soportados
- **Catalogo + filtros**: categorias desde `/storefront/categories` y query `search`/`category` en `/storefront/products`.
- **Checkout**: seleccion de metodo de pago, envio de datos de cliente y direccion.
- **Pago offline**: envio de URL de comprobante y metadata (banco/fecha).
- **Consulta de pedido**: `/storefront/orders/:orderNumber` con query opcional `email`.

## Componentes clave
- `components/SiteHeader.vue`: navegacion y contador de carrito.
- `components/ProductCard.vue`: tarjeta de producto con CTA.
- `components/CartSummary.vue`: resumen reutilizable.
- `composables/useCart.ts`: carrito local con persistencia.
