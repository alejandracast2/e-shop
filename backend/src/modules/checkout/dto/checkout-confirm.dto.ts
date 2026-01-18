import { Type } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CheckoutCustomerDto {
  @IsString()
  fullName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  documentId?: string;
}

export class CheckoutAddressDto {
  @IsString()
  address1: string;

  @IsOptional()
  @IsString()
  address2?: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  zip: string;

  @IsString()
  country: string;
}

export class CheckoutConfirmDto {
  @IsString()
  cartId: string;

  @ValidateNested()
  @Type(() => CheckoutCustomerDto)
  customer: CheckoutCustomerDto;

  @ValidateNested()
  @Type(() => CheckoutAddressDto)
  shippingAddress: CheckoutAddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CheckoutAddressDto)
  billingAddress?: CheckoutAddressDto;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
