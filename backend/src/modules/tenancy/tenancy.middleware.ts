import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NextFunction, Request, Response } from 'express';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';

declare module 'express-serve-static-core' {
  interface Request {
    context?: {
      tenantId?: string;
      storeId?: string;
      user?: { id: string; email: string; roles?: Array<{ role: string; tenantId?: string; storeId?: string }> };
    };
  }
}

@Injectable()
export class TenancyMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    req.context = req.context ?? {};

    const storeIdHeader = req.header('x-store-id');
    const storeSlugHeader = req.header('x-store-slug');
    const host = req.headers.host?.split(':')[0] ?? '';
    const hostSlug = host.includes('.') ? host.split('.')[0] : undefined;
    const defaultSlug = process.env.DEFAULT_STORE_SLUG ?? 'default';

    let store: Store | null = null;

    if (storeIdHeader) {
      store = await this.storeRepository.findOne({ where: { id: storeIdHeader } });
    } else if (storeSlugHeader) {
      store = await this.storeRepository.findOne({ where: { slug: storeSlugHeader } });
    } else if (hostSlug && !['localhost', 'www'].includes(hostSlug)) {
      store = await this.storeRepository.findOne({ where: { slug: hostSlug } });
    }

    if (!store) {
      store = await this.storeRepository.findOne({ where: { slug: defaultSlug } });
    }

    if (store) {
      req.context.tenantId = store.tenantId;
      req.context.storeId = store.id;
    }

    next();
  }
}
