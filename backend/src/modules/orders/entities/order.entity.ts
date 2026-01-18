import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { OrderItem } from './order-item.entity';
import { OrderAddress } from './order-address.entity';
import { OrderStatusEvent } from './order-status-event.entity';
import { Customer } from '../../customers/entities/customer.entity';

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'fulfilled'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus =
  | 'unpaid'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded';

export type FulfillmentStatus =
  | 'unfulfilled'
  | 'partial'
  | 'fulfilled'
  | 'shipped'
  | 'delivered';

const priceTransformer = {
  to: (value: number) => value,
  from: (value: string | null) => (value ? Number(value) : 0),
};

@Entity('orders')
@Index(['storeId', 'orderNumber'], { unique: true })
export class Order extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'int' })
  orderNumber: number;

  @Column({ type: 'uuid', nullable: true })
  customerId?: string | null;

  @ManyToOne(() => Customer, { onDelete: 'SET NULL', nullable: true })
  customer?: Customer | null;

  @Column({ type: 'varchar', length: 24, default: 'pending_payment' })
  status: OrderStatus;

  @Column({ type: 'varchar', length: 24, default: 'unpaid' })
  paymentStatus: PaymentStatus;

  @Column({ type: 'varchar', length: 24, default: 'unfulfilled' })
  fulfillmentStatus: FulfillmentStatus;

  @Column({ length: 10, default: 'USD' })
  currency: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: priceTransformer })
  subtotalAmount: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: priceTransformer,
    default: 0,
  })
  discountAmount: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: priceTransformer,
    default: 0,
  })
  shippingAmount: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: priceTransformer,
    default: 0,
  })
  taxAmount: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: priceTransformer })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  customerNote?: string | null;

  @OneToMany(() => OrderItem, (item) => item.order)
  items?: OrderItem[];

  @OneToMany(() => OrderAddress, (address) => address.order)
  addresses?: OrderAddress[];

  @OneToMany(() => OrderStatusEvent, (event) => event.order)
  statusEvents?: OrderStatusEvent[];
}
