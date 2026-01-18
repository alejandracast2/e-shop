import { IsOptional } from 'class-validator';

export class UpdateStoreSettingsDto {
  @IsOptional()
  brandingJson?: Record<string, unknown>;

  @IsOptional()
  checkoutSettingsJson?: Record<string, unknown>;

  @IsOptional()
  paymentSettingsJson?: Record<string, unknown>;
}
