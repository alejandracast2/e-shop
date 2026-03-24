import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('storefront')
export class CatalogStorefrontController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('categories')
  listCategories() {
    return this.catalogService.listStorefrontCategories();
  }

  @Get('products')
  listProducts(
    @Query('search') search?: string,
    @Query('category') categoryId?: string,
  ) {
    return this.catalogService.listStorefrontProducts({ search, categoryId });
  }

  @Get('products/:slug')
  getProduct(@Param('slug') slug: string) {
    return this.catalogService.getStorefrontProductBySlug(slug);
  }
}
