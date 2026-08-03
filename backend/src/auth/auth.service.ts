import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { UserService } from '../modules/user/user.service';
import { IamService } from '../modules/iam/iam.service';
import { CustomersService } from '../modules/customers/customers.service';
import { RequestContextService } from '../modules/tenancy/request-context.service';
import {
  CustomerEmailCode,
  CustomerEmailCodePurpose,
} from './entities/customer-email-code.entity';
import { CustomerEmailService } from './customer-email.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { UpdateCustomerProfileDto } from './dto/update-customer-profile.dto';

type StoreContext = { tenantId: string; storeId: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly iamService: IamService,
    private readonly customersService: CustomersService,
    private readonly requestContext: RequestContextService,
    private readonly configService: ConfigService,
    private readonly customerEmailService: CustomerEmailService,
    @InjectRepository(CustomerEmailCode)
    private readonly customerEmailCodeRepository: Repository<CustomerEmailCode>,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmailWithPassword(email);
    if (!user || !user.isActive) {
      return null;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return null;
    }

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createSession(user);
  }

  async registerCustomer(dto: RegisterCustomerDto) {
    const context = this.getStoreContext();
    const email = this.normalizeEmail(dto.email);
    this.assertAdultBirthDate(dto.birthDate, dto.confirmsAdultAge);

    const user = await this.userService.createCustomerUser({
      name: dto.name.trim(),
      email,
      password: dto.password,
      phone: dto.phone?.trim(),
    });
    await this.iamService.assignRoleToUser({
      userId: user.id,
      roleName: 'customer',
      tenantId: context.tenantId,
      storeId: context.storeId,
    });
    const customer = await this.customersService.findOrCreateCustomerAccount(
      {
        userId: user.id,
        fullName: user.name,
        email: user.email,
        phone: user.phone ?? undefined,
        birthDate: this.dateOnly(dto.birthDate),
        ageConfirmedAt: new Date(),
        ageConfirmationMethod: 'self_declared',
      },
      context,
    );

    return this.createSession(user, customer);
  }

  async loginCustomer(email: string, password: string) {
    const user = await this.validateUser(this.normalizeEmail(email), password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const customer = await this.ensureCustomerForCurrentStore(user);
    return this.createSession(user, customer);
  }

  async requestCustomerEmailCode(email: string, purpose: CustomerEmailCodePurpose) {
    const context = this.getStoreContext();
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.userService.findByEmail(normalizedEmail);
    // Do not disclose whether an account exists in a store.
    if (!user || !user.isActive) {
      return { message: 'Si existe una cuenta, enviaremos un código a ese correo.' };
    }

    const latestCode = await this.customerEmailCodeRepository.findOne({
      where: {
        email: normalizedEmail,
        purpose,
        tenantId: context.tenantId,
        storeId: context.storeId,
      },
      order: { createdAt: 'DESC' },
    });
    if (latestCode && latestCode.createdAt.getTime() > Date.now() - 60 * 1000) {
      return { message: 'Si existe una cuenta, enviaremos un código a ese correo.' };
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await this.customerEmailCodeRepository.save(
      this.customerEmailCodeRepository.create({
        tenantId: context.tenantId,
        storeId: context.storeId,
        userId: user.id,
        email: normalizedEmail,
        purpose,
        codeHash: await bcrypt.hash(code, 10),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
      }),
    );
    await this.customerEmailService.sendAccessCode({
      to: normalizedEmail,
      code,
      purpose,
    });

    return { message: 'Si existe una cuenta, enviaremos un código a ese correo.' };
  }

  async verifyCustomerEmailCode(email: string, code: string) {
    const context = this.getStoreContext();
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.userService.findByEmail(normalizedEmail);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid access code');
    }

    const customer = await this.ensureCustomerForCurrentStore(user, context);
    await this.consumeEmailCode({
      email: normalizedEmail,
      code,
      purpose: 'login',
      context,
    });
    return this.createSession(user, customer);
  }

  async resetCustomerPassword(email: string, code: string, password: string) {
    const context = this.getStoreContext();
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.userService.findByEmail(normalizedEmail);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid access code');
    }

    await this.consumeEmailCode({
      email: normalizedEmail,
      code,
      purpose: 'password_reset',
      context,
    });
    await this.userService.updateCustomerPassword(user.id, password);
    return { message: 'Password updated successfully' };
  }

  async loginCustomerWithGoogle(credential: string) {
    const context = this.getStoreContext();
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new ServiceUnavailableException('Google sign-in is not configured');
    }

    let payload:
      | { sub?: string; email?: string; email_verified?: boolean; name?: string }
      | undefined;
    try {
      const ticket = await new OAuth2Client(clientId).verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google credential');
    }
    if (!payload?.sub || !payload.email || !payload.email_verified) {
      throw new UnauthorizedException('Google account email is not verified');
    }

    const email = this.normalizeEmail(payload.email);
    let user = await this.userService.findByGoogleSubject(payload.sub);
    if (!user) {
      const userWithSameEmail = await this.userService.findByEmail(email);
      user = userWithSameEmail
        ? await this.userService.linkGoogleSubject(userWithSameEmail.id, payload.sub)
        : await this.userService.createCustomerUser({
            name: payload.name?.trim() || email.split('@')[0],
            email,
            password: randomBytes(32).toString('base64url'),
            googleSubject: payload.sub,
          });
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    await this.iamService.assignRoleToUser({
      userId: user.id,
      roleName: 'customer',
      tenantId: context.tenantId,
      storeId: context.storeId,
    });
    const customer = await this.customersService.findOrCreateCustomerAccount(
      {
        userId: user.id,
        fullName: user.name,
        email: user.email,
        phone: user.phone ?? undefined,
      },
      context,
    );

    return this.createSession(user, customer);
  }

  async updateCustomerProfile(userId: string, dto: UpdateCustomerProfileDto) {
    const context = this.getStoreContext();
    this.assertAdultBirthDate(dto.birthDate, true);
    const customer = await this.requireCustomerForCurrentStore(userId, context);
    const user = await this.userService.findUserById(userId);
    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const updatedCustomer = await this.customersService.findOrCreateCustomerAccount(
      {
        userId,
        fullName: dto.name?.trim() || customer.fullName,
        email: user.email,
        phone: dto.phone?.trim() || customer.phone || undefined,
        documentId: dto.documentId.trim(),
        birthDate: this.dateOnly(dto.birthDate),
        ageConfirmedAt: new Date(),
        ageConfirmationMethod: 'self_declared',
      },
      context,
    );
    return this.createSession(user, updatedCustomer);
  }

  private async createSession(user: {
    id: string;
    email: string;
    name: string;
    phone?: string | null;
    googleSubject?: string | null;
    isActive: boolean;
    passwordHash?: string;
  }, customer?: {
    id: string;
    fullName?: string;
    email?: string | null;
    phone?: string | null;
    documentId?: string | null;
    birthDate?: string | null;
    ageConfirmedAt?: Date | null;
  }) {
    await this.userService.updateLastLogin(user.id);
    const assignments = await this.iamService.listUserRoles(user.id);
    const roles = assignments.map((assignment) => ({
      role: assignment.role.name,
      tenantId: assignment.tenantId ?? undefined,
      storeId: assignment.storeId ?? undefined,
    }));
    const { passwordHash: _passwordHash, googleSubject: _googleSubject, ...safeUser } = user;
    const isAgeConfirmed = Boolean(
      customer?.ageConfirmedAt && customer.birthDate && this.isAdult(customer.birthDate),
    );

    const payload = { sub: user.id, email: user.email, roles };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: { ...safeUser, roles },
      customer: customer
        ? {
            id: customer.id,
            fullName: customer.fullName,
            email: customer.email ?? undefined,
            phone: customer.phone ?? undefined,
            documentId: customer.documentId ?? undefined,
            birthDate: customer.birthDate ?? undefined,
            isAgeConfirmed,
            isCheckoutProfileComplete: Boolean(isAgeConfirmed && customer.documentId),
          }
        : undefined,
      requiresAgeConfirmation: Boolean(customer && !isAgeConfirmed),
    };
  }

  private async consumeEmailCode(params: {
    email: string;
    code: string;
    purpose: CustomerEmailCodePurpose;
    context: StoreContext;
  }) {
    const emailCode = await this.customerEmailCodeRepository.findOne({
      where: {
        email: params.email,
        purpose: params.purpose,
        tenantId: params.context.tenantId,
        storeId: params.context.storeId,
        consumedAt: IsNull(),
      },
      order: { createdAt: 'DESC' },
    });
    if (!emailCode || emailCode.expiresAt <= new Date() || emailCode.attempts >= 5) {
      throw new UnauthorizedException('Invalid or expired access code');
    }

    const codeMatches = await bcrypt.compare(params.code, emailCode.codeHash);
    if (!codeMatches) {
      emailCode.attempts += 1;
      await this.customerEmailCodeRepository.save(emailCode);
      throw new UnauthorizedException('Invalid or expired access code');
    }

    emailCode.consumedAt = new Date();
    await this.customerEmailCodeRepository.save(emailCode);
  }

  private async requireCustomerForCurrentStore(userId: string, context = this.getStoreContext()) {
    const customer = await this.customersService.getCustomerForUser(userId, context);
    if (!customer) {
      throw new UnauthorizedException('Customer account is not available for this store');
    }
    return customer;
  }

  private async ensureCustomerForCurrentStore(
    user: { id: string; name: string; email: string; phone?: string | null },
    context = this.getStoreContext(),
  ) {
    const existingCustomer = await this.customersService.getCustomerForUser(user.id, context);
    if (existingCustomer) {
      return existingCustomer;
    }

    await this.iamService.assignRoleToUser({
      userId: user.id,
      roleName: 'customer',
      tenantId: context.tenantId,
      storeId: context.storeId,
    });
    return this.customersService.findOrCreateCustomerAccount(
      {
        userId: user.id,
        fullName: user.name,
        email: user.email,
        phone: user.phone ?? undefined,
      },
      context,
    );
  }

  private getStoreContext(): StoreContext {
    const tenantId = this.requestContext.tenantId;
    const storeId = this.requestContext.storeId;
    if (!tenantId || !storeId || !this.requestContext.isExplicitStoreContext) {
      throw new BadRequestException('A valid x-store-slug or x-store-id is required');
    }
    return { tenantId, storeId };
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private dateOnly(value: string) {
    return value.slice(0, 10);
  }

  private assertAdultBirthDate(birthDate: string, confirmsAdultAge: boolean) {
    if (!confirmsAdultAge || !this.isAdult(this.dateOnly(birthDate))) {
      throw new BadRequestException('You must be of legal drinking age to create an account');
    }
  }

  private isAdult(birthDate: string) {
    const [year, month, day] = birthDate.split('-').map(Number);
    if (!year || !month || !day) return false;
    const today = new Date();
    let age = today.getUTCFullYear() - year;
    const monthDifference = today.getUTCMonth() + 1 - month;
    const dayDifference = today.getUTCDate() - day;
    if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
      age -= 1;
    }
    return age >= 18;
  }
}
