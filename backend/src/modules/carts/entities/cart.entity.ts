import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { CartItem } from './cart-item.entity';

export type CartStatus = 'active' | 'converted' | 'abandoned';

@Entity('carts')
export class Cart extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'uuid', nullable: true })
  customerId?: string | null;

  @Column({ type: 'varchar', length: 24, default: 'active' })
  status: CartStatus;

  @Column({ length: 10, default: 'USD' })
  currency: string;

  @OneToMany(() => CartItem, (item) => item.cart)
  items?: CartItem[];
}
