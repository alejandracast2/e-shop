import { IsIn, IsOptional, IsString } from 'class-validator';
import type { FulfillmentStatus, OrderStatus, PaymentStatus } from '../entities/order.entity';

const ORDER_STATUSES = [
  'pending_payment',
  'paid',
  'processing',
  'fulfilled',
  'cancelled',
  'refunded',
] as const;

const PAYMENT_STATUSES = ['unpaid', 'pending', 'paid', 'failed', 'refunded'] as const;

const FULFILLMENT_STATUSES = [
  'unfulfilled',
  'partial',
  'fulfilled',
  'shipped',
  'delivered',
] as const;

export class UpdateOrderStatusDto {
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: OrderStatus;

  @IsOptional()
  @IsIn(PAYMENT_STATUSES)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsIn(FULFILLMENT_STATUSES)
  fulfillmentStatus?: FulfillmentStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
