# Database Models

## Relaciones principales
- `Customer 1:N Order`
- `Order 1:N OrderItem`
- `OrderItem N:1 Product`
- `User` es independiente para administracion

## Product
- `id` (PK)
- `name`, `description`
- `price` (numeric)
- `sku`, `imageUrl`
- `stock`, `isActive`
- `createdAt`, `updatedAt`

## Customer
- `id` (PK)
- `firstName`, `lastName`, `email` (unique)
- `phone`
- `addressLine1`, `addressLine2`, `city`, `state`, `postalCode`, `country`
- `createdAt`, `updatedAt`

## Order
- `id` (PK)
- `customerId` (FK)
- `status`: pending | paid | shipped | completed | canceled
- `paymentStatus`: unpaid | paid | refunded
- `currency`, `subtotal`, `total`
- `shippingName`, `shippingEmail`, `shippingPhone`
- `shippingAddressLine1`, `shippingAddressLine2`, `shippingCity`, `shippingState`, `shippingPostalCode`, `shippingCountry`
- `notes`
- `createdAt`, `updatedAt`

## OrderItem
- `id` (PK)
- `orderId` (FK)
- `productId` (FK)
- `quantity`
- `unitPrice`
- `lineTotal`

## User
- `id` (PK)
- `name`, `email` (unique)
- `passwordHash`
- `role`: admin | staff
- `isActive`
- `createdAt`, `updatedAt`
