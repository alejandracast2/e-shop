import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { Cart } from './cart.entity';
import { ProductVariant } from '../../catalog/entities/product-variant.entity';

const priceTransformer = {
  to: (value: number) => value,
  from: (value: string | null) => (value ? Number(value) : 0),
};

@Entity('cart_items')
@Index(['cartId', 'variantId'], { unique: true })
export class CartItem extends BaseEntity {
  @Column({ type: 'uuid' })
  cartId: string;

  @Column({ type: 'uuid' })
  variantId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: priceTransformer })
  unitPrice: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  titleSnapshot?: string | null;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  cart: Cart;

  @ManyToOne(() => ProductVariant, { onDelete: 'SET NULL', nullable: true })
  variant?: ProductVariant | null;
}
