import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

export const CUSTOMER_SESSION_COOKIE = 'customer_session';

function extractCustomerSessionCookie(request: Request): string | null {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return null;

  const cookie = cookieHeader
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${CUSTOMER_SESSION_COOKIE}=`));

  if (!cookie) return null;

  try {
    return decodeURIComponent(cookie.slice(CUSTOMER_SESSION_COOKIE.length + 1));
  } catch {
    return null;
  }
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      // Bearer support is kept for existing admin/API clients. Storefront sessions
      // use the HttpOnly cookie, which browser JavaScript cannot read.
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        extractCustomerSessionCookie,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'dev-secret'),
    });
  }

  validate(payload: {
    sub: string;
    email: string;
    roles?: Array<{ role: string; tenantId?: string; storeId?: string }>;
  }) {
    return { id: payload.sub, email: payload.email, roles: payload.roles ?? [] };
  }
}
