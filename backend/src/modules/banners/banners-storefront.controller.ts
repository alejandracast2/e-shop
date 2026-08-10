import { Controller, Get } from '@nestjs/common';
import { BannersService } from './banners.service';

@Controller('storefront')
export class BannersStorefrontController {
  constructor(private readonly bannersService: BannersService) {}

  @Get('banners')
  list() {
    return this.bannersService.listStorefront();
  }
}
