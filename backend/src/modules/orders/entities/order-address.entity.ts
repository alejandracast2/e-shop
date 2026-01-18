import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { Order } from './order.entity';

export type OrderAddressType = 'shipping' | 'billing';

@Entity('order_addresses')
export class OrderAddress extends BaseEntity {
  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'varchar', length: 16 })
  type: OrderAddressType;

  @Column({ type: 'jsonb' })
  addressJson: Record<string, unknown>;

  @ManyToOne(() => Order, (order) => order.addresses, { onDelete: 'CASCADE' })
  order: Order;
}
