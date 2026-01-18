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

  const categoryCafe =
    (await categoryRepo.findOne({ where: { storeId: store.id, slug: 'cafe' } })) ??
    (await categoryRepo.save(
      categoryRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        name: 'Cafe',
        slug: 'cafe',
        position: 0,
      }),
    ));

  const categoryEquipos =
    (await categoryRepo.findOne({
      where: { storeId: store.id, slug: 'equipos' },
    })) ??
    (await categoryRepo.save(
      categoryRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        name: 'Equipos',
        slug: 'equipos',
        position: 3,
      }),
    ));

  const categoryRegalos =
    (await categoryRepo.findOne({
      where: { storeId: store.id, slug: 'regalos' },
    })) ??
    (await categoryRepo.save(
      categoryRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        name: 'Regalos',
        slug: 'regalos',
        position: 4,
      }),
    ));

  const categoryRemeras =
    (await categoryRepo.findOne({
      where: { storeId: store.id, slug: 'remeras' },
    })) ??
    (await categoryRepo.save(
      categoryRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        name: 'Remeras',
        slug: 'remeras',
        parentId: categoryRopa.id,
        position: 1,
      }),
    ));

  const categoryBuzos =
    (await categoryRepo.findOne({
      where: { storeId: store.id, slug: 'buzos' },
    })) ??
    (await categoryRepo.save(
      categoryRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        name: 'Buzos',
        slug: 'buzos',
        parentId: categoryRopa.id,
        position: 2,
      }),
    ));

  const categoryCafeGrano =
    (await categoryRepo.findOne({
      where: { storeId: store.id, slug: 'cafe-grano' },
    })) ??
    (await categoryRepo.save(
      categoryRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        name: 'Cafe en grano',
        slug: 'cafe-grano',
        parentId: categoryCafe.id,
        position: 1,
      }),
    ));

  const categoryCafeMolido =
    (await categoryRepo.findOne({
      where: { storeId: store.id, slug: 'cafe-molido' },
    })) ??
    (await categoryRepo.save(
      categoryRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        name: 'Cafe molido',
        slug: 'cafe-molido',
        parentId: categoryCafe.id,
        position: 2,
      }),
    ));

  const categoryMolinos =
    (await categoryRepo.findOne({
      where: { storeId: store.id, slug: 'molinillos' },
    })) ??
    (await categoryRepo.save(
      categoryRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        name: 'Molinillos',
        slug: 'molinillos',
        parentId: categoryEquipos.id,
        position: 1,
      }),
    ));

  const categoryCafeteras =
    (await categoryRepo.findOne({
      where: { storeId: store.id, slug: 'cafeteras' },
    })) ??
    (await categoryRepo.save(
      categoryRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        name: 'Cafeteras',
        slug: 'cafeteras',
        parentId: categoryEquipos.id,
        position: 2,
      }),
    ));

  const categoryGiftCards =
    (await categoryRepo.findOne({
      where: { storeId: store.id, slug: 'tarjetas-regalo' },
    })) ??
    (await categoryRepo.save(
      categoryRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        name: 'Tarjetas regalo',
        slug: 'tarjetas-regalo',
        parentId: categoryRegalos.id,
        position: 1,
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

  const roastAttr =
    (await attributeRepo.findOne({
      where: { storeId: store.id, code: 'roast' },
    })) ??
    (await attributeRepo.save(
      attributeRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        code: 'roast',
        name: 'Tostado',
        type: 'select',
        isVariantAxis: false,
        isFilterable: true,
        isRequired: true,
      }),
    ));

  const originAttr =
    (await attributeRepo.findOne({
      where: { storeId: store.id, code: 'origin' },
    })) ??
    (await attributeRepo.save(
      attributeRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        code: 'origin',
        name: 'Origen',
        type: 'select',
        isVariantAxis: false,
        isFilterable: true,
        isRequired: true,
      }),
    ));

  const grindAttr =
    (await attributeRepo.findOne({
      where: { storeId: store.id, code: 'grind' },
    })) ??
    (await attributeRepo.save(
      attributeRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        code: 'grind',
        name: 'Molienda',
        type: 'select',
        isVariantAxis: true,
        isFilterable: true,
        isRequired: true,
      }),
    ));

  const volumeAttr =
    (await attributeRepo.findOne({
      where: { storeId: store.id, code: 'volume_ml' },
    })) ??
    (await attributeRepo.save(
      attributeRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        code: 'volume_ml',
        name: 'Volumen',
        type: 'number',
        isVariantAxis: false,
        isFilterable: true,
        isRequired: false,
        unit: 'ml',
      }),
    ));

  const weightAttr =
    (await attributeRepo.findOne({
      where: { storeId: store.id, code: 'weight_g' },
    })) ??
    (await attributeRepo.save(
      attributeRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        code: 'weight_g',
        name: 'Peso',
        type: 'number',
        isVariantAxis: false,
        isFilterable: true,
        isRequired: false,
        unit: 'g',
      }),
    ));

  const genderAttr =
    (await attributeRepo.findOne({
      where: { storeId: store.id, code: 'gender' },
    })) ??
    (await attributeRepo.save(
      attributeRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        code: 'gender',
        name: 'Genero',
        type: 'select',
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
  const colorWhite = await ensureOption(colorAttr.id, 'White');
  const colorSand = await ensureOption(colorAttr.id, 'Sand');
  const sizeS = await ensureOption(sizeAttr.id, 'S');
  const sizeM = await ensureOption(sizeAttr.id, 'M');
  const sizeL = await ensureOption(sizeAttr.id, 'L');
  const sizeXL = await ensureOption(sizeAttr.id, 'XL');

  const roastLight = await ensureOption(roastAttr.id, 'Claro');
  const roastMedium = await ensureOption(roastAttr.id, 'Medio');
  const roastDark = await ensureOption(roastAttr.id, 'Oscuro');

  const originColombia = await ensureOption(originAttr.id, 'Colombia');
  const originEthiopia = await ensureOption(originAttr.id, 'Etiopia');
  const originBrazil = await ensureOption(originAttr.id, 'Brasil');

  const grindGrain = await ensureOption(grindAttr.id, 'Grano');
  const grindEspresso = await ensureOption(grindAttr.id, 'Espresso');
  const grindFilter = await ensureOption(grindAttr.id, 'Filtro');

  const genderUnisex = await ensureOption(genderAttr.id, 'Unisex');
  const genderWomen = await ensureOption(genderAttr.id, 'Mujer');
  const genderMen = await ensureOption(genderAttr.id, 'Hombre');

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

  const coffeeType =
    (await productTypeRepo.findOne({
      where: { storeId: store.id, name: 'Cafe' },
    })) ??
    (await productTypeRepo.save(
      productTypeRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        name: 'Cafe',
      }),
    ));

  const drinkwareType =
    (await productTypeRepo.findOne({
      where: { storeId: store.id, name: 'Drinkware' },
    })) ??
    (await productTypeRepo.save(
      productTypeRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        name: 'Drinkware',
      }),
    ));

  const equipmentType =
    (await productTypeRepo.findOne({
      where: { storeId: store.id, name: 'Equipamiento' },
    })) ??
    (await productTypeRepo.save(
      productTypeRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        name: 'Equipamiento',
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
  await ensureProductTypeAttr(tshirtType.id, genderAttr.id, false, false);

  await ensureProductTypeAttr(coffeeType.id, roastAttr.id, false, true);
  await ensureProductTypeAttr(coffeeType.id, originAttr.id, false, true);
  await ensureProductTypeAttr(coffeeType.id, grindAttr.id, true, true);
  await ensureProductTypeAttr(coffeeType.id, weightAttr.id, false, false);

  await ensureProductTypeAttr(drinkwareType.id, colorAttr.id, false, false);
  await ensureProductTypeAttr(drinkwareType.id, materialAttr.id, false, false);
  await ensureProductTypeAttr(drinkwareType.id, volumeAttr.id, false, false);

  await ensureProductTypeAttr(equipmentType.id, materialAttr.id, false, false);

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
    categoryId: categoryRemeras.id,
    productTypeId: tshirtType.id,
    brand: 'Cafe Lab',
  });

  const hoodie = await ensureProduct({
    title: 'Urban Hoodie',
    slug: 'urban-hoodie',
    description: 'Warm hoodie for cool nights.',
    categoryId: categoryBuzos.id,
    productTypeId: tshirtType.id,
    brand: 'Cafe Lab',
  });

  const mug = await ensureProduct({
    title: 'Origen Mug',
    slug: 'origen-mug',
    description: 'Ceramic mug with matte finish.',
    categoryId: categoryAccesorios.id,
    productTypeId: drinkwareType.id,
    brand: 'Cafe de Origen',
  });

  const espressoBlend = await ensureProduct({
    title: 'Espresso Blend',
    slug: 'espresso-blend',
    description: 'Blend intenso con notas de cacao.',
    categoryId: categoryCafeGrano.id,
    productTypeId: coffeeType.id,
    brand: 'Cafe de Origen',
  });

  const andesFilter = await ensureProduct({
    title: 'Andes Filter',
    slug: 'andes-filter',
    description: 'Tueste medio con notas citricas.',
    categoryId: categoryCafeMolido.id,
    productTypeId: coffeeType.id,
    brand: 'Cafe de Origen',
  });

  const ethiopiaOrigin = await ensureProduct({
    title: 'Ethiopia Yirgacheffe',
    slug: 'ethiopia-yirgacheffe',
    description: 'Cafe floral con acidez brillante.',
    categoryId: categoryCafeGrano.id,
    productTypeId: coffeeType.id,
    brand: 'Origen Select',
  });

  const travelTumbler = await ensureProduct({
    title: 'Travel Tumbler',
    slug: 'travel-tumbler',
    description: 'Termo doble pared para llevar tu cafe.',
    categoryId: categoryAccesorios.id,
    productTypeId: drinkwareType.id,
    brand: 'Cafe Lab',
  });

  const canvasTote = await ensureProduct({
    title: 'Canvas Tote',
    slug: 'canvas-tote',
    description: 'Bolsa de lona resistente para el dia a dia.',
    categoryId: categoryAccesorios.id,
    productTypeId: null,
    brand: 'Cafe Lab',
  });

  const handGrinder = await ensureProduct({
    title: 'Molinillo Manual',
    slug: 'molinillo-manual',
    description: 'Molienda ajustable para metodos manuales.',
    categoryId: categoryMolinos.id,
    productTypeId: equipmentType.id,
    brand: 'Barista Pro',
  });

  const pourOverKit = await ensureProduct({
    title: 'Kit Pour Over',
    slug: 'kit-pour-over',
    description: 'Set completo con dripper y filtro.',
    categoryId: categoryCafeteras.id,
    productTypeId: equipmentType.id,
    brand: 'Brew Lab',
  });

  const giftCard = await ensureProduct({
    title: 'Gift Card 50',
    slug: 'gift-card-50',
    description: 'Tarjeta regalo digital de $50.',
    categoryId: categoryGiftCards.id,
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

  const ensureProductAttrOption = async (
    productId: string,
    attributeDefinitionId: string,
    valueOptionId: string,
  ) => {
    const existing = await productAttrRepo.findOne({
      where: { productId, attributeDefinitionId },
    });
    if (existing) return existing;
    return productAttrRepo.save(
      productAttrRepo.create({
        productId,
        attributeDefinitionId,
        valueOptionId,
      }),
    );
  };

  const ensureProductAttrNumber = async (
    productId: string,
    attributeDefinitionId: string,
    valueNumber: number,
  ) => {
    const existing = await productAttrRepo.findOne({
      where: { productId, attributeDefinitionId },
    });
    if (existing) return existing;
    return productAttrRepo.save(
      productAttrRepo.create({
        productId,
        attributeDefinitionId,
        valueNumber,
      }),
    );
  };

  await ensureProductAttr(tshirt.id, materialAttr.id, 'Cotton 95%');
  await ensureProductAttr(hoodie.id, materialAttr.id, 'Cotton blend');
  await ensureProductAttrOption(tshirt.id, genderAttr.id, genderUnisex.id);
  await ensureProductAttrOption(hoodie.id, genderAttr.id, genderUnisex.id);

  await ensureProductAttrOption(espressoBlend.id, roastAttr.id, roastDark.id);
  await ensureProductAttrOption(espressoBlend.id, originAttr.id, originBrazil.id);
  await ensureProductAttrNumber(espressoBlend.id, weightAttr.id, 250);

  await ensureProductAttrOption(andesFilter.id, roastAttr.id, roastMedium.id);
  await ensureProductAttrOption(andesFilter.id, originAttr.id, originColombia.id);
  await ensureProductAttrNumber(andesFilter.id, weightAttr.id, 250);

  await ensureProductAttrOption(ethiopiaOrigin.id, roastAttr.id, roastLight.id);
  await ensureProductAttrOption(ethiopiaOrigin.id, originAttr.id, originEthiopia.id);
  await ensureProductAttrNumber(ethiopiaOrigin.id, weightAttr.id, 250);

  await ensureProductAttr(mug.id, materialAttr.id, 'Ceramic');
  await ensureProductAttrNumber(mug.id, volumeAttr.id, 320);

  await ensureProductAttr(travelTumbler.id, materialAttr.id, 'Stainless steel');
  await ensureProductAttrNumber(travelTumbler.id, volumeAttr.id, 480);

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

  const tumblerBlack = await ensureVariant({
    productId: travelTumbler.id,
    sku: 'TUM-BLK',
    price: 32,
  });
  const tumblerWhite = await ensureVariant({
    productId: travelTumbler.id,
    sku: 'TUM-WHT',
    price: 32,
  });

  await ensureVariantAttr(tumblerBlack.id, colorAttr.id, colorBlack.id);
  await ensureVariantAttr(tumblerWhite.id, colorAttr.id, colorWhite.id);

  const toteSand = await ensureVariant({
    productId: canvasTote.id,
    sku: 'TOTE-SAND',
    price: 22,
  });
  await ensureVariantAttr(toteSand.id, colorAttr.id, colorSand.id);

  const espressoGrain = await ensureVariant({
    productId: espressoBlend.id,
    sku: 'ESP-GRAIN',
    price: 16,
  });
  const espressoEspresso = await ensureVariant({
    productId: espressoBlend.id,
    sku: 'ESP-ESP',
    price: 16,
  });
  await ensureVariantAttr(espressoGrain.id, grindAttr.id, grindGrain.id);
  await ensureVariantAttr(espressoEspresso.id, grindAttr.id, grindEspresso.id);

  const andesFilterGrain = await ensureVariant({
    productId: andesFilter.id,
    sku: 'AND-GRAIN',
    price: 15.5,
  });
  const andesFilterBrew = await ensureVariant({
    productId: andesFilter.id,
    sku: 'AND-FILTER',
    price: 15.5,
  });
  await ensureVariantAttr(andesFilterGrain.id, grindAttr.id, grindGrain.id);
  await ensureVariantAttr(andesFilterBrew.id, grindAttr.id, grindFilter.id);

  const ethiopiaGrain = await ensureVariant({
    productId: ethiopiaOrigin.id,
    sku: 'ETH-GRAIN',
    price: 18.5,
  });
  const ethiopiaFilter = await ensureVariant({
    productId: ethiopiaOrigin.id,
    sku: 'ETH-FILTER',
    price: 18.5,
  });
  await ensureVariantAttr(ethiopiaGrain.id, grindAttr.id, grindGrain.id);
  await ensureVariantAttr(ethiopiaFilter.id, grindAttr.id, grindFilter.id);

  const grinderVariant = await ensureVariant({
    productId: handGrinder.id,
    sku: 'GRN-HAND',
    price: 68,
  });

  const pourOverVariant = await ensureVariant({
    productId: pourOverKit.id,
    sku: 'POUR-KIT',
    price: 54,
  });

  const giftCardVariant = await ensureVariant({
    productId: giftCard.id,
    sku: 'GIFT-50',
    price: 50,
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
  await ensureProductImage(
    espressoBlend.id,
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80',
  );
  await ensureProductImage(
    andesFilter.id,
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80',
  );
  await ensureProductImage(
    ethiopiaOrigin.id,
    'https://images.unsplash.com/photo-1459755486867-b55449bb39ff?auto=format&fit=crop&w=900&q=80',
  );
  await ensureProductImage(
    travelTumbler.id,
    'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=900&q=80',
  );
  await ensureProductImage(
    canvasTote.id,
    'https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?auto=format&fit=crop&w=900&q=80',
  );
  await ensureProductImage(
    handGrinder.id,
    'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=900&q=80',
  );
  await ensureProductImage(
    pourOverKit.id,
    'https://images.unsplash.com/photo-1461988091159-192b6df7054f?auto=format&fit=crop&w=900&q=80',
  );
  await ensureProductImage(
    giftCard.id,
    'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
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
  await ensureInventory(tumblerBlack.id, 15);
  await ensureInventory(tumblerWhite.id, 11);
  await ensureInventory(toteSand.id, 8);
  await ensureInventory(espressoGrain.id, 30);
  await ensureInventory(espressoEspresso.id, 22);
  await ensureInventory(andesFilterGrain.id, 25);
  await ensureInventory(andesFilterBrew.id, 19);
  await ensureInventory(ethiopiaGrain.id, 18);
  await ensureInventory(ethiopiaFilter.id, 14);
  await ensureInventory(grinderVariant.id, 6);
  await ensureInventory(pourOverVariant.id, 5);
  await ensureInventory(giftCardVariant.id, 100);

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

  const cashMethod =
    (await paymentMethodRepo.findOne({
      where: { storeId: store.id, type: 'cash' },
    })) ??
    (await paymentMethodRepo.save(
      paymentMethodRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        type: 'cash',
        configJson: {
          instructions: 'Pago en efectivo al retirar.',
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

  const extraCustomers = [
    { fullName: 'Mateo Ruiz', email: 'mateo@mail.com', phone: '+54 11 4555-2222' },
    { fullName: 'Valentina Paz', email: 'valen@mail.com', phone: '+54 11 4666-3333' },
    { fullName: 'Julia Rios', email: 'julia@mail.com', phone: '+54 11 4777-4444' },
  ];

  for (const entry of extraCustomers) {
    const existingCustomer =
      (await customerRepo.findOne({
        where: { storeId: store.id, email: entry.email },
      })) ??
      (await customerRepo.save(
        customerRepo.create({
          tenantId: tenant.id,
          storeId: store.id,
          fullName: entry.fullName,
          email: entry.email,
          phone: entry.phone,
        }),
      ));

    const existingCustomerAddress = await customerAddressRepo.findOne({
      where: { customerId: existingCustomer.id },
    });
    if (!existingCustomerAddress) {
      await customerAddressRepo.save(
        customerAddressRepo.create({
          customerId: existingCustomer.id,
          label: 'Casa',
          address1: 'Av. Central 500',
          city: 'Buenos Aires',
          state: 'BA',
          zip: '1000',
          country: 'AR',
          isDefault: true,
        }),
      );
    }
  }

  const orderSeeds = [
    {
      orderNumber: 1001,
      customerEmail: customer.email!,
      status: 'pending_payment' as const,
      paymentStatus: 'pending' as const,
      fulfillmentStatus: 'unfulfilled' as const,
      items: [
        { variant: tshirtRedM, quantity: 2 },
        { variant: mugVariant, quantity: 1 },
      ],
      paymentIntentStatus: 'pending' as const,
      methodId: paymentMethod.id,
      note: 'Leave at reception',
      reserveStock: true,
    },
    {
      orderNumber: 1002,
      customerEmail: 'mateo@mail.com',
      status: 'pending_payment' as const,
      paymentStatus: 'pending' as const,
      fulfillmentStatus: 'unfulfilled' as const,
      items: [
        { variant: espressoGrain, quantity: 1 },
        { variant: tumblerBlack, quantity: 1 },
      ],
      paymentIntentStatus: 'submitted' as const,
      methodId: paymentMethod.id,
      note: 'Enviar por la manana',
      reserveStock: true,
    },
    {
      orderNumber: 1003,
      customerEmail: 'valen@mail.com',
      status: 'processing' as const,
      paymentStatus: 'paid' as const,
      fulfillmentStatus: 'unfulfilled' as const,
      items: [{ variant: hoodieBlueL, quantity: 1 }],
      paymentIntentStatus: 'confirmed' as const,
      methodId: paymentMethod.id,
      note: null,
      reserveStock: false,
    },
    {
      orderNumber: 1004,
      customerEmail: 'julia@mail.com',
      status: 'cancelled' as const,
      paymentStatus: 'failed' as const,
      fulfillmentStatus: 'unfulfilled' as const,
      items: [{ variant: toteSand, quantity: 1 }],
      paymentIntentStatus: 'rejected' as const,
      methodId: cashMethod.id,
      note: 'Cancelado por el cliente',
      reserveStock: false,
    },
  ];

  for (const seed of orderSeeds) {
    const existingOrder = await orderRepo.findOne({
      where: { storeId: store.id, orderNumber: seed.orderNumber },
    });
    if (existingOrder) continue;

    const orderCustomer =
      (await customerRepo.findOne({
        where: { storeId: store.id, email: seed.customerEmail },
      })) ?? customer;

    const subtotal = seed.items.reduce(
      (sum, item) => sum + item.variant.price * item.quantity,
      0,
    );
    const order = await orderRepo.save(
      orderRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        orderNumber: seed.orderNumber,
        customerId: orderCustomer.id,
        status: seed.status,
        paymentStatus: seed.paymentStatus,
        fulfillmentStatus: seed.fulfillmentStatus,
        currency: store.currency,
        subtotalAmount: subtotal,
        discountAmount: 0,
        shippingAmount: 0,
        taxAmount: 0,
        totalAmount: subtotal,
        customerNote: seed.note,
      }),
    );

    const orderItems = seed.items.map((item) =>
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

    await paymentIntentRepo.save(
      paymentIntentRepo.create({
        tenantId: tenant.id,
        storeId: store.id,
        orderId: order.id,
        methodId: seed.methodId,
        status: seed.paymentIntentStatus,
        amount: order.totalAmount,
        currency: order.currency,
        referenceCode: `REF-${order.id.slice(0, 6).toUpperCase()}`,
      }),
    );

    for (const item of seed.items) {
      const level = await inventoryRepo.findOne({
        where: { warehouseId: warehouse.id, variantId: item.variant.id },
      });
      if (!level) continue;
      if (seed.reserveStock) {
        level.reserved += item.quantity;
      } else if (seed.paymentStatus === 'paid') {
        level.onHand = Math.max(0, level.onHand - item.quantity);
      }
      await inventoryRepo.save(level);

      if (seed.reserveStock) {
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
