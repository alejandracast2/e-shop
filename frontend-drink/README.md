# frontend-drink

Store en Vue 3 + Vite para la vertical `drink`, conectada al catálogo, carrito y autenticación customer.

## Estado actual

- Se cubren todos los endpoints publicos reales bajo `/storefront`.
- El icono de Cuenta abre el modal de registro, inicio de sesión, acceso por código y recuperación de contraseña.
- Google Sign-In es opcional y se habilita al definir su client ID.
- La sesión customer se mantiene en una cookie `HttpOnly`; el frontend no guarda tokens ni datos personales sensibles en `localStorage`. Checkout exige fecha de nacimiento, cédula y una cuenta mayor de edad.
- El carrito incluye “Finalizar compra” y abre un checkout de datos personales, entrega y pago.
- Se incluyo tambien `GET /storefront/cart/:id`, porque existe en backend aunque no estaba listado en el resumen corto de docs.

## Setup

```sh
npm install
```

## Variables de entorno

- `VITE_API_URL`: base URL del backend. Default `http://localhost:4000`.
- `VITE_STORE_SLUG`: slug de la tienda enviado en `x-store-slug`.
- `VITE_STORE_ID`: id de tienda opcional enviado en `x-store-id`.
- `VITE_GOOGLE_CLIENT_ID`: OAuth Web Client ID de Google para mostrar el botón opcional de Google Sign-In.

Si defines `VITE_STORE_SLUG` y `VITE_STORE_ID`, ambos headers viajan en cada request de `storefront`.
Para crear, iniciar sesión o recuperar una cuenta customer, debes definir por lo menos `VITE_STORE_SLUG` o `VITE_STORE_ID`: el backend no permite usar la tienda fallback para esos flujos.

## Scripts

```sh
npm run dev
npm run build
npm run preview
npm run test:unit
npm run test:e2e
```

## Estructura agregada

```txt
src/
  lib/
    storefrontApi.js
  components/
    CustomerAuthModal.vue
  stores/
    index.js
    storefrontCategories.js
    storefrontProducts.js
    storefrontCart.js
    storefrontCheckout.js
    storefrontOrders.js
    storefrontPayments.js
    storefrontAuth.js
```

## Utilidad base

`src/lib/storefrontApi.js` centraliza:

- base URL del backend
- headers `x-store-slug` y `x-store-id`
- serializacion de query params
- parseo de respuestas JSON
- normalizacion de errores del backend

La funcion base es:

```js
storefrontRequest(path, {
  method: 'GET',
  query: undefined,
  body: undefined,
  headers: undefined,
})
```

Todas las peticiones incluyen `credentials: 'include'` para que el navegador
envíe la cookie de sesión. La ficha con documento y fecha de nacimiento se carga
solamente desde `GET /auth/customer/profile` mientras la persona consulta o edita
su perfil; no se persiste entre recargas.

## Cobertura de endpoints

| Endpoint | Metodo | Store / accion |
| --- | --- | --- |
| `/storefront/categories` | `GET` | `useStorefrontCategoriesStore().loadCategories()` |
| `/storefront/products` | `GET` | `useStorefrontProductsStore().loadProducts(filters)` |
| `/storefront/products/:slug` | `GET` | `useStorefrontProductsStore().loadProduct(slug)` |
| `/storefront/cart` | `POST` | `useStorefrontCartStore().createCart(payload)` |
| `/storefront/cart/:id` | `GET` | `useStorefrontCartStore().loadCart(cartId)` |
| `/storefront/cart/items` | `POST` | `useStorefrontCartStore().upsertItems(payload)` |
| `/storefront/cart/items/:id` | `PATCH` | `useStorefrontCartStore().updateItem(itemId, payload)` |
| `/storefront/checkout/confirm` | `POST` | `useStorefrontCheckoutStore().confirmCheckout(payload)` |
| `/storefront/orders/:orderNumber` | `GET` | `useStorefrontOrdersStore().loadOrder(orderNumber, { email })` |
| `/storefront/payments/methods` | `GET` | `useStorefrontPaymentsStore().loadPaymentMethods()` |
| `/storefront/payments/:intentId/proof` | `POST` | `useStorefrontPaymentsStore().submitPaymentProof(intentId, payload)` |
| `/auth/customer/*` | `GET` / `POST` / `PATCH` | `useStorefrontAuthStore()` |

## Stores disponibles

### `useStorefrontCategoriesStore`

Estado:

- `categories`
- `loading`
- `error`
- `hasLoaded`

Acciones:

- `loadCategories({ force?: boolean })`

Notas:

- Se mantuvo compatibilidad con la UI actual.
- `hasLoaded` evita requests repetidos si no se pasa `force: true`.

### `useStorefrontProductsStore`

Estado:

- `products`
- `product`
- `productFilters`
- `loadingProducts`
- `loadingProduct`
- `productsError`
- `productError`

Acciones:

- `loadProducts({ search?: string, categoryId?: string })`
- `loadProduct(slug)`
- `resetProducts()`
- `resetProduct()`

Query soportada:

```js
await loadProducts({
  search: 'ron',
  categoryId: 'category-id',
})
```

### `useStorefrontCartStore`

Estado:

- `cart`
- `loading`
- `error`
- `lastAction`

Acciones:

- `createCart(payload)`
- `loadCart(cartId)`
- `upsertItems(payload)`
- `updateItem(itemId, payload)`
- `resetCart()`

Payload `createCart(payload)`:

```json
{
  "cartId": "optional-cart-id",
  "customerId": "optional-customer-id",
  "currency": "USD",
  "items": [
    {
      "variantId": "variant-id",
      "quantity": 2
    }
  ]
}
```

Payload `upsertItems(payload)`:

```json
{
  "cartId": "cart-id",
  "items": [
    {
      "variantId": "variant-id",
      "quantity": 3
    }
  ]
}
```

Payload `updateItem(itemId, payload)`:

```json
{
  "quantity": 1
}
```

### `useStorefrontCheckoutStore`

Estado:

- `checkoutResult`
- `loading`
- `error`

Acciones:

- `confirmCheckout(payload)`
- `resetCheckout()`

Payload esperado:

```json
{
  "cartId": "cart-id",
  "customer": {
    "fullName": "Maria Perez",
    "email": "maria@example.com",
    "phone": "3000000000",
    "documentId": "123456789"
  },
  "shippingAddress": {
    "address1": "Calle 1 # 2-3",
    "address2": "Apto 201",
    "city": "Bogota",
    "state": "Cundinamarca",
    "zip": "110111",
    "country": "CO"
  },
  "billingAddress": {
    "address1": "Calle 1 # 2-3",
    "city": "Bogota",
    "state": "Cundinamarca",
    "zip": "110111",
    "country": "CO"
  },
  "paymentMethod": "bank_transfer",
  "notes": "Entregar en porteria"
}
```

Respuesta esperada:

```json
{
  "order": {
    "id": "order-id",
    "orderNumber": 1001,
    "status": "pending_payment",
    "totalAmount": 120000
  },
  "paymentIntent": {
    "id": "intent-id",
    "status": "pending",
    "referenceCode": "REF-ABC123"
  },
  "paymentMethod": {
    "id": "method-id",
    "type": "bank_transfer",
    "configJson": {}
  }
}
```

### `useStorefrontOrdersStore`

Estado:

- `order`
- `loading`
- `error`
- `lastLookup`

Acciones:

- `loadOrder(orderNumber, { email?: string })`
- `resetOrder()`

Ejemplo:

```js
await loadOrder(1001, {
  email: 'maria@example.com',
})
```

### `useStorefrontPaymentsStore`

Estado:

- `paymentMethods`
- `proofSubmission`
- `loadingMethods`
- `submittingProof`
- `methodsError`
- `proofError`

Acciones:

- `loadPaymentMethods()`
- `submitPaymentProof(intentId, payload)`
- `resetPayments()`

Payload `submitPaymentProof(intentId, payload)`:

```json
{
  "fileUrl": "https://example.com/comprobante.jpg",
  "metadata": {
    "bank": "Banco de Bogota",
    "transferDate": "2026-04-19"
  }
}
```

Respuesta esperada:

```json
{
  "intentId": "intent-id",
  "status": "submitted"
}
```

## Export centralizado

Desde archivos ubicados dentro de `src/`, puedes importar todos los stores desde `./stores`:

```js
import {
  useStorefrontCategoriesStore,
  useStorefrontProductsStore,
  useStorefrontCartStore,
  useStorefrontCheckoutStore,
  useStorefrontOrdersStore,
  useStorefrontPaymentsStore,
} from './stores'
```

## Ejemplos de uso

### Catalogo

```js
import { useStorefrontProductsStore } from '../stores/storefrontProducts'

const productsStore = useStorefrontProductsStore()

await productsStore.loadProducts({
  search: 'whisky',
})

await productsStore.loadProduct('johnnie-walker-black')
```

### Carrito + checkout

```js
import {
  useStorefrontCartStore,
  useStorefrontCheckoutStore,
} from '../stores'

const cartStore = useStorefrontCartStore()
const checkoutStore = useStorefrontCheckoutStore()

const cart = await cartStore.createCart({
  items: [
    { variantId: 'variant-id', quantity: 2 },
  ],
})

await checkoutStore.confirmCheckout({
  cartId: cart.id,
  customer: {
    fullName: 'Maria Perez',
  },
  shippingAddress: {
    address1: 'Calle 1 # 2-3',
    city: 'Bogota',
    state: 'Cundinamarca',
    zip: '110111',
    country: 'CO',
  },
})
```

### Ordenes + pagos

```js
import {
  useStorefrontOrdersStore,
  useStorefrontPaymentsStore,
} from '../stores'

const ordersStore = useStorefrontOrdersStore()
const paymentsStore = useStorefrontPaymentsStore()

await ordersStore.loadOrder(1001, {
  email: 'maria@example.com',
})

await paymentsStore.loadPaymentMethods()
await paymentsStore.submitPaymentProof('intent-id', {
  fileUrl: 'https://example.com/proof.png',
})
```

## Siguiente paso sugerido

La siguiente etapa natural es conectar estos stores a rutas/paginas reales de `frontend-drink` para catalogo, detalle, carrito, checkout y consulta de pedidos. En este cambio eso se dejo deliberadamente fuera para no convertir la app en el template funcional todavia.
