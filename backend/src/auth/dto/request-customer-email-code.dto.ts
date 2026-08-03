import { IsEmail, IsIn } from 'class-validator';
import type { CustomerEmailCodePurpose } from '../entities/customer-email-code.entity';

export class RequestCustomerEmailCodeDto {
  @IsEmail()
  email: string;

  @IsIn(['login', 'password_reset'])
  purpose: CustomerEmailCodePurpose;
}
