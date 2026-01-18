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

## Flujo de compra
1. El usuario agrega variantes al carrito (localStorage).
2. En checkout se crea un cart en backend.
3. Se confirma checkout con `POST /storefront/checkout/confirm`.
4. Se devuelve orden + instrucciones de transferencia + referencia.

## Headers de contexto
Todas las llamadas storefront agregan `x-store-slug` para resolver el store.

## Componentes clave
- `components/SiteHeader.vue`: navegacion y contador de carrito.
- `components/ProductCard.vue`: tarjeta de producto con CTA.
- `components/CartSummary.vue`: resumen reutilizable.
- `composables/useCart.ts`: carrito local con persistencia.
