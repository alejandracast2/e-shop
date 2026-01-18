import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from './data-source';
import { IsNull } from 'typeorm';
import { Tenant } from './modules/tenancy/entities/tenant.entity';
import { Store } from './modules/tenancy/entities/store.entity';
import { StoreSettings } from './modules/tenancy/entities/store-settings.entity';
import { User } from './modules/user/entities/user.entity';
import { Role } from './modules/iam/entities/role.entity';
import { UserRole } from './modules/iam/entities/user-role.entity';
import { Category } from './modules/catalog/entities/category.entity';
import { AttributeDefinition } from './modules/catalog/entities/attribute-definition.entity';
import { AttributeOption } from './modules/catalog/entities/attribute-option.entity';
import { ProductType } from './modules/catalog/entities/product-type.entity';
import { ProductTypeAttribute } from './modules/catalog/entities/product-type-attribute.entity';
import { Product } from './modules/catalog/entities/product.entity';
import { ProductVariant } from './modules/catalog/entities/product-variant.entity';
import { ProductAttributeValue } from './modules/catalog/entities/product-attribute-value.entity';
import { VariantAttributeValue } from './modules/catalog/entities/variant-attribute-value.entity';
import { FileEntity } from './modules/catalog/entities/file.entity';
import { ProductImage } from './modules/catalog/entities/product-image.entity';
import { Warehouse } from './modules/inventory/entities/warehouse.entity';
import { InventoryLevel } from './modules/inventory/entities/inventory-level.entity';
import { InventoryReservation } from './modules/inventory/entities/inventory-reservation.entity';
import { Customer } from './modules/customers/entities/customer.entity';
import { CustomerAddress } from './modules/customers/entities/customer-address.entity';
import { Order } from './modules/orders/entities/order.entity';
import { OrderItem } from './modules/orders/entities/order-item.entity';
import { OrderAddress } from './modules/orders/entities/order-address.entity';
import { PaymentMethod } from './modules/payments/entities/payment-method.entity';
import { PaymentIntent } from './modules/payments/entities/payment-intent.entity';

const seed = async () => {
  await AppDataSource.initialize();

  const tenantRepo = AppDataSource.getRepository(Tenant);
  const storeRepo = AppDataSource.getRepository(Store);
  const storeSettingsRepo = AppDataSource.getRepository(StoreSettings);
  const userRepo = AppDataSource.getRepository(User);
  const roleRepo = AppDataSource.getRepository(Role);
  const userRoleRepo = AppDataSource.getRepository(UserRole);
  const categoryRepo = AppDataSource.getRepository(Category);
  const attributeRepo = AppDataSource.getRepository(AttributeDefinition);
  const optionRepo = AppDataSource.getRepository(AttributeOption);
  const productTypeRepo = AppDataSource.getRepository(ProductType);
  const productTypeAttrRepo = AppDataSource.getRepository(ProductTypeAttribute);
  const productRepo = AppDataSource.getRepository(Product);
  const variantRepo = AppDataSource.getRepository(ProductVariant);
  const productAttrRepo = AppDataSource.getRepository(ProductAttributeValue);
  const variantAttrRepo = AppDataSource.getRepository(VariantAttributeValue);
  const fileRepo = AppDataSource.getRepository(FileEntity);
  const productImageRepo = AppDataSource.getRepository(ProductImage);
  const warehouseRepo = AppDataSource.getRepository(Warehouse);
  const inventoryRepo = AppDataSource.getRepository(InventoryLevel);
  const reservationRepo = AppDataSource.getRepository(InventoryReservation);
  const customerRepo = AppDataSource.getRepository(Customer);
  const customerAddressRepo = AppDataSource.getRepository(CustomerAddress);
  const orderRepo = AppDataSource.getRepository(Order);
  const orderItemRepo = AppDataSource.getRepository(OrderItem);
  const orderAddressRepo = AppDataSource.getRepository(OrderAddress);
  const paymentMethodRepo = AppDataSource.getRepository(PaymentMethod);
  const paymentIntentRepo = AppDataSource.getRepository(PaymentIntent);

  const defaultStoreSlug = process.env.DEFAULT_STORE_SLUG ?? 'default';

  const tenant =
    (await tenantRepo.findOne({ where: { name: 'Cafe de Origen' } })) ??
    (await tenantRepo.save(
      tenantRepo.create({
        name: 'Cafe de Origen',
        status: 'active',
      }),
    ));

  const store =
    (await storeRepo.findOne({
      where: { tenantId: tenant.id, slug: defaultStoreSlug },
    })) ??
    (await storeRepo.save(
      storeRepo.create({
        tenantId: tenant.id,
        name: 'Cafe de Origen Centro',
        slug: defaultStoreSlug,
        status: 'active',
        email: 'ventas@cafedeorigen.com',
        phone: '+54 11 5555-5555',
        addressJson: { city: 'Buenos Aires', country: 'AR' },
        currency: 'USD',
        timezone: 'America/Argentina/Buenos_Aires',
      }),
    ));

  const existingSettings = await storeSettingsRepo.findOne({
    where: { storeId: store.id },
  });
  if (!existingSettings) {
    await storeSettingsRepo.save(
      storeSettingsRepo.create({
        storeId: store.id,
        brandingJson: { logoUrl: null, primaryColor: '#B74E2F' },
        checkoutSettingsJson: { allowGuestCheckout: true },
        paymentSettingsJson: { note: 'Transfer and upload proof' },
      }),
    );
  }

  const passwordHash = await bcrypt.hash('admin123', 10);

  const ensureRole = async (name: string) => {
    const existing = await roleRepo.findOne({ where: { name } });
    if (existing) return existing;
    return roleRepo.save(roleRepo.create({ name }));
  };

  const ensureUser = async (email: string, name: string) => {
    const existing = await userRepo.findOne({ where: { email } });
    if (existing) return existing;
    return userRepo.save(
      userRepo.create({
        name,
        email,
        passwordHash,
        isActive: true,
      }),
    );
  };

  const ensureUserRole = async (
    userId: string,
    roleId: string,
    tenantId?: string | null,
    storeId?: string | null,
  ) => {
    const existing = await userRoleRepo.findOne({
      where: {
        userId,
        roleId,
        tenantId: tenantId ?? IsNull(),
        storeId: storeId ?? IsNull(),
      },
    });
    if (existing) return existing;
    return userRoleRepo.save(
      userRoleRepo.create({
        userId,
        roleId,
        tenantId: tenantId ?? null,
        storeId: storeId ?? null,
      }),
    );
  };

  const rolePlatform = await ensureRole('platform_admin');
  const roleTenantOwner = await ensureRole('tenant_owner');
  const roleStoreAdmin = await ensureRole('store_admin');
  const roleStoreStaff = await ensureRole('store_staff');
  await ensureRole('customer');

  const platformUser = await ensureUser('platform@eshop.com', 'Platform Admin');
  const ownerUser = await ensureUser('owner@cafedeorigen.com', 'Tenant Owner');
  const adminUser = await ensureUser('admin@cafedeorigen.com', 'Store Admin');
  const staffUser = await ensureUser('staff@cafedeorigen.com', 'Store Staff');

  await ensureUserRole(platformUser.id, rolePlatform.id);
  await ensureUserRole(ownerUser.id, roleTenantOwner.id, tenant.id);
  await ensureUserRole(adminUser.id, roleStoreAdmin.id, tenant.id, store.id);
  await ensureUserRole(staffUser.id, roleStoreStaff.id, tenant.id, store.id);

  if (!tenant.ownerUserId) {
    tenant.ownerUserId = ownerUser.id;
    await tenantRepo.save(tenant);
  }

  const categoryRopa =
    (await categoryRepo.findOne({ where: { storeId: store.id, slug: 'ropa' } })) ??
    (await categoryRepo.save(
      categoryRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        name: 'Ropa',
        slug: 'ropa',
        position: 1,
      }),
    ));

  const categoryAccesorios =
    (await categoryRepo.findOne({
      where: { storeId: store.id, slug: 'accesorios' },
    })) ??
    (await categoryRepo.save(
      categoryRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        name: 'Accesorios',
        slug: 'accesorios',
        position: 2,
      }),
    ));

  const colorAttr =
    (await attributeRepo.findOne({ where: { storeId: store.id, code: 'color' } })) ??
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
    (await attributeRepo.findOne({ where: { storeId: store.id, code: 'size' } })) ??
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

  const materialAttr =
    (await attributeRepo.findOne({
      where: { storeId: store.id, code: 'material' },
    })) ??
    (await attributeRepo.save(
      attributeRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        code: 'material',
        name: 'Material',
        type: 'text',
        isVariantAxis: false,
        isFilterable: true,
        isRequired: false,
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

  const colorRed = await ensureOption(colorAttr.id, 'Red');
  const colorBlack = await ensureOption(colorAttr.id, 'Black');
  const colorBlue = await ensureOption(colorAttr.id, 'Blue');
  const sizeS = await ensureOption(sizeAttr.id, 'S');
  const sizeM = await ensureOption(sizeAttr.id, 'M');
  const sizeL = await ensureOption(sizeAttr.id, 'L');

  const tshirtType =
    (await productTypeRepo.findOne({
      where: { storeId: store.id, name: 'Tshirt' },
    })) ??
    (await productTypeRepo.save(
      productTypeRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        name: 'Tshirt',
      }),
    ));

  const ensureProductTypeAttr = async (
    productTypeId: string,
    attributeDefinitionId: string,
    isVariantAxis: boolean,
    isRequired: boolean,
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
        isRequired,
      }),
    );
  };

  await ensureProductTypeAttr(tshirtType.id, colorAttr.id, true, true);
  await ensureProductTypeAttr(tshirtType.id, sizeAttr.id, true, true);
  await ensureProductTypeAttr(tshirtType.id, materialAttr.id, false, false);

  const ensureProduct = async (payload: {
    title: string;
    slug: string;
    description: string;
    categoryId?: string | null;
    productTypeId?: string | null;
    brand?: string | null;
  }) => {
    const existing = await productRepo.findOne({
      where: { storeId: store.id, slug: payload.slug },
    });
    if (existing) return existing;
    return productRepo.save(
      productRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        title: payload.title,
        slug: payload.slug,
        description: payload.description,
        brand: payload.brand ?? null,
        status: 'active',
        categoryId: payload.categoryId ?? null,
        productTypeId: payload.productTypeId ?? null,
      }),
    );
  };

  const tshirt = await ensureProduct({
    title: 'Basic Tshirt',
    slug: 'basic-tshirt',
    description: 'Soft cotton tshirt for daily use.',
    categoryId: categoryRopa.id,
    productTypeId: tshirtType.id,
    brand: 'Cafe Lab',
  });

  const hoodie = await ensureProduct({
    title: 'Urban Hoodie',
    slug: 'urban-hoodie',
    description: 'Warm hoodie for cool nights.',
    categoryId: categoryRopa.id,
    productTypeId: tshirtType.id,
    brand: 'Cafe Lab',
  });

  const mug = await ensureProduct({
    title: 'Origen Mug',
    slug: 'origen-mug',
    description: 'Ceramic mug with matte finish.',
    categoryId: categoryAccesorios.id,
    productTypeId: null,
    brand: 'Cafe de Origen',
  });

  const ensureProductAttr = async (
    productId: string,
    attributeDefinitionId: string,
    valueText: string,
  ) => {
    const existing = await productAttrRepo.findOne({
      where: { productId, attributeDefinitionId },
    });
    if (existing) return existing;
    return productAttrRepo.save(
      productAttrRepo.create({
        productId,
        attributeDefinitionId,
        valueText,
      }),
    );
  };

  await ensureProductAttr(tshirt.id, materialAttr.id, 'Cotton 95%');
  await ensureProductAttr(hoodie.id, materialAttr.id, 'Cotton blend');

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

  const tshirtRedS = await ensureVariant({
    productId: tshirt.id,
    sku: 'TSH-RED-S',
    price: 24.5,
  });
  const tshirtRedM = await ensureVariant({
    productId: tshirt.id,
    sku: 'TSH-RED-M',
    price: 24.5,
  });
  const tshirtBlackM = await ensureVariant({
    productId: tshirt.id,
    sku: 'TSH-BLK-M',
    price: 26,
  });

  await ensureVariantAttr(tshirtRedS.id, colorAttr.id, colorRed.id);
  await ensureVariantAttr(tshirtRedS.id, sizeAttr.id, sizeS.id);
  await ensureVariantAttr(tshirtRedM.id, colorAttr.id, colorRed.id);
  await ensureVariantAttr(tshirtRedM.id, sizeAttr.id, sizeM.id);
  await ensureVariantAttr(tshirtBlackM.id, colorAttr.id, colorBlack.id);
  await ensureVariantAttr(tshirtBlackM.id, sizeAttr.id, sizeM.id);

  const hoodieBlueL = await ensureVariant({
    productId: hoodie.id,
    sku: 'HOD-BLU-L',
    price: 48,
  });
  await ensureVariantAttr(hoodieBlueL.id, colorAttr.id, colorBlue.id);
  await ensureVariantAttr(hoodieBlueL.id, sizeAttr.id, sizeL.id);

  const mugVariant = await ensureVariant({
    productId: mug.id,
    sku: 'MUG-ORI-STD',
    price: 18,
  });

  const ensureProductImage = async (productId: string, url: string) => {
    const existing = await productImageRepo.findOne({
      where: { productId },
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

  await ensureProductImage(
    tshirt.id,
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
  );
  await ensureProductImage(
    hoodie.id,
    'https://images.unsplash.com/photo-1509942774463-acf339cf87d9?auto=format&fit=crop&w=900&q=80',
  );
  await ensureProductImage(
    mug.id,
    'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=900&q=80',
  );

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

  await ensureInventory(tshirtRedS.id, 12);
  await ensureInventory(tshirtRedM.id, 18);
  await ensureInventory(tshirtBlackM.id, 14);
  await ensureInventory(hoodieBlueL.id, 9);
  await ensureInventory(mugVariant.id, 20);

  const paymentMethod =
    (await paymentMethodRepo.findOne({
      where: { storeId: store.id, type: 'bank_transfer' },
    })) ??
    (await paymentMethodRepo.save(
      paymentMethodRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        type: 'bank_transfer',
        configJson: {
          bank: 'Banco Demo',
          accountName: 'Cafe de Origen',
          accountNumber: '1234567890',
          instructions: 'Send proof with the reference code.',
        },
        isActive: true,
      }),
    ));

  const customer =
    (await customerRepo.findOne({
      where: { storeId: store.id, email: 'sofia@mail.com' },
    })) ??
    (await customerRepo.save(
      customerRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        fullName: 'Sofia Lopez',
        email: 'sofia@mail.com',
        phone: '+54 11 4000-0000',
      }),
    ));

  const existingAddress = await customerAddressRepo.findOne({
    where: { customerId: customer.id },
  });
  if (!existingAddress) {
    await customerAddressRepo.save(
      customerAddressRepo.create({
        customerId: customer.id,
        label: 'Home',
        address1: 'Av. Siempre Viva 123',
        city: 'Buenos Aires',
        state: 'BA',
        zip: '1000',
        country: 'AR',
        isDefault: true,
      }),
    );
  }

  const existingOrder = await orderRepo.findOne({
    where: { storeId: store.id, orderNumber: 1001 },
  });
  if (!existingOrder) {
    const itemsForOrder = [
      { variant: tshirtRedM, quantity: 2 },
      { variant: mugVariant, quantity: 1 },
    ];
    const subtotal = itemsForOrder.reduce(
      (sum, item) => sum + item.variant.price * item.quantity,
      0,
    );
    const order = await orderRepo.save(
      orderRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        orderNumber: 1001,
        customerId: customer.id,
        status: 'pending_payment',
        paymentStatus: 'pending',
        fulfillmentStatus: 'unfulfilled',
        currency: store.currency,
        subtotalAmount: subtotal,
        discountAmount: 0,
        shippingAmount: 0,
        taxAmount: 0,
        totalAmount: subtotal,
        customerNote: 'Leave at reception',
      }),
    );

    const orderItems = itemsForOrder.map((item) =>
      orderItemRepo.create({
        orderId: order.id,
        variantId: item.variant.id,
        skuSnapshot: item.variant.sku ?? null,
        titleSnapshot: item.variant.sku ?? 'Item',
        quantity: item.quantity,
        unitPrice: item.variant.price,
        totalPrice: item.variant.price * item.quantity,
      }),
    );
    await orderItemRepo.save(orderItems);

    await orderAddressRepo.save(
      orderAddressRepo.create({
        orderId: order.id,
        type: 'shipping',
        addressJson: {
          address1: 'Av. Siempre Viva 123',
          city: 'Buenos Aires',
          state: 'BA',
          zip: '1000',
          country: 'AR',
        },
      }),
    );

    const existingIntent = await paymentIntentRepo.findOne({
      where: { orderId: order.id },
    });
    if (!existingIntent) {
      await paymentIntentRepo.save(
        paymentIntentRepo.create({
          tenantId: tenant.id,
          storeId: store.id,
          orderId: order.id,
          methodId: paymentMethod.id,
          status: 'pending',
          amount: order.totalAmount,
          currency: order.currency,
          referenceCode: `REF-${order.id.slice(0, 6).toUpperCase()}`,
        }),
      );
    }

    for (const item of itemsForOrder) {
      const level = await inventoryRepo.findOne({
        where: { warehouseId: warehouse.id, variantId: item.variant.id },
      });
      if (level) {
        level.reserved += item.quantity;
        await inventoryRepo.save(level);
      }
      const existingReservation = await reservationRepo.findOne({
        where: { orderId: order.id, variantId: item.variant.id },
      });
      if (!existingReservation) {
        await reservationRepo.save(
          reservationRepo.create({
            tenantId: tenant.id,
            storeId: store.id,
            warehouseId: warehouse.id,
            variantId: item.variant.id,
            orderId: order.id,
            quantity: item.quantity,
          }),
        );
      }
    }
  }

  await AppDataSource.destroy();
  // eslint-disable-next-line no-console
  console.log('Seed completed');
};

seed().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed', error);
  process.exit(1);
});
