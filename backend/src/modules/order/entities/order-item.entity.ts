import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../../product/entities/product.entity';
import { Order } from './order.entity';

const priceTransformer = {
  to: (value: number) => value,
  from: (value: string | null) => (value ? Number(value) : 0),
};

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;

  @ManyToOne(() => Product, (product) => product.orderItems, { eager: true })
  product: Product;

  @Column({ type: 'int' })
  quantity: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: priceTransformer,
  })
  unitPrice: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: priceTransformer,
  })
  lineTotal: number;
}
