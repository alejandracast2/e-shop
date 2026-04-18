# frontend-platform

SPA en Vue 3 + Vite para usuarios con rol `platform_admin`.

## Alcance

Esta interfaz cubre los endpoints de plataforma hoy disponibles en el backend:

- `POST /auth/login`
- `GET /platform/tenants`
- `POST /platform/tenants`
- `GET /platform/tenants/:tenantId/stores`
- `POST /platform/tenants/:tenantId/stores`
- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PATCH /users/:id`
- `DELETE /users/:id`

## Configuracion

Variable opcional:

```sh
VITE_API_URL=http://localhost:4000
```

Si no existe, el frontend apunta por defecto a `http://localhost:4000`.

## Credenciales seed

```txt
platform@eshop.com / admin123
```

## Scripts

```sh
npm install
npm run dev
npm run build
```
