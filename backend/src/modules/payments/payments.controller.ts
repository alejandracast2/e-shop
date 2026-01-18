import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { PaymentsService } from './payments.service';
import { SubmitPaymentProofDto } from './dto/submit-payment-proof.dto';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('storefront/payments/methods')
  listMethods() {
    return this.paymentsService.listActiveMethods();
  }

  @Post('storefront/payments/:intentId/proof')
  submitProof(@Param('intentId') intentId: string, @Body() dto: SubmitPaymentProofDto) {
    return this.paymentsService.submitPaymentProof(intentId, dto);
  }

  @Get('admin/payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tenant_owner', 'store_admin', 'store_staff')
  listPaymentIntents() {
    return this.paymentsService.listPaymentIntents();
  }

  @Post('admin/payments/:intentId/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tenant_owner', 'store_admin')
  confirmPayment(@Param('intentId') intentId: string) {
    return this.paymentsService.confirmPayment(intentId);
  }

  @Post('admin/payments/:intentId/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tenant_owner', 'store_admin')
  rejectPayment(@Param('intentId') intentId: string) {
    return this.paymentsService.rejectPayment(intentId);
  }
}
