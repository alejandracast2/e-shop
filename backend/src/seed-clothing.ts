import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from './data-source';
import { Customer } from './modules/customer/entities/customer.entity';
import { Order } from './modules/order/entities/order.entity';
import { OrderItem } from './modules/order/entities/order-item.entity';
import { Category } from './modules/product/entities/category.entity';
import { Color } from './modules/product/entities/color.entity';
import { Product } from './modules/product/entities/product.entity';
import { ProductVariant } from './modules/product/entities/product-variant.entity';
import { User, UserRole } from './modules/user/entities/user.entity';

const seed = async () => {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const productRepo = AppDataSource.getRepository(Product);
  const variantRepo = AppDataSource.getRepository(ProductVariant);
  const categoryRepo = AppDataSource.getRepository(Category);
  const colorRepo = AppDataSource.getRepository(Color);
  const customerRepo = AppDataSource.getRepository(Customer);
  const orderRepo = AppDataSource.getRepository(Order);
  const orderItemRepo = AppDataSource.getRepository(OrderItem);

  const adminEmail = 'admin@eshop.com';
  const staffEmail = 'staff@eshop.com';

  const ensureUser = async (email: string, role: UserRole, name: string) => {
    const existing = await userRepo.findOne({ where: { email } });
    if (existing) return existing;
    const passwordHash = await bcrypt.hash('admin123', 10);
    return userRepo.save(
      userRepo.create({
        name,
        email,
        passwordHash,
        role,
        isActive: true,
      }),
    );
  };

  await ensureUser(adminEmail, UserRole.ADMIN, 'Admin User');
  await ensureUser(staffEmail, UserRole.STAFF, 'Staff User');

  const productSeed: Array<{
    base: Omit<Partial<Product>, 'category'> & { category?: string };
    variants: Array<{ size: string; color: string; stock: number; sku?: string }>;
  }> = [
    {
      base: {
        name: 'Camisa Lino',
        description: 'Camisa ligera de lino para uso diario.',
        price: 42,
        sku: 'CAM-001',
        imageUrl:
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
        isActive: true,
        category: 'Camisas',
      },
      variants: [
        { size: 'S', color: 'Blanco', stock: 8, sku: 'CAM-001-S-W' },
        { size: 'M', color: 'Blanco', stock: 12, sku: 'CAM-001-M-W' },
        { size: 'L', color: 'Blanco', stock: 6, sku: 'CAM-001-L-W' },
      ],
    },
    {
      base: {
        name: 'Chamarra Urb',
        description: 'Corte moderno con cierre frontal.',
        price: 96,
        sku: 'CHA-002',
        imageUrl:
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
        isActive: true,
        category: 'Chamarras',
      },
      variants: [
        { size: 'M', color: 'Negro', stock: 4, sku: 'CHA-002-M-BK' },
        { size: 'L', color: 'Negro', stock: 5, sku: 'CHA-002-L-BK' },
        { size: 'M', color: 'Gris', stock: 3, sku: 'CHA-002-M-GR' },
      ],
    },
    {
      base: {
        name: 'Pantalon Tailor',
        description: 'Pantalon recto con tejido suave.',
        price: 54,
        sku: 'PAN-003',
        imageUrl:
          'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
        isActive: true,
        category: 'Pantalones',
      },
      variants: [
        { size: '30', color: 'Azul', stock: 10, sku: 'PAN-003-30-BL' },
        { size: '32', color: 'Azul', stock: 9, sku: 'PAN-003-32-BL' },
        { size: '34', color: 'Azul', stock: 7, sku: 'PAN-003-34-BL' },
      ],
    },
    {
      base: {
        name: 'Vestido Aura',
        description: 'Vestido midi con caida ligera.',
        price: 74,
        sku: 'VES-004',
        imageUrl:
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
        isActive: true,
        category: 'Vestidos',
      },
      variants: [
        { size: 'S', color: 'Rojo', stock: 5, sku: 'VES-004-S-RD' },
        { size: 'M', color: 'Rojo', stock: 7, sku: 'VES-004-M-RD' },
        { size: 'S', color: 'Negro', stock: 4, sku: 'VES-004-S-BK' },
      ],
    },
  ];

  const products: Product[] = [];
  for (const seedItem of productSeed) {
    const existing = await productRepo.findOne({
      where: { sku: seedItem.base.sku ?? '' },
      relations: { variants: true },
    });
    if (existing) {
      products.push(existing);
      continue;
    }

    let category: Category | null = null;
    if (seedItem.base.category) {
      category =
        (await categoryRepo.findOne({ where: { name: seedItem.base.category } })) ??
        (await categoryRepo.save(
          categoryRepo.create({ name: seedItem.base.category }),
        ));
    }

    const created = await productRepo.save(
      productRepo.create({ ...seedItem.base, category }),
    );

    let totalStock = 0;
    for (const variantSeed of seedItem.variants) {
      const color =
        (await colorRepo.findOne({ where: { name: variantSeed.color } })) ??
        (await colorRepo.save(colorRepo.create({ name: variantSeed.color })));
      await variantRepo.save(
        variantRepo.create({
          product: created,
          size: variantSeed.size,
          color,
          stock: variantSeed.stock,
          sku: variantSeed.sku,
        }),
      );
      totalStock += variantSeed.stock;
    }

    created.stock = totalStock;
    await productRepo.save(created);
    products.push(created);
  }

  const customerSeed: Array<Partial<Customer>> = [
    {
      firstName: 'Sofia',
      lastName: 'Lopez',
      email: 'sofia@mail.com',
      phone: '555-1000',
      addressLine1: 'Calle 123',
      city: 'CDMX',
      state: 'CDMX',
      postalCode: '01000',
      country: 'MX',
    },
    {
      firstName: 'Luis',
      lastName: 'Martinez',
      email: 'luis@mail.com',
      phone: '555-2000',
      addressLine1: 'Av. Central 45',
      city: 'Guadalajara',
      state: 'Jalisco',
      postalCode: '44100',
      country: 'MX',
    },
    {
      firstName: 'Ana',
      lastName: 'Perez',
      email: 'ana@mail.com',
      phone: '555-3000',
      addressLine1: 'Calle 9',
      city: 'Monterrey',
      state: 'NL',
      postalCode: '64000',
      country: 'MX',
    },
  ];

  const customers: Customer[] = [];
  for (const seedItem of customerSeed) {
    const existing = await customerRepo.findOne({
      where: { email: seedItem.email ?? '' },
    });
    if (existing) {
      customers.push(existing);
      continue;
    }
    customers.push(await customerRepo.save(customerRepo.create(seedItem)));
  }

  const existingOrders = await orderRepo.count();
  if (existingOrders === 0) {
    const makeOrder = async (
      customer: Customer,
      items: Array<[ProductVariant, number]>,
    ) => {
      let subtotal = 0;
      const orderItems: OrderItem[] = [];

      for (const [variant, quantity] of items) {
        const product = variant.product;
        const lineTotal = product.price * quantity;
        subtotal += lineTotal;
        variant.stock = Math.max(0, variant.stock - quantity);
        await variantRepo.save(variant);
        product.stock = Math.max(0, product.stock - quantity);
        await productRepo.save(product);
        orderItems.push(
          orderItemRepo.create({
            product,
            variant,
            quantity,
            unitPrice: product.price,
            lineTotal,
          }),
        );
      }

      const order = orderRepo.create({
        customer,
        items: orderItems,
        subtotal,
        total: subtotal,
        currency: 'USD',
        shippingName: `${customer.firstName} ${customer.lastName}`,
        shippingEmail: customer.email,
        shippingPhone: customer.phone ?? null,
        shippingAddressLine1: customer.addressLine1 ?? '',
        shippingAddressLine2: customer.addressLine2 ?? null,
        shippingCity: customer.city ?? '',
        shippingState: customer.state ?? '',
        shippingPostalCode: customer.postalCode ?? '',
        shippingCountry: customer.country ?? '',
      });

      return orderRepo.save(order);
    };

    const variants = await variantRepo.find({
      relations: { product: true },
    });
    await makeOrder(customers[0], [
      [variants[0], 1],
      [variants[2], 2],
    ]);
    await makeOrder(customers[1], [
      [variants[3], 1],
      [variants[5], 2],
    ]);
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
