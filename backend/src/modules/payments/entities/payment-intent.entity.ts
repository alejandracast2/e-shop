import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { PaymentMethod } from './payment-method.entity';
import { Order } from '../../orders/entities/order.entity';

export type PaymentIntentStatus =
  | 'pending'
  | 'submitted'
  | 'confirmed'
  | 'rejected'
  | 'expired';

const priceTransformer = {
  to: (value: number) => value,
  from: (value: string | null) => (value ? Number(value) : 0),
};

@Entity('payment_intents')
export class PaymentIntent extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'uuid' })
  methodId: string;

  @Column({ type: 'varchar', length: 24, default: 'pending' })
  status: PaymentIntentStatus;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: priceTransformer })
  amount: number;

  @Column({ length: 10 })
  currency: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  referenceCode?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date | null;

  @ManyToOne(() => PaymentMethod, { onDelete: 'RESTRICT' })
  method: PaymentMethod;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  order: Order;
}
