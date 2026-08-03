import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { StringValue } from 'ms';
import { UserModule } from '../modules/user/user.module';
import { IamModule } from '../modules/iam/iam.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { CustomersModule } from '../modules/customers/customers.module';
import { CustomerEmailCode } from './entities/customer-email-code.entity';
import { CustomerEmailService } from './customer-email.service';

@Module({
  imports: [
    ConfigModule,
    UserModule,
    IamModule,
    CustomersModule,
    TypeOrmModule.forFeature([CustomerEmailCode]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const rawExpiresIn = configService.get<string>('JWT_EXPIRES_IN', '8h');
        const expiresIn = /^\d+$/.test(rawExpiresIn)
          ? Number(rawExpiresIn)
          : (rawExpiresIn as StringValue);

        return {
          secret: configService.get<string>('JWT_SECRET', 'dev-secret'),
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, CustomerEmailService],
  exports: [AuthService],
})
export class AuthModule {}
