import { IsString, MinLength } from 'class-validator';

export class GoogleCustomerLoginDto {
  @IsString()
  @MinLength(20)
  credential: string;
}
