import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { FileEntity } from './file.entity';
import { Product } from './product.entity';

@Entity('product_images')
export class ProductImage extends BaseEntity {
  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'uuid' })
  fileId: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: false })
  isCover: boolean;

  @ManyToOne(() => Product, (product) => product.images, { onDelete: 'CASCADE' })
  product: Product;

  @ManyToOne(() => FileEntity, { onDelete: 'CASCADE' })
  file: FileEntity;
}
