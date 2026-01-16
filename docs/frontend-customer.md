# Frontend Customer

## Resumen
Aplicacion Nuxt para clientes. Muestra catalogo, detalle de producto, carrito y checkout conectado al API.

## Ejecutar
```bash
cd frontend-customer
npm install
npm run dev
```

## Variables de entorno
- `NUXT_PUBLIC_API_URL`: base del API (default `http://localhost:4000`)

## Rutas principales
- `/` Catalogo y hero.
- `/product/:id` Detalle de producto.
- `/cart` Carrito y resumen.
- `/checkout` Checkout y creacion de pedido.

## Componentes clave
- `components/SiteHeader.vue`: navegacion y contador de carrito.
- `components/ProductCard.vue`: tarjeta de producto con CTA.
- `components/CartSummary.vue`: resumen reutilizable.

## Estado y datos
- `composables/useCart.ts`: carrito con persistencia en `localStorage`.
- `useFetch`/`$fetch` para consumir `/products` y `/orders`.

## Estilos
- `assets/main.css`: variables de color, tipografia y layout base.
- Animaciones `fadeUp` y grid responsivo.

## Flujo de compra
1. El usuario agrega productos al carrito.
2. En checkout se capturan datos de envio.
3. Se crea el pedido via `POST /orders`.
4. Se muestra confirmacion con el id de orden.
