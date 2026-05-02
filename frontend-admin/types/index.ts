export type ProductImage = {
  id: string;
  sortOrder?: number;
  isCover?: boolean;
  file?: { id?: string; url?: string | null } | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  imageUrl?: string | null;
  position?: number;
  isActive?: boolean;
  children?: Category[];
};

export type StoreSummary = {
  id: string;
  name: string;
  slug: string;
  tenantId: string;
  status?: string;
};

export type AttributeOption = {
  id: string;
  value: string;
  sortOrder?: number;
};

export type AttributeDefinition = {
  id: string;
  code: string;
  name: string;
  type: string;
  unit?: string | null;
  isVariantAxis: boolean;
  isFilterable: boolean;
  isRequired: boolean;
  options?: AttributeOption[];
};

export type ProductTypeAttribute = {
  id: string;
  isRequired: boolean;
  isVariantAxis: boolean;
  attributeDefinition?: AttributeDefinition;
};

export type ProductType = {
  id: string;
  name: string;
  attributes?: ProductTypeAttribute[];
};

export type ProductVariant = {
  id: string;
  sku?: string | null;
  barcode?: string | null;
  price: number;
  availableStock?: number;
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  brand?: string | null;
  status: string;
  productTypeId?: string | null;
  category?: Category | null;
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
  fulfillmentStatus?: string;
  subtotalAmount: number;
  totalAmount: number;
  createdAt: string;
  customer?: Customer | null;
  items?: OrderItem[];
};

export type PaymentIntent = {
  id: string;
  orderId: string;
  status: string;
  amount: number;
  currency: string;
  referenceCode?: string | null;
  createdAt: string;
};
