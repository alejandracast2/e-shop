import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BannersAdminController } from './banners-admin.controller';
import { BannersStorefrontController } from './banners-storefront.controller';
import { BannersService } from './banners.service';
import { Banner } from './entities/banner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Banner])],
  controllers: [BannersAdminController, BannersStorefrontController],
  providers: [BannersService],
})
export class BannersModule {}
