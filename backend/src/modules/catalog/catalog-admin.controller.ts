import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { CatalogService } from './catalog.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { CreateProductDto, CreateVariantDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('tenant_owner', 'store_admin', 'store_staff')
export class CatalogAdminController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalogService.createCategory(dto);
  }

  @Get('categories')
  listCategories() {
    return this.catalogService.listCategories();
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.catalogService.updateCategory(id, dto);
  }

  @Post('attributes')
  createAttribute(@Body() dto: CreateAttributeDto) {
    return this.catalogService.createAttribute(dto);
  }

  @Get('attributes')
  listAttributes() {
    return this.catalogService.listAttributes();
  }

  @Post('product-types')
  createProductType(@Body() dto: CreateProductTypeDto) {
    return this.catalogService.createProductType(dto);
  }

  @Get('product-types')
  listProductTypes() {
    return this.catalogService.listProductTypes();
  }

  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.catalogService.createProduct(dto);
  }

  @Get('products')
  listProducts() {
    return this.catalogService.listProductsAdmin();
  }

  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    return this.catalogService.getProductAdmin(id);
  }

  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.catalogService.updateProduct(id, dto);
  }

  @Post('products/:id/variants')
  createVariant(@Param('id') id: string, @Body() dto: CreateVariantDto) {
    return this.catalogService.createVariant(id, dto);
  }

  @Patch('variants/:id')
  updateVariant(@Param('id') id: string, @Body() dto: UpdateVariantDto) {
    return this.catalogService.updateVariant(id, dto);
  }
}
