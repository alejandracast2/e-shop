import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from './data-source';
import { Customer } from './modules/customer/entities/customer.entity';
import { Order } from './modules/order/entities/order.entity';
import { OrderItem } from './modules/order/entities/order-item.entity';
import { Product } from './modules/product/entities/product.entity';
import { User, UserRole } from './modules/user/entities/user.entity';

const seed = async () => {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const productRepo = AppDataSource.getRepository(Product);
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

  const productSeed: Array<Partial<Product>> = [
    {
      name: 'Ritual de Manana',
      description: 'Set de cuidado personal para iniciar el dia.',
      price: 72,
      sku: 'RIT-001',
      imageUrl:
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
      stock: 24,
      isActive: true,
    },
    {
      name: 'Kit Minimal',
      description: 'Accesorios esenciales para tu escritorio.',
      price: 48,
      sku: 'MIN-002',
      imageUrl:
        'https://images.unsplash.com/photo-1487014679447-9f8336841d58?auto=format&fit=crop&w=800&q=80',
      stock: 12,
      isActive: true,
    },
    {
      name: 'Aroma Citrus',
      description: 'Vela aromatica con notas citricas.',
      price: 28,
      sku: 'ARO-003',
      imageUrl:
        'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80',
      stock: 32,
      isActive: true,
    },
    {
      name: 'Botella Termica',
      description: 'Mantiene bebidas frias o calientes.',
      price: 36,
      sku: 'BOT-004',
      imageUrl:
        'https://images.unsplash.com/photo-1526401485004-2aa7f3d5f0d4?auto=format&fit=crop&w=800&q=80',
      stock: 18,
      isActive: true,
    },
    {
      name: 'Cuaderno Terra',
      description: 'Papel premium para notas diarias.',
      price: 18,
      sku: 'CUE-005',
      imageUrl:
        'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80',
      stock: 40,
      isActive: true,
    },
    {
      name: 'Taza Ceramica',
      description: 'Acabado mate y diseno ergonomico.',
      price: 16,
      sku: 'TAZ-006',
      imageUrl:
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
      stock: 20,
      isActive: true,
    },
  ];

  const products: Product[] = [];
  for (const seedItem of productSeed) {
    const existing = await productRepo.findOne({
      where: { sku: seedItem.sku ?? '' },
    });
    if (existing) {
      products.push(existing);
      continue;
    }
    const created = await productRepo.save(productRepo.create(seedItem));
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
    const makeOrder = async (customer: Customer, items: Array<[Product, number]>) => {
      let subtotal = 0;
      const orderItems: OrderItem[] = [];

      for (const [product, quantity] of items) {
        const lineTotal = product.price * quantity;
        subtotal += lineTotal;
        product.stock = Math.max(0, product.stock - quantity);
        await productRepo.save(product);
        orderItems.push(
          orderItemRepo.create({
            product,
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

    await makeOrder(customers[0], [
      [products[0], 1],
      [products[2], 2],
    ]);
    await makeOrder(customers[1], [
      [products[3], 1],
      [products[4], 3],
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
