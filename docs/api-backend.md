# API Backend (NestJS)

## Resumen
Backend en NestJS con TypeORM y Postgres. Expone CRUD para productos, clientes, usuarios y pedidos. Incluye validacion con DTOs y un endpoint de salud en `/`.

## Requisitos
- Node.js 20+
- Postgres 16+ (o Docker)

## Variables de entorno
- `DB_HOST`: host de Postgres (default `localhost`)
- `DB_PORT`: puerto (default `5432`)
- `DB_USER`: usuario (default `postgres`)
- `DB_PASS`: password (default `postgres`)
- `DB_NAME`: nombre de DB (default `ecommerce`)
- `PORT`: puerto del API (default `4000`)
- `CORS_ORIGIN`: lista separada por comas de origins permitidos

## Ejecutar
```bash
cd backend
npm install
npm run start:dev
```

## Autenticacion
- `POST /auth/login`
```json
{ "email": "admin@eshop.com", "password": "admin123" }
```
Respuesta:
```json
{ "accessToken": "...", "user": { "id": 1, "email": "...", "role": "admin" } }
```
Usar `Authorization: Bearer <token>` en endpoints protegidos.

## Modulos principales
- `ProductModule`: gestion de catalogo y stock.
- `CustomerModule`: datos del comprador.
- `OrderModule`: pedidos con items y estado.
- `UserModule`: usuarios internos (admin/staff).

## Endpoints

### Salud
- `GET /` -> `{ status, service, timestamp }`

### Productos
- `GET /products?active=true|false&search=texto`
- `GET /products/:id`
- `POST /products` (protegido)
- `PATCH /products/:id` (protegido)
- `DELETE /products/:id` (protegido, marca `isActive=false`)

Payload create/update (ejemplo):
```json
{
  "name": "Taza ceramica",
  "description": "Edicion limitada",
  "price": 12.5,
  "sku": "TAZA-01",
  "imageUrl": "https://...",
  "stock": 20,
  "isActive": true
}
```

### Clientes
- `GET /customers?search=texto` (protegido)
- `GET /customers/:id` (protegido)
- `POST /customers` (protegido)
- `PATCH /customers/:id` (protegido)
- `DELETE /customers/:id` (protegido)

Payload create/update (ejemplo):
```json
{
  "firstName": "Sofia",
  "lastName": "Lopez",
  "email": "sofia@mail.com",
  "phone": "555-1000",
  "addressLine1": "Calle 123",
  "city": "CDMX",
  "state": "CDMX",
  "postalCode": "01000",
  "country": "MX"
}
```

### Pedidos
- `GET /orders?status=pending|paid|shipped|completed|canceled` (protegido)
- `GET /orders/:id` (protegido)
- `POST /orders`
- `PATCH /orders/:id` (protegido, status/pago/notas)
- `DELETE /orders/:id` (protegido, cancela y restockea)

Payload create (ejemplo):
```json
{
  "customer": {
    "firstName": "Sofia",
    "lastName": "Lopez",
    "email": "sofia@mail.com",
    "phone": "555-1000",
    "addressLine1": "Calle 123",
    "city": "CDMX",
    "state": "CDMX",
    "postalCode": "01000",
    "country": "MX"
  },
  "items": [
    { "productId": 1, "quantity": 2 },
    { "productId": 4, "quantity": 1 }
  ],
  "notes": "Entregar en recepcion"
}
```

### Usuarios
- `GET /users` (protegido)
- `GET /users/:id` (protegido)
- `POST /users` (protegido)
- `PATCH /users/:id` (protegido)
- `DELETE /users/:id` (protegido)

Payload create (ejemplo):
```json
{
  "name": "Admin",
  "email": "admin@eshop.com",
  "password": "123456",
  "role": "admin",
  "isActive": true
}
```

## Notas tecnicas
- `synchronize` esta habilitado fuera de produccion para crear tablas automaticamente.
- Las columnas `numeric` usan transformador para responder numeros en JSON.
- CORS acepta multiples origins via `CORS_ORIGIN`.

## Seed de datos
```bash
npm run seed
```
Incluye usuarios admin/staff, productos, clientes y pedidos de prueba.

## datos para ropa
cd backend
npm run seed:clothing
