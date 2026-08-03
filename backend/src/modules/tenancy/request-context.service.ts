import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

export type RequestContextData = {
  tenantId?: string;
  storeId?: string;
  isExplicitStoreContext?: boolean;
  user?: { id: string; email: string; roles?: Array<{ role: string; tenantId?: string; storeId?: string }> };
};

@Injectable({ scope: Scope.REQUEST })
export class RequestContextService {
  constructor(@Inject(REQUEST) private readonly request: { context?: RequestContextData }) {}

  get tenantId() {
    return this.request.context?.tenantId;
  }

  get storeId() {
    return this.request.context?.storeId;
  }

  get isExplicitStoreContext() {
    return this.request.context?.isExplicitStoreContext ?? false;
  }

  get user() {
    return this.request.context?.user;
  }
}
