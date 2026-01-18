import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestContextService } from '../tenancy/request-context.service';
import { PaymentMethod } from './entities/payment-method.entity';
import { PaymentIntent } from './entities/payment-intent.entity';
import { PaymentProof } from './entities/payment-proof.entity';
import { FileEntity } from '../catalog/entities/file.entity';
import { OrdersService } from '../orders/orders.service';
import { InventoryService } from '../inventory/inventory.service';
import { SubmitPaymentProofDto } from './dto/submit-payment-proof.dto';

type StoreContext = { tenantId: string; storeId: string };

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
    @InjectRepository(PaymentIntent)
    private readonly paymentIntentRepository: Repository<PaymentIntent>,
    @InjectRepository(PaymentProof)
    private readonly paymentProofRepository: Repository<PaymentProof>,
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly ordersService: OrdersService,
    private readonly inventoryService: InventoryService,
    private readonly requestContext: RequestContextService,
  ) {}

  async listActiveMethods() {
    const context = this.getContext();
    return this.paymentMethodRepository.find({
      where: { tenantId: context.tenantId, storeId: context.storeId, isActive: true },
    });
  }

  async createPaymentIntent(params: {
    orderId: string;
    amount: number;
    currency: string;
    methodType?: string;
    context?: StoreContext;
  }) {
    const context = this.getContext(params.context);
    const methodType = params.methodType ?? 'bank_transfer';
    const method = await this.paymentMethodRepository.findOne({
      where: {
        tenantId: context.tenantId,
        storeId: context.storeId,
        type: methodType,
        isActive: true,
      },
    });
    if (!method) {
      throw new BadRequestException('Payment method not configured');
    }

    const referenceCode = this.buildReferenceCode(params.orderId);
    const intent = this.paymentIntentRepository.create({
      tenantId: context.tenantId,
      storeId: context.storeId,
      orderId: params.orderId,
      methodId: method.id,
      status: 'pending',
      amount: params.amount,
      currency: params.currency,
      referenceCode,
    });
    const saved = await this.paymentIntentRepository.save(intent);
    return { intent: saved, method };
  }

  async submitPaymentProof(intentId: string, dto: SubmitPaymentProofDto) {
    const context = this.getContext();
    const intent = await this.paymentIntentRepository.findOne({
      where: { id: intentId, tenantId: context.tenantId, storeId: context.storeId },
    });
    if (!intent) {
      throw new NotFoundException('Payment intent not found');
    }

    let fileId: string | null = null;
    if (dto.fileUrl) {
      const file = await this.fileRepository.save(
        this.fileRepository.create({
          tenantId: context.tenantId,
          storeId: context.storeId,
          provider: 'external',
          path: dto.fileUrl,
          url: dto.fileUrl,
        }),
      );
      fileId = file.id;
    }

    const proof = this.paymentProofRepository.create({
      paymentIntentId: intent.id,
      fileId,
      metadataJson: dto.metadata ?? null,
    });
    await this.paymentProofRepository.save(proof);

    intent.status = 'submitted';
    await this.paymentIntentRepository.save(intent);

    return { intentId: intent.id, status: intent.status };
  }

  async confirmPayment(intentId: string) {
    const context = this.getContext();
    const intent = await this.paymentIntentRepository.findOne({
      where: { id: intentId, tenantId: context.tenantId, storeId: context.storeId },
    });
    if (!intent) {
      throw new NotFoundException('Payment intent not found');
    }

    intent.status = 'confirmed';
    await this.paymentIntentRepository.save(intent);
    await this.ordersService.updateOrderStatus(intent.orderId, {
      status: 'processing',
      paymentStatus: 'paid',
    });
    await this.inventoryService.consumeReservations({
      tenantId: context.tenantId,
      storeId: context.storeId,
      orderId: intent.orderId,
    });

    return { intentId: intent.id, status: intent.status };
  }

  async rejectPayment(intentId: string) {
    const context = this.getContext();
    const intent = await this.paymentIntentRepository.findOne({
      where: { id: intentId, tenantId: context.tenantId, storeId: context.storeId },
    });
    if (!intent) {
      throw new NotFoundException('Payment intent not found');
    }

    intent.status = 'rejected';
    await this.paymentIntentRepository.save(intent);
    await this.ordersService.updateOrderStatus(intent.orderId, {
      status: 'pending_payment',
      paymentStatus: 'failed',
    });
    await this.inventoryService.releaseReservations({
      tenantId: context.tenantId,
      storeId: context.storeId,
      orderId: intent.orderId,
    });

    return { intentId: intent.id, status: intent.status };
  }

  async listPaymentIntents() {
    const context = this.getContext();
    return this.paymentIntentRepository.find({
      where: { tenantId: context.tenantId, storeId: context.storeId },
      order: { createdAt: 'DESC' },
    });
  }

  private buildReferenceCode(orderId: string) {
    return `REF-${orderId.slice(0, 6).toUpperCase()}`;
  }

  private getContext(context?: StoreContext): StoreContext {
    const tenantId = context?.tenantId ?? this.requestContext.tenantId;
    const storeId = context?.storeId ?? this.requestContext.storeId;
    if (!tenantId || !storeId) {
      throw new BadRequestException('Store context missing');
    }
    return { tenantId, storeId };
  }
}
