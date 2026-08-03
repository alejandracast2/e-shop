import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class CustomerEmailService {
  private readonly logger = new Logger(CustomerEmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendAccessCode(params: {
    to: string;
    code: string;
    purpose: 'login' | 'password_reset';
  }) {
    const host = this.configService.get<string>('SMTP_HOST');
    const from = this.configService.get<string>('SMTP_FROM', 'no-reply@eshop.local');
    const subject =
      params.purpose === 'login'
        ? 'Tu código de acceso'
        : 'Restablece tu contraseña';
    const text = `Tu código es ${params.code}. Vence en 10 minutos.`;

    if (!host) {
      if (this.configService.get<string>('NODE_ENV') === 'production') {
        throw new Error('SMTP_HOST must be configured to send customer access codes');
      }

      this.logger.warn(`SMTP is not configured. Access code for ${params.to}: ${params.code}`);
      return;
    }

    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      ...(user && pass ? { auth: { user, pass } } : {}),
    });

    await transporter.sendMail({
      from,
      to: params.to,
      subject,
      text,
    });
  }
}
