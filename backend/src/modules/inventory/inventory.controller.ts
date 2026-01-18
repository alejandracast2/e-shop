import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { InventoryService } from './inventory.service';
import { RequestContextService } from '../tenancy/request-context.service';
import { SetStockDto } from './dto/set-stock.dto';

@Controller('admin/inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('tenant_owner', 'store_admin')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly requestContext: RequestContextService,
  ) {}

  @Post('variants/:variantId/stock')
  setStock(@Param('variantId') variantId: string, @Body() dto: SetStockDto) {
    return this.inventoryService.setStock({
      tenantId: this.requestContext.tenantId!,
      storeId: this.requestContext.storeId!,
      variantId,
      onHand: dto.onHand,
      reason: 'Admin update',
    });
  }
}
