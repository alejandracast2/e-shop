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

