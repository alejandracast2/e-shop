import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from '../../order/entities/order-item.entity';
import { Category } from './category.entity';
import { ProductVariant } from './product-variant.entity';

const priceTransformer = {
  to: (value: number) => value,
  from: (value: string | null) => (value ? Number(value) : 0),
};

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 160 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: priceTransformer })
  price: number;

  @Column({ type: 'varchar', length: 80, nullable: true })
  sku?: string | null;

  @Column({ type: 'varchar', length: 320, nullable: true })
  imageUrl?: string | null;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Category, (category) => category.products, { eager: true, nullable: true })
  category?: Category | null;

  @OneToMany(() => ProductVariant, (variant) => variant.product, { cascade: true })
  variants?: ProductVariant[];

  @OneToMany(() => OrderItem, (item) => item.product)
  orderItems?: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
