import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { Product } from './product.entity';
import { VariantAttributeValue } from './variant-attribute-value.entity';

const priceTransformer = {
  to: (value: number) => value,
  from: (value: string | null) => (value ? Number(value) : 0),
};

@Entity('product_variants')
export class ProductVariant extends BaseEntity {
  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, (product) => product.variants, { onDelete: 'CASCADE' })
  product: Product;

  @Column({ type: 'varchar', length: 80, nullable: true })
  sku?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  barcode?: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: priceTransformer })
  price: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: priceTransformer,
    nullable: true,
  })
  compareAtPrice?: number | null;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: priceTransformer,
    nullable: true,
  })
  cost?: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 3, nullable: true })
  weight?: number | null;

  @Column({ type: 'jsonb', nullable: true })
  dimensionsJson?: Record<string, unknown> | null;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => VariantAttributeValue, (value) => value.variant)
  attributes?: VariantAttributeValue[];
}
