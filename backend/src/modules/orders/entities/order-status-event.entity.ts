import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { Order } from './order.entity';

@Entity('order_status_events')
export class OrderStatusEvent extends BaseEntity {
  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'varchar', length: 24, nullable: true })
  fromStatus?: string | null;

  @Column({ length: 24 })
  toStatus: string;

  @Column({ type: 'text', nullable: true })
  note?: string | null;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string | null;

  @ManyToOne(() => Order, (order) => order.statusEvents, { onDelete: 'CASCADE' })
  order: Order;
}
