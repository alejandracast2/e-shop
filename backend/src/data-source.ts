import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Customer } from './modules/customer/entities/customer.entity';
import { Order } from './modules/order/entities/order.entity';
import { OrderItem } from './modules/order/entities/order-item.entity';
import { Category } from './modules/product/entities/category.entity';
import { Color } from './modules/product/entities/color.entity';
import { Product } from './modules/product/entities/product.entity';
import { ProductVariant } from './modules/product/entities/product-variant.entity';
import { User } from './modules/user/entities/user.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASS ?? 'postgres',
  database: process.env.DB_NAME ?? 'ecommerce',
  entities: [Product, ProductVariant, Category, Color, Customer, User, Order, OrderItem],
  synchronize: process.env.NODE_ENV !== 'production',
});
