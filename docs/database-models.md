# Database Models

## Multi-tenancy
- Todas las entidades operativas incluyen `tenantId` y `storeId`.
- `tenants` y `stores` definen el contexto de datos.

## Tenancy
- `tenants`: name, status, ownerUserId.
- `stores`: tenantId, name, slug, status, currency, timezone.
- `store_settings`: brandingJson, checkoutSettingsJson, paymentSettingsJson.

## IAM / Users
- `users`: email, passwordHash, isActive, lastLoginAt.
- `roles`: platform_admin, tenant_owner, store_admin, store_staff, customer.
- `user_roles`: scope por tenant/store.

## Catalogo
- `categories`: jerarquia con `parentId`, `slug`.
- `attribute_definitions`: code, type, flags (`isVariantAxis`, etc).
- `attribute_options`: values para select/multiselect.
- `product_types` + `product_type_attributes`.
- `products`: title, slug, status, categoryId, productTypeId.
- `product_variants`: sku, price, compareAtPrice.
- `product_attribute_values` (EAV) y `variant_attribute_values`.
- `files` + `product_images`.

## Inventario
- `warehouses`
- `inventory_levels`: onHand, reserved.
- `inventory_movements`
- `inventory_reservations`

## Customers
- `customers`: perfil por store.
- `customer_addresses`

## Cart y Checkout
- `carts` + `cart_items`
- `checkout_sessions`: snapshots de direcciones y totales.

## Orders
- `orders`: orderNumber, status, paymentStatus, totals.
- `order_items`: sku/title snapshot.
- `order_addresses`
- `order_status_events`

## Payments
- `payment_methods`: configJson para transferencia.
- `payment_intents`
- `payment_proofs`
