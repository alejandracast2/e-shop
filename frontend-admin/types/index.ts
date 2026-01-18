export type ProductImage = {
  id: string;
  file?: { url?: string | null } | null;
};

export type ProductVariant = {
  id: string;
  sku?: string | null;
  price: number;
  availableStock?: number;
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  status: string;
  variants?: ProductVariant[];
  images?: ProductImage[];
};

export type Customer = {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
};

export type OrderItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  skuSnapshot?: string | null;
  titleSnapshot: string;
};

export type Order = {
  id: string;
  orderNumber: number;
  status: string;
  paymentStatus: string;
  subtotalAmount: number;
  totalAmount: number;
  createdAt: string;
  customer?: Customer | null;
  items?: OrderItem[];
};
