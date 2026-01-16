export type Product = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  sku?: string | null;
  imageUrl?: string | null;
  stock: number;
  isActive: boolean;
};

export type OrderItemInput = {
  productId: number;
  quantity: number;
};

export type CustomerInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export type OrderResponse = {
  id: number;
  status: string;
  total: number;
};
