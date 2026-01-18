import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestContextService } from '../tenancy/request-context.service';
import { Cart } from '../carts/entities/cart.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderAddress } from './entities/order-address.entity';
import { OrderStatusEvent } from './entities/order-status-event.entity';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

type StoreContext = { tenantId: string; storeId: string };

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(OrderAddress)
    private readonly orderAddressRepository: Repository<OrderAddress>,
    @InjectRepository(OrderStatusEvent)
    private readonly statusEventRepository: Repository<OrderStatusEvent>,
    private readonly requestContext: RequestContextService,
  ) {}

  async createOrderFromCart(params: {
    context: StoreContext;
    cart: Cart;
    customerId?: string | null;
    shippingAddress: Record<string, unknown>;
    billingAddress?: Record<string, unknown> | null;
    note?: string;
  }) {
    if (!params.cart.items?.length) {
      throw new BadRequestException('Cart is empty');
    }

    const orderNumber = await this.nextOrderNumber(params.context);
    const subtotal = params.cart.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const total = subtotal;

    const order = this.orderRepository.create({
      tenantId: params.context.tenantId,
      storeId: params.context.storeId,
      orderNumber,
      customerId: params.customerId ?? null,
      customerNote: params.note ?? null,
      status: 'pending_payment',
      paymentStatus: 'pending',
      fulfillmentStatus: 'unfulfilled',
      currency: params.cart.currency,
      subtotalAmount: subtotal,
      discountAmount: 0,
      shippingAmount: 0,
      taxAmount: 0,
      totalAmount: total,
    });
    const savedOrder = await this.orderRepository.save(order);

    const items = params.cart.items.map((item) =>
      this.orderItemRepository.create({
        orderId: savedOrder.id,
        variantId: item.variantId,
        skuSnapshot: item.variant?.sku ?? null,
        titleSnapshot:
          item.titleSnapshot ?? item.variant?.product?.title ?? 'Item',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity,
      }),
    );
    await this.orderItemRepository.save(items);

    const addresses: OrderAddress[] = [];
    addresses.push(
      this.orderAddressRepository.create({
        orderId: savedOrder.id,
        type: 'shipping',
        addressJson: params.shippingAddress,
      }),
    );

    if (params.billingAddress) {
      addresses.push(
        this.orderAddressRepository.create({
          orderId: savedOrder.id,
          type: 'billing',
          addressJson: params.billingAddress,
        }),
      );
    }

    if (addresses.length) {
      await this.orderAddressRepository.save(addresses);
    }

    await this.statusEventRepository.save(
      this.statusEventRepository.create({
        orderId: savedOrder.id,
        fromStatus: null,
        toStatus: savedOrder.status,
        note: 'Order created',
      }),
    );

    return this.getOrder(savedOrder.id, params.context);
  }

  async listOrders(filters?: { status?: string }) {
    const context = this.getContext();
    return this.orderRepository.find({
      where: {
        tenantId: context.tenantId,
        storeId: context.storeId,
        ...(filters?.status ? { status: filters.status as any } : {}),
      },
      relations: { items: true, addresses: true, customer: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getOrder(orderId: string, contextOverride?: StoreContext) {
    const context = this.getContext(contextOverride);
    const order = await this.orderRepository.findOne({
      where: { id: orderId, tenantId: context.tenantId, storeId: context.storeId },
      relations: { items: true, addresses: true, customer: true, statusEvents: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async getOrderByNumber(orderNumber: number, email?: string) {
    const context = this.getContext();
    const order = await this.orderRepository.findOne({
      where: {
        orderNumber,
        tenantId: context.tenantId,
        storeId: context.storeId,
      },
      relations: { items: true, addresses: true, customer: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (email && order.customer?.email && order.customer.email !== email) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto, actorId?: string) {
    const context = this.getContext();
    const order = await this.orderRepository.findOne({
      where: { id: orderId, tenantId: context.tenantId, storeId: context.storeId },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const fromStatus = order.status;
    const updated = this.orderRepository.merge(order, {
      status: dto.status ?? order.status,
      paymentStatus: dto.paymentStatus ?? order.paymentStatus,
      fulfillmentStatus: dto.fulfillmentStatus ?? order.fulfillmentStatus,
    });

    const saved = await this.orderRepository.save(updated);

    if (dto.status && dto.status !== fromStatus) {
      await this.statusEventRepository.save(
        this.statusEventRepository.create({
          orderId: saved.id,
          fromStatus,
          toStatus: dto.status,
          note: dto.note ?? null,
          createdByUserId: actorId ?? null,
        }),
      );
    }

    return this.getOrder(saved.id);
  }

  async updateOrderPaymentStatus(orderId: string, paymentStatus: string, status?: string) {
    const context = this.getContext();
    const order = await this.orderRepository.findOne({
      where: { id: orderId, tenantId: context.tenantId, storeId: context.storeId },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    order.paymentStatus = paymentStatus as any;
    if (status) {
      order.status = status as any;
    }
    return this.orderRepository.save(order);
  }

  private async nextOrderNumber(context: StoreContext) {
    const lastOrder = await this.orderRepository.findOne({
      where: { tenantId: context.tenantId, storeId: context.storeId },
      order: { orderNumber: 'DESC' },
    });
    return lastOrder ? lastOrder.orderNumber + 1 : 1001;
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
