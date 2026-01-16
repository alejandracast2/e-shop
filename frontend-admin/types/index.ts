export type Product = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  sku?: string | null;
  imageUrl?: string | null;
  stock: number;
  isActive: boolean;
  category?: { id: number; name: string } | null;
  variants?: ProductVariant[];
};

export type ProductVariant = {
  id: number;
  size: string;
  stock: number;
  sku?: string | null;
  color?: { id: number; name: string; hex?: string | null } | string | null;
};

export type Customer = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
};

export type OrderItem = {
  id: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product: Product;
  variant?: ProductVariant;
};

export type Order = {
  id: number;
  status: string;
  paymentStatus: string;
  subtotal: number;
  total: number;
  createdAt: string;
  customer: Customer;
  items: OrderItem[];
};
