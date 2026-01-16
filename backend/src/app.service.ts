import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'e-shop-api',
      timestamp: new Date().toISOString(),
    };
  }
}
