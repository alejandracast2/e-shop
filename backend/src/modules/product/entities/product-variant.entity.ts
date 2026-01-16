import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Color } from './color.entity';
import { Product } from './product.entity';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, (product) => product.variants, { onDelete: 'CASCADE' })
  product: Product;

  @ManyToOne(() => Color, (color) => color.variants, { eager: true, nullable: true })
  color?: Color | null;

  @Column({ type: 'varchar', length: 40 })
  size: string;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'varchar', length: 80, nullable: true })
  sku?: string | null;
}
