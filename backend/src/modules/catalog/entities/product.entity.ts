import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { Category } from './category.entity';
import { ProductType } from './product-type.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductImage } from './product-image.entity';
import { ProductAttributeValue } from './product-attribute-value.entity';

export type ProductStatus = 'draft' | 'active' | 'archived';

@Entity('products')
@Index(['storeId', 'slug'], { unique: true })
export class Product extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'uuid', nullable: true })
  productTypeId?: string | null;

  @Column({ type: 'uuid', nullable: true })
  categoryId?: string | null;

  @ManyToOne(() => ProductType, { onDelete: 'SET NULL', nullable: true })
  productType?: ProductType | null;

  @ManyToOne(() => Category, { onDelete: 'SET NULL', nullable: true })
  category?: Category | null;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  brand?: string | null;

  @Column({ type: 'varchar', length: 24, default: 'draft' })
  status: ProductStatus;

  @Column({ type: 'jsonb', nullable: true })
  tags?: string[] | null;

  @Column({ length: 200 })
  slug: string;

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants?: ProductVariant[];

  @OneToMany(() => ProductImage, (image) => image.product)
  images?: ProductImage[];

  @OneToMany(() => ProductAttributeValue, (value) => value.product)
  attributes?: ProductAttributeValue[];
}
