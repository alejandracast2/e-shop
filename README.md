# E-Shop

Plataforma de comercio electrónico multi-tenant. El repositorio incluye una API en NestJS, PostgreSQL y varias interfaces para clientes, administradores y operadores de plataforma.

## Estado actual

- Catálogo con categorías, atributos, tipos de producto, variantes, imágenes e inventario.
- Storefront público con banners, carrito, checkout, consulta de pedidos y pagos offline.
- Registro e inicio de sesión de clientes mediante contraseña, código por correo o Google.
- Sesión customer mediante cookie `HttpOnly`; el token y los datos sensibles no se guardan en `localStorage`.
- Panel administrativo para productos, categorías, atributos, pedidos, pagos, clientes y banners.
- Panel de plataforma para administrar tenants, stores y usuarios.
- Aislamiento por tenant y store en una única base PostgreSQL.

## Aplicaciones

| Directorio | Tecnología | Propósito | Puerto habitual |
| --- | --- | --- | --- |
| `backend` | NestJS 11 + TypeORM | API y lógica de negocio | `4000` |
| `frontend-drink` | Vue 3 + Vite + Pinia | Storefront principal de la vertical de bebidas | `5173` |
| `frontend-admin2` | Vue 3 + Vite + Pinia | Panel administrativo actual | `5173` |
| `frontend-platform` | Vue 3 + Vite + Pinia | Administración global de tenants y usuarios | `5173` |
| `frontend-customer` | Nuxt 4 | Storefront de referencia | `3000` |
| `frontend-admin` | Nuxt 4 | Panel administrativo de referencia | `3000` |
| `frontend-vue` | Vue 3 + Vite | Storefront básico/legado | `5173` |

`frontend-admin2` reemplaza funcionalmente al panel Nuxt `frontend-admin`. Los servicios incluidos en `docker-compose.yml` levantan `backend`, `frontend-customer`, `frontend-admin` y `frontend-vue`; las aplicaciones Vite restantes se ejecutan de forma independiente.

## Requisitos

- Node.js `20.19+` o `22.12+` (requerido por los frontends Vite más recientes).
- npm.
- PostgreSQL 16, o Docker con Docker Compose.

## Inicio rápido con Docker

1. Copia `.env.example` como `.env` y cambia, como mínimo, `DB_PASS` y `JWT_SECRET`.
2. Levanta los servicios:

```bash
docker compose up --build
```

Servicios publicados:

- API: `http://localhost:4000`
- Storefront Nuxt: `http://localhost:3000`
- Admin Nuxt: `http://localhost:3001`
- Storefront Vue básico: `http://localhost:3002`
- PostgreSQL: `localhost:5432`

## Desarrollo local

Instala y ejecuta cada aplicación en una terminal diferente:

```bash
cd backend
npm install
npm run start:dev
```

```bash
cd frontend-drink
npm install
npm run dev
```

Para usar otro frontend, sustituye `frontend-drink` por su directorio. Consulta su README para conocer sus variables y cobertura funcional.

### Base de datos

El backend usa `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS` y `DB_NAME`. En desarrollo, TypeORM sincroniza las entidades automáticamente. En producción, la sincronización está desactivada y deben ejecutarse las migraciones:

```bash
cd backend
npm run migration:run
```

Las migraciones actuales agregan la autenticación de clientes y el sistema de banners.

### Datos de demostración

```bash
cd backend
npm run seed
```

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Platform admin | `platform@eshop.com` | `admin123` |
| Tenant owner | `owner@cafedeorigen.com` | `admin123` |
| Store admin | `admin@cafedeorigen.com` | `admin123` |
| Store staff | `staff@cafedeorigen.com` | `admin123` |

Estas credenciales son únicamente para desarrollo.

## Configuración

La plantilla raíz [.env.example](.env.example) contiene la configuración compartida. El backend añade opciones para Google y SMTP en [backend/.env.example](backend/.env.example). Los frontends Vite usan sus propias variables `VITE_*`; por ejemplo, [frontend-drink/.env.example](frontend-drink/.env.example).

Variables importantes:

- `CORS_ORIGIN`: lista de orígenes permitidos, separada por comas.
- `DEFAULT_STORE_SLUG`: store usado como fallback para tráfico público general.
- `GOOGLE_CLIENT_ID`: habilita Google Sign-In en el backend.
- `SMTP_*`: permite enviar códigos de acceso y recuperación. Sin SMTP, en desarrollo el código se muestra en la consola del backend.

Los flujos de autenticación customer requieren un contexto explícito mediante `x-store-slug` o `x-store-id`; no usan el store fallback.

## Autenticación

Hay dos mecanismos:

- Administración y plataforma: `POST /auth/login` devuelve un JWT, enviado como `Authorization: Bearer <token>`.
- Clientes: los endpoints `/auth/customer/*` crean una cookie de sesión `HttpOnly`, `SameSite=Lax` y `Secure` en producción. El frontend debe usar `credentials: 'include'`.

## Scripts útiles del backend

```bash
npm run build
npm run test
npm run test:e2e
npm run lint
npm run migration:run
npm run seed
npm run seed:clothes
npm run db:backup
```

## Documentación

- [Índice de documentación](docs/README.md)
- [API backend](docs/api-backend.md)
- [Modelo de datos](docs/database-models.md)
- [Storefront Nuxt](docs/frontend-customer.md)
- [Panel admin Nuxt](docs/frontend-admin.md)
- [Storefront principal de bebidas](frontend-drink/README.md)
- [Panel admin actual](frontend-admin2/README.md)
- [Panel de plataforma](frontend-platform/README.md)

La lista de endpoints de [docs/api-backend.md](docs/api-backend.md) se deriva de los controladores actuales. Para detalles de payloads y validaciones, consulta los DTOs de `backend/src`.
