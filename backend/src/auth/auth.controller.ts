import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
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
import { CUSTOMER_SESSION_COOKIE } from './jwt.strategy';

type AuthenticatedRequest = { user: { id: string } };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setCustomerSession<T extends { accessToken: string }>(
    response: Response,
    session: T,
  ): Omit<T, 'accessToken'> {
    response.setHeader('Cache-Control', 'no-store');
    response.cookie(CUSTOMER_SESSION_COOKIE, session.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    const { accessToken: _accessToken, ...safeSession } = session;
    return safeSession;
  }

  private clearCustomerSession(response: Response) {
    response.setHeader('Cache-Control', 'no-store');
    response.clearCookie(CUSTOMER_SESSION_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('customer/register')
  async registerCustomer(
    @Body() dto: RegisterCustomerDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.setCustomerSession(response, await this.authService.registerCustomer(dto));
  }

  @Post('customer/login')
  async loginCustomer(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.setCustomerSession(
      response,
      await this.authService.loginCustomer(loginDto.email, loginDto.password),
    );
  }

  @Post('customer/email-code/request')
  requestCustomerEmailCode(@Body() dto: RequestCustomerEmailCodeDto) {
    return this.authService.requestCustomerEmailCode(dto.email, dto.purpose);
  }

  @Post('customer/email-code/verify')
  async verifyCustomerEmailCode(
    @Body() dto: VerifyCustomerEmailCodeDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.setCustomerSession(
      response,
      await this.authService.verifyCustomerEmailCode(dto.email, dto.code),
    );
  }

  @Post('customer/password/reset')
  resetCustomerPassword(@Body() dto: ResetCustomerPasswordDto) {
    return this.authService.resetCustomerPassword(dto.email, dto.code, dto.password);
  }

  @Post('customer/google')
  async loginCustomerWithGoogle(
    @Body() dto: GoogleCustomerLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.setCustomerSession(
      response,
      await this.authService.loginCustomerWithGoogle(dto.credential),
    );
  }

  @Get('customer/session')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  async getCustomerSession(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.setCustomerSession(
      response,
      await this.authService.getCustomerSession(request.user.id),
    );
  }

  @Get('customer/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  async getCustomerProfile(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Cache-Control', 'no-store');
    return this.authService.getCustomerProfile(request.user.id);
  }

  @Post('customer/logout')
  logoutCustomer(@Res({ passthrough: true }) response: Response) {
    this.clearCustomerSession(response);
    return { message: 'Session closed' };
  }

  @Patch('customer/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  async updateCustomerProfile(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateCustomerProfileDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.setCustomerSession(
      response,
      await this.authService.updateCustomerProfile(request.user.id, dto),
    );
  }
}
