import { IsIn, IsOptional, IsString } from 'class-validator';
import type { StoreStatus } from '../entities/store.entity';

const STORE_STATUSES = ['active', 'inactive'] as const;

export class UpdateStoreDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(STORE_STATUSES)
  status?: StoreStatus;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  addressJson?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}
