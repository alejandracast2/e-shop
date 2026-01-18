import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { AttributeDefinition } from './attribute-definition.entity';
import { AttributeOption } from './attribute-option.entity';
import { Product } from './product.entity';

@Entity('product_attribute_values')
@Index(['productId', 'attributeDefinitionId'], { unique: true })
export class ProductAttributeValue extends BaseEntity {
  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'uuid' })
  attributeDefinitionId: string;

  @Column({ type: 'uuid', nullable: true })
  valueOptionId?: string | null;

  @Column({ type: 'text', nullable: true })
  valueText?: string | null;

  @Column({ type: 'numeric', nullable: true })
  valueNumber?: number | null;

  @Column({ type: 'boolean', nullable: true })
  valueBool?: boolean | null;

  @Column({ type: 'timestamptz', nullable: true })
  valueDate?: Date | null;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  product: Product;

  @ManyToOne(() => AttributeDefinition, { onDelete: 'CASCADE' })
  attributeDefinition: AttributeDefinition;

  @ManyToOne(() => AttributeOption, { onDelete: 'SET NULL', nullable: true })
  valueOption?: AttributeOption | null;
}
