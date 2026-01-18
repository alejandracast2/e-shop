import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { TenancyService } from './tenancy.service';
import { RequestContextService } from './request-context.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpdateStoreSettingsDto } from './dto/update-store-settings.dto';

@Controller()
export class TenancyController {
  constructor(
    private readonly tenancyService: TenancyService,
    private readonly requestContext: RequestContextService,
  ) {}

  @Post('platform/tenants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin')
  createTenant(@Body() dto: CreateTenantDto) {
    return this.tenancyService.createTenant(dto);
  }

  @Get('platform/tenants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin')
  listTenants() {
    return this.tenancyService.listTenants();
  }

  @Post('platform/tenants/:tenantId/stores')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin')
  createStore(@Param('tenantId') tenantId: string, @Body() dto: CreateStoreDto) {
    return this.tenancyService.createStore(tenantId, dto);
  }

  @Get('platform/tenants/:tenantId/stores')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin')
  listStores(@Param('tenantId') tenantId: string) {
    return this.tenancyService.listStoresByTenant(tenantId);
  }

  @Get('admin/stores')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tenant_owner', 'store_admin')
  listStoresForTenant() {
    const tenantId = this.requestContext.tenantId;
    if (!tenantId) {
      return [];
    }
    return this.tenancyService.listStoresByTenant(tenantId);
  }

  @Patch('admin/stores/:storeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tenant_owner', 'store_admin')
  updateStore(@Param('storeId') storeId: string, @Body() dto: UpdateStoreDto) {
    return this.tenancyService.updateStore(storeId, dto);
  }

  @Get('admin/stores/:storeId/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tenant_owner', 'store_admin')
  getSettings(@Param('storeId') storeId: string) {
    return this.tenancyService.getStoreSettings(storeId);
  }

  @Patch('admin/stores/:storeId/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tenant_owner', 'store_admin')
  updateSettings(
    @Param('storeId') storeId: string,
    @Body() dto: UpdateStoreSettingsDto,
  ) {
    return this.tenancyService.updateStoreSettings(storeId, dto);
  }
}
