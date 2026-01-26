import 'dotenv/config';
import { AppDataSource } from './data-source';
import { Tenant } from './modules/tenancy/entities/tenant.entity';
import { Store } from './modules/tenancy/entities/store.entity';
import { Category } from './modules/catalog/entities/category.entity';
import { AttributeDefinition } from './modules/catalog/entities/attribute-definition.entity';
import { AttributeOption } from './modules/catalog/entities/attribute-option.entity';
import { ProductType } from './modules/catalog/entities/product-type.entity';
import { ProductTypeAttribute } from './modules/catalog/entities/product-type-attribute.entity';
import { Product } from './modules/catalog/entities/product.entity';
import { ProductVariant } from './modules/catalog/entities/product-variant.entity';
import { VariantAttributeValue } from './modules/catalog/entities/variant-attribute-value.entity';
import { FileEntity } from './modules/catalog/entities/file.entity';
import { ProductImage } from './modules/catalog/entities/product-image.entity';
import { Warehouse } from './modules/inventory/entities/warehouse.entity';
import { InventoryLevel } from './modules/inventory/entities/inventory-level.entity';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const skuPrefix = (value: string) =>
  slugify(value).replace(/-/g, '').slice(0, 6).toUpperCase();

const seedClothes = async () => {
  await AppDataSource.initialize();

  const tenantRepo = AppDataSource.getRepository(Tenant);
  const storeRepo = AppDataSource.getRepository(Store);
  const categoryRepo = AppDataSource.getRepository(Category);
  const attributeRepo = AppDataSource.getRepository(AttributeDefinition);
  const optionRepo = AppDataSource.getRepository(AttributeOption);
  const productTypeRepo = AppDataSource.getRepository(ProductType);
  const productTypeAttrRepo = AppDataSource.getRepository(ProductTypeAttribute);
  const productRepo = AppDataSource.getRepository(Product);
  const variantRepo = AppDataSource.getRepository(ProductVariant);
  const variantAttrRepo = AppDataSource.getRepository(VariantAttributeValue);
  const fileRepo = AppDataSource.getRepository(FileEntity);
  const productImageRepo = AppDataSource.getRepository(ProductImage);
  const warehouseRepo = AppDataSource.getRepository(Warehouse);
  const inventoryRepo = AppDataSource.getRepository(InventoryLevel);

  const defaultStoreSlug = process.env.DEFAULT_STORE_SLUG ?? 'default';

  const tenant =
    (await tenantRepo.findOne({ where: { name: 'E-Shop' } })) ??
    (await tenantRepo.save(
      tenantRepo.create({
        name: 'E-Shop',
        status: 'active',
      }),
    ));

  const store =
    (await storeRepo.findOne({ where: { slug: defaultStoreSlug } })) ??
    (await storeRepo.save(
      storeRepo.create({
        tenantId: tenant.id,
        name: 'E-Shop Store',
        slug: defaultStoreSlug,
        status: 'active',
        currency: 'USD',
        timezone: 'UTC',
      }),
    ));

  const categoryRopa =
    (await categoryRepo.findOne({
      where: { storeId: store.id, slug: 'ropa' },
    })) ??
    (await categoryRepo.save(
      categoryRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        name: 'Ropa',
        slug: 'ropa',
        position: 1,
      }),
    ));

  const colorAttr =
    (await attributeRepo.findOne({
      where: { storeId: store.id, code: 'color' },
    })) ??
    (await attributeRepo.save(
      attributeRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        code: 'color',
        name: 'Color',
        type: 'select',
        isVariantAxis: true,
        isFilterable: true,
        isRequired: true,
      }),
    ));

  const sizeAttr =
    (await attributeRepo.findOne({
      where: { storeId: store.id, code: 'size' },
    })) ??
    (await attributeRepo.save(
      attributeRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        code: 'size',
        name: 'Size',
        type: 'select',
        isVariantAxis: true,
        isFilterable: true,
        isRequired: true,
      }),
    ));

  const ensureOption = async (definitionId: string, value: string) => {
    const existing = await optionRepo.findOne({
      where: { attributeDefinitionId: definitionId, value },
    });
    if (existing) return existing;
    return optionRepo.save(
      optionRepo.create({
        attributeDefinitionId: definitionId,
        value,
      }),
    );
  };

  const colorValues = ['Black', 'White', 'Beige', 'Gray'];
  const sizeValues = ['S', 'M', 'L', 'XL'];

  const colorOptions = new Map<string, AttributeOption>();
  for (const value of colorValues) {
    colorOptions.set(value, await ensureOption(colorAttr.id, value));
  }
  const sizeOptions = new Map<string, AttributeOption>();
  for (const value of sizeValues) {
    sizeOptions.set(value, await ensureOption(sizeAttr.id, value));
  }

  const apparelType =
    (await productTypeRepo.findOne({
      where: { storeId: store.id, name: 'Apparel' },
    })) ??
    (await productTypeRepo.save(
      productTypeRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        name: 'Apparel',
      }),
    ));

  const ensureProductTypeAttr = async (
    productTypeId: string,
    attributeDefinitionId: string,
    isVariantAxis: boolean,
  ) => {
    const existing = await productTypeAttrRepo.findOne({
      where: { productTypeId, attributeDefinitionId },
    });
    if (existing) return existing;
    return productTypeAttrRepo.save(
      productTypeAttrRepo.create({
        productTypeId,
        attributeDefinitionId,
        isVariantAxis,
        isRequired: true,
      }),
    );
  };

  await ensureProductTypeAttr(apparelType.id, colorAttr.id, true);
  await ensureProductTypeAttr(apparelType.id, sizeAttr.id, true);

  const ensureProduct = async (payload: {
    title: string;
    description: string;
    imageUrl: string;
  }) => {
    const slug = slugify(payload.title);
    const existing = await productRepo.findOne({
      where: { storeId: store.id, slug },
    });
    if (existing) return existing;
    return productRepo.save(
      productRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        title: payload.title,
        slug,
        description: payload.description,
        status: 'active',
        categoryId: categoryRopa.id,
        productTypeId: apparelType.id,
      }),
    );
  };

  const ensureProductImage = async (productId: string, url: string) => {
    const existing = await productImageRepo.findOne({
      where: { productId, isCover: true },
    });
    if (existing) return existing;
    const file = await fileRepo.save(
      fileRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        provider: 'external',
        path: url,
        url,
      }),
    );
    return productImageRepo.save(
      productImageRepo.create({
        productId,
        fileId: file.id,
        sortOrder: 0,
        isCover: true,
      }),
    );
  };

  const ensureVariant = async (payload: {
    productId: string;
    sku: string;
    price: number;
  }) => {
    const existing = await variantRepo.findOne({
      where: { productId: payload.productId, sku: payload.sku },
    });
    if (existing) return existing;
    return variantRepo.save(
      variantRepo.create({
        productId: payload.productId,
        sku: payload.sku,
        price: payload.price,
        isActive: true,
      }),
    );
  };

  const ensureVariantAttr = async (
    variantId: string,
    attributeDefinitionId: string,
    valueOptionId: string,
  ) => {
    const existing = await variantAttrRepo.findOne({
      where: { variantId, attributeDefinitionId },
    });
    if (existing) return existing;
    return variantAttrRepo.save(
      variantAttrRepo.create({
        variantId,
        attributeDefinitionId,
        valueOptionId,
      }),
    );
  };

  const warehouse =
    (await warehouseRepo.findOne({
      where: { tenantId: tenant.id, storeId: store.id },
    })) ??
    (await warehouseRepo.save(
      warehouseRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        name: 'Main Warehouse',
      }),
    ));

  const ensureInventory = async (variantId: string, onHand: number) => {
    const existing = await inventoryRepo.findOne({
      where: { warehouseId: warehouse.id, variantId },
    });
    if (existing) {
      existing.onHand = onHand;
      return inventoryRepo.save(existing);
    }
    return inventoryRepo.save(
      inventoryRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        warehouseId: warehouse.id,
        variantId,
        onHand,
        reserved: 0,
      }),
    );
  };

  const stockBySize: Record<string, number> = {
    S: 10,
    M: 16,
    L: 12,
    XL: 8,
  };

  const stockFallback = 6;

  const products = [
    {
      title: 'Mesh Top',
      description: 'Top ligero con acabado translusido.',
      imageUrl:
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
      basePrice: 32,
      colors: ['Black', 'White'],
    },
    {
      title: 'Bralette Rib',
      description: 'Bralette comodo con textura rib.',
      imageUrl:
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
      basePrice: 28,
      colors: ['Black', 'Beige', 'White'],
    },
    {
      title: 'Pantalon Comfy',
      description: 'Pantalon ancho de caida suave.',
      imageUrl:
        'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
      basePrice: 46,
      colors: ['Gray', 'Beige'],
    },
    {
      title: 'Camisa Oversize',
      description: 'Camisa oversize de algodon premium.',
      imageUrl:
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
      basePrice: 54,
      colors: ['White', 'Black'],
    },
  ];

  for (const productSeed of products) {
    const product = await ensureProduct(productSeed);
    await ensureProductImage(product.id, productSeed.imageUrl);

    for (const color of productSeed.colors) {
      const colorOption = colorOptions.get(color);
      if (!colorOption) continue;
      for (const size of sizeValues) {
        const sizeOption = sizeOptions.get(size);
        if (!sizeOption) continue;
        const sku = `${skuPrefix(productSeed.title)}-${color.slice(0, 3).toUpperCase()}-${size}`;
        const variant = await ensureVariant({
          productId: product.id,
          sku,
          price: productSeed.basePrice,
        });
        await ensureVariantAttr(variant.id, colorAttr.id, colorOption.id);
        await ensureVariantAttr(variant.id, sizeAttr.id, sizeOption.id);
        await ensureInventory(variant.id, stockBySize[size] ?? stockFallback);
      }
    }
  }

  await AppDataSource.destroy();
  // eslint-disable-next-line no-console
  console.log('Seed clothes completed');
};

seedClothes().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Seed clothes failed', error);
  process.exit(1);
});
