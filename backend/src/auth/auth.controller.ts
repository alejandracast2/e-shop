import { Body, Controller, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { RequestCustomerEmailCodeDto } from './dto/request-customer-email-code.dto';
import { VerifyCustomerEmailCodeDto } from './dto/verify-customer-email-code.dto';
import { ResetCustomerPasswordDto } from './dto/reset-customer-password.dto';
import { GoogleCustomerLoginDto } from './dto/google-customer-login.dto';
import { UpdateCustomerProfileDto } from './dto/update-customer-profile.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

type AuthenticatedRequest = { user: { id: string } };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('customer/register')
  registerCustomer(@Body() dto: RegisterCustomerDto) {
    return this.authService.registerCustomer(dto);
  }

  @Post('customer/login')
  loginCustomer(@Body() loginDto: LoginDto) {
    return this.authService.loginCustomer(loginDto.email, loginDto.password);
  }

  @Post('customer/email-code/request')
  requestCustomerEmailCode(@Body() dto: RequestCustomerEmailCodeDto) {
    return this.authService.requestCustomerEmailCode(dto.email, dto.purpose);
  }

  @Post('customer/email-code/verify')
  verifyCustomerEmailCode(@Body() dto: VerifyCustomerEmailCodeDto) {
    return this.authService.verifyCustomerEmailCode(dto.email, dto.code);
  }

  @Post('customer/password/reset')
  resetCustomerPassword(@Body() dto: ResetCustomerPasswordDto) {
    return this.authService.resetCustomerPassword(dto.email, dto.code, dto.password);
  }

  @Post('customer/google')
  loginCustomerWithGoogle(@Body() dto: GoogleCustomerLoginDto) {
    return this.authService.loginCustomerWithGoogle(dto.credential);
  }

  @Patch('customer/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  updateCustomerProfile(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateCustomerProfileDto,
  ) {
    return this.authService.updateCustomerProfile(request.user.id, dto);
  }
}
