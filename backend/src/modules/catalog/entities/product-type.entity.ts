import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { ProductTypeAttribute } from './product-type-attribute.entity';

@Entity('product_types')
@Index(['storeId', 'name'], { unique: true })
export class ProductType extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ length: 160 })
  name: string;

  @OneToMany(() => ProductTypeAttribute, (attr) => attr.productType)
  attributes?: ProductTypeAttribute[];
}
