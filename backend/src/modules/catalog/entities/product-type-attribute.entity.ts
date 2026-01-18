import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { AttributeDefinition } from './attribute-definition.entity';
import { ProductType } from './product-type.entity';

@Entity('product_type_attributes')
export class ProductTypeAttribute extends BaseEntity {
  @Column({ type: 'uuid' })
  productTypeId: string;

  @Column({ type: 'uuid' })
  attributeDefinitionId: string;

  @Column({ default: false })
  isRequired: boolean;

  @Column({ default: false })
  isVariantAxis: boolean;

  @ManyToOne(() => ProductType, { onDelete: 'CASCADE' })
  productType: ProductType;

  @ManyToOne(() => AttributeDefinition, { onDelete: 'CASCADE' })
  attributeDefinition: AttributeDefinition;
}
