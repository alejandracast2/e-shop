import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogService } from './catalog.service';
import { CatalogAdminController } from './catalog-admin.controller';
import { CatalogStorefrontController } from './catalog-storefront.controller';
import { Category } from './entities/category.entity';
import { AttributeDefinition } from './entities/attribute-definition.entity';
import { AttributeOption } from './entities/attribute-option.entity';
import { ProductType } from './entities/product-type.entity';
import { ProductTypeAttribute } from './entities/product-type-attribute.entity';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductAttributeValue } from './entities/product-attribute-value.entity';
import { VariantAttributeValue } from './entities/variant-attribute-value.entity';
import { ProductImage } from './entities/product-image.entity';
import { FileEntity } from './entities/file.entity';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category,
      AttributeDefinition,
      AttributeOption,
      ProductType,
      ProductTypeAttribute,
      Product,
      ProductVariant,
      ProductAttributeValue,
      VariantAttributeValue,
      ProductImage,
      FileEntity,
    ]),
    InventoryModule,
  ],
  controllers: [CatalogAdminController, CatalogStorefrontController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
