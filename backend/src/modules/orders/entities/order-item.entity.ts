import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { Order } from './order.entity';

const priceTransformer = {
  to: (value: number) => value,
  from: (value: string | null) => (value ? Number(value) : 0),
};

@Entity('order_items')
export class OrderItem extends BaseEntity {
  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'uuid', nullable: true })
  variantId?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  skuSnapshot?: string | null;

  @Column({ length: 200 })
  titleSnapshot: string;

  @Column({ type: 'jsonb', nullable: true })
  attributesSnapshotJson?: Record<string, unknown> | null;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: priceTransformer })
  unitPrice: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: priceTransformer })
  totalPrice: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;
}
