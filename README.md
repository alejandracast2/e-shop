# E-Shop Project

## Arquitectura y Tecnologías

### Backend (NestJS + MongoDB)
- **Estructura modular**: cada dominio se organiza como módulo con controladores, servicios, DTOs, entidades y pruebas.
- **Conexión a MongoDB**: `@nestjs/mongoose` para esquemas y modelos; configuración central en `DatabaseModule`.
- **Autenticación y autorización**: JWT con `@nestjs/passport` y `passport-jwt`; guards para roles.
- **Validación y serialización**: `class-validator` y `class-transformer` habilitados globalmente.
- **Documentación**: OpenAPI/Swagger generado con `@nestjs/swagger`.
- **Testing**: Jest para unitarias y e2e con `supertest`.
- **Logs y seguridad**: `nestjs-pino` o `winston` para logging; `helmet` y rate limiting.

### Frontend (Vue/Nuxt)
- **Framework**: Nuxt 3 para SSR/SSG.
- **Gestión de estado**: Pinia con stores modulares (auth, carrito, catálogo, pedidos).
- **Ruteo y middlewares**: rutas basadas en archivos (`pages/`) con middlewares para proteger vistas.
- **Componentes UI**: librería (Element Plus o Tailwind) + componentes propios.
- **Comunicación con API**: composables para llamadas; manejo de token.
- **Testing**: Vitest/Jest para unitarias; Playwright/Cypress para e2e.
- **Optimización**: lazy loading, imágenes optimizadas, PWA opcional.

## API Endpoints

### 1. Catálogo

#### 1.1 Listar productos
- **GET** `/api/products`
- **Query params**: `category`, `search`, `page`, `limit`
- **Response**
```json
[
  {
    "id": "64a1f2",
    "name": "Zapatos Running",
    "description": "Zapatillas ligeras para correr.",
    "price": 59.99,
    "images": ["https://cdn/img1.jpg", "https://cdn/img2.jpg"],
    "stock": 32,
    "category": "calzado"
  }
]
```

#### 1.2 Obtener producto
- **GET** `/api/products/:id`
- **Response**
```json
{
  "id": "64a1f2",
  "name": "Zapatos Running",
  "description": "Zapatillas ligeras para correr.",
  "price": 59.99,
  "images": ["https://cdn/img1.jpg", "https://cdn/img2.jpg"],
  "stock": 32,
  "category": "calzado"
}
```

#### 1.3 Crear producto (admin)
- **POST** `/api/products`
- **Request**
```json
{
  "name": "Zapatos Running",
  "description": "Zapatillas ligeras para correr.",
  "price": 59.99,
  "images": ["https://cdn/img1.jpg"],
  "stock": 32,
  "category": "calzado"
}
```
- **Response**
```json
{
  "id": "64a1f2",
  "name": "Zapatos Running",
  "description": "Zapatillas ligeras para correr.",
  "price": 59.99,
  "images": ["https://cdn/img1.jpg"],
  "stock": 32,
  "category": "calzado"
}
```

#### 1.4 Actualizar producto (admin)
- **PUT/PATCH** `/api/products/:id`
- **Request**
```json
{
  "price": 49.99,
  "stock": 40
}
```
- **Response**
```json
{
  "id": "64a1f2",
  "name": "Zapatos Running",
  "description": "Zapatillas ligeras para correr.",
  "price": 49.99,
  "images": ["https://cdn/img1.jpg"],
  "stock": 40,
  "category": "calzado"
}
```

#### 1.5 Eliminar producto (admin)
- **DELETE** `/api/products/:id`
- **Response**
```json
{ "message": "Product deleted" }
```

### 2. Carrito

#### 2.1 Ver carrito del usuario
- **GET** `/api/cart`
- **Response**
```json
{
  "items": [
    {
      "productId": "64a1f2",
      "name": "Zapatos Running",
      "quantity": 2,
      "price": 59.99
    }
  ],
  "total": 119.98
}
```

#### 2.2 Agregar artículo
- **POST** `/api/cart/items`
- **Request**
```json
{
  "productId": "64a1f2",
  "quantity": 1
}
```
- **Response**
```json
{
  "items": [
    {
      "productId": "64a1f2",
      "name": "Zapatos Running",
      "quantity": 1,
      "price": 59.99
    }
  ],
  "total": 59.99
}
```

#### 2.3 Modificar cantidad
- **PUT** `/api/cart/items/:productId`
- **Request**
```json
{ "quantity": 3 }
```
- **Response**
```json
{
  "items": [
    {
      "productId": "64a1f2",
      "name": "Zapatos Running",
      "quantity": 3,
      "price": 59.99
    }
  ],
  "total": 179.97
}
```

#### 2.4 Vaciar carrito
- **DELETE** `/api/cart`
- **Response**
```json
{ "message": "Cart emptied" }
```

### 3. Checkout / Pedidos

#### 3.1 Crear pedido
- **POST** `/api/orders`
- **Request**
```json
{
  "address": {
    "street": "Calle 123",
    "city": "Ciudad",
    "zip": "12345",
    "country": "MX"
  },
  "paymentMethod": "credit_card",
  "items": [
    { "productId": "64a1f2", "quantity": 2 }
  ]
}
```
- **Response**
```json
{
  "orderId": "ord-001",
  "status": "pending",
  "total": 119.98,
  "createdAt": "2023-07-01T12:00:00Z"
}
```

#### 3.2 Listar pedidos del usuario
- **GET** `/api/orders`
- **Response**
```json
[
  {
    "orderId": "ord-001",
    "status": "pending",
    "total": 119.98,
    "createdAt": "2023-07-01T12:00:00Z"
  }
]
```

#### 3.3 Obtener pedido
- **GET** `/api/orders/:id`
- **Response**
```json
{
  "orderId": "ord-001",
  "status": "pending",
  "items": [
    {
      "productId": "64a1f2",
      "name": "Zapatos Running",
      "quantity": 2,
      "price": 59.99
    }
  ],
  "total": 119.98,
  "shippingInfo": {
    "address": {
      "street": "Calle 123",
      "city": "Ciudad",
      "zip": "12345",
      "country": "MX"
    },
    "trackingNumber": null
  }
}
```

#### 3.4 Actualizar estado (admin)
- **PATCH** `/api/orders/:id/status`
- **Request**
```json
{ "status": "shipped" }
```
- **Response**
```json
{
  "orderId": "ord-001",
  "status": "shipped"
}
```

### 4. Usuarios / Autenticación

#### 4.1 Registro
- **POST** `/api/auth/register`
- **Request**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "Secreto123"
}
```
- **Response**
```json
{
  "token": "jwt.token.here",
  "user": {
    "id": "u123",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "user"
  }
}
```

#### 4.2 Login
- **POST** `/api/auth/login`
- **Request**
```json
{
  "email": "juan@example.com",
  "password": "Secreto123"
}
```
- **Response**
```json
{
  "token": "jwt.token.here",
  "user": {
    "id": "u123",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "user"
  }
}
```

#### 4.3 Perfil
- **GET** `/api/users/me`
- **Response**
```json
{
  "id": "u123",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "role": "user"
}
```

#### 4.4 Actualizar perfil
- **PATCH** `/api/users/me`
- **Request**
```json
{ "name": "Juan P." }
```
- **Response**
```json
{
  "id": "u123",
  "name": "Juan P.",
  "email": "juan@example.com",
  "role": "user"
}
```

#### 4.5 Listar usuarios (admin)
- **GET** `/api/users`
- **Response**
```json
[
  {
    "id": "u123",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "user"
  },
  {
    "id": "u124",
    "name": "Admin",
    "email": "admin@example.com",
    "role": "admin"
  }
]
```

### 5. Panel Administrativo

#### 5.1 Dashboard (stats)
- **GET** `/api/admin/dashboard`
- **Response**
```json
{
  "salesToday": 250.5,
  "ordersPending": 3,
  "usersCount": 120,
  "topProducts": [
    { "productId": "64a1f2", "name": "Zapatos Running", "sold": 10 }
  ]
}
```

#### 5.2 Gestión de categorías (CRUD)
Ejemplo de creación:
- **POST** `/api/categories`
- **Request**
```json
{
  "name": "Calzado",
  "parentId": null
}
```
- **Response**
```json
{
  "id": "cat001",
  "name": "Calzado",
  "parentId": null
}
```

## Plan de Trabajo

### Fase 1 – Preparación
1. Definir requisitos funcionales.
2. Configurar repositorios y entorno (`.env`, Docker Compose).
3. Pipeline base de CI con lint, tests y build.

### Fase 2 – Backend mínimo
1. Conectar a MongoDB y crear modelos iniciales.
2. Implementar autenticación (registro/login JWT).
3. CRUD de productos y usuarios.
4. Documentar con Swagger y cubrir pruebas unitarias.

### Fase 3 – Frontend mínimo
1. Estructurar proyecto Nuxt e instalar librería UI y Pinia.
2. Páginas de registro/login y listado de productos.
3. Integrar autenticación y proteger rutas.

### Fase 4 – Funcionalidades principales
1. **Carrito y pedidos**: módulos `Cart` y `Order`; componentes de carrito y checkout.
2. **Panel admin**: roles y endpoints de gestión; vistas de administración.

### Fase 5 – Calidad y optimización
1. Cobertura de pruebas (unitarias y e2e).
2. Logging, manejo de errores y monitorización.
3. Optimización de rendimiento y seguridad.

### Fase 6 – Despliegue
1. Contenerización con Docker.
2. Orquestación y despliegue (Compose/Kubernetes).
3. Configuración de dominios, SSL y CD.

