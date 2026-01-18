import { IsObject, IsOptional, IsString } from 'class-validator';

export class SubmitPaymentProofDto {
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
