export type ProductImage = {
  id: string;
  file?: { url?: string | null } | null;
};

export type ProductVariant = {
  id: string;
  sku?: string | null;
  price: number;
  compareAtPrice?: number | null;
  availableStock?: number;
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  variants?: ProductVariant[];
  images?: ProductImage[];
};

export type CartItem = {
  variantId: string;
  title: string;
  price: number;
  imageUrl?: string;
  quantity: number;
};

export type CheckoutCustomerInput = {
  fullName: string;
  email?: string;
  phone?: string;
};

export type CheckoutAddressInput = {
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export type CheckoutResponse = {
  order: {
    id: string;
    orderNumber: number;
    status: string;
    totalAmount: number;
  };
  paymentIntent: {
    id: string;
    status: string;
    referenceCode?: string | null;
  };
  paymentMethod: {
    type: string;
    configJson?: Record<string, unknown> | null;
  };
};
