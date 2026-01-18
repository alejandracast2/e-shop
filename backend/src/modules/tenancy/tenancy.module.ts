import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './entities/store.entity';
import { StoreSettings } from './entities/store-settings.entity';
import { Tenant } from './entities/tenant.entity';
import { TenancyController } from './tenancy.controller';
import { TenancyService } from './tenancy.service';
import { TenancyMiddleware } from './tenancy.middleware';
import { RequestContextService } from './request-context.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Tenant, Store, StoreSettings])],
  controllers: [TenancyController],
  providers: [TenancyService, TenancyMiddleware, RequestContextService],
  exports: [RequestContextService],
})
export class TenancyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenancyMiddleware).forRoutes('*');
  }
}
