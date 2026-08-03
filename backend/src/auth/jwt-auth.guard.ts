import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { ExecutionContext } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(
    err: any,
    user: TUser,
    info: any,
    context: ExecutionContext,
  ): TUser {
    const authenticatedUser = super.handleRequest(err, user, info, context);
    const request = context.switchToHttp().getRequest();
    request.context = request.context ?? {};
    request.context.user = authenticatedUser;
    return authenticatedUser;
  }
}
