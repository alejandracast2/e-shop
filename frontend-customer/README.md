# Frontend Customer

Nuxt storefront para clientes. Consume endpoints `storefront` del backend.

## Setup
```bash
npm install
```

## Variables
- `NUXT_PUBLIC_API_URL` (default `http://localhost:4000`)
- `NUXT_PUBLIC_STORE_SLUG` (default `default`)

## Development
```bash
npm run dev
```

## Rutas
- `/` catalogo
- `/product/:slug` detalle
- `/cart` carrito
- `/checkout` checkout + transferencia
