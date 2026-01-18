import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckoutSession } from './entities/checkout-session.entity';
import { CheckoutConfirmDto } from './dto/checkout-confirm.dto';
import { CartsService } from '../carts/carts.service';
import { CustomersService } from '../customers/customers.service';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from '../payments/payments.service';
import { InventoryService } from '../inventory/inventory.service';
import { RequestContextService } from '../tenancy/request-context.service';

type StoreContext = { tenantId: string; storeId: string };

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(CheckoutSession)
    private readonly checkoutRepository: Repository<CheckoutSession>,
    private readonly cartsService: CartsService,
    private readonly customersService: CustomersService,
    private readonly ordersService: OrdersService,
    private readonly paymentsService: PaymentsService,
    private readonly inventoryService: InventoryService,
    private readonly requestContext: RequestContextService,
  ) {}

  async confirmCheckout(dto: CheckoutConfirmDto) {
    const context = this.getContext();
    const cart = await this.cartsService.getCart(dto.cartId);
    if (cart.status !== 'active') {
      throw new BadRequestException('Cart not active');
    }
    if (!cart.items?.length) {
      throw new BadRequestException('Cart is empty');
    }

    const customer = await this.customersService.findOrCreateCustomer(
      {
        fullName: dto.customer.fullName,
        email: dto.customer.email,
        phone: dto.customer.phone,
        documentId: dto.customer.documentId,
      },
      context,
    );

    await this.customersService.addAddress(customer.id, {
      address1: dto.shippingAddress.address1,
      address2: dto.shippingAddress.address2,
      city: dto.shippingAddress.city,
      state: dto.shippingAddress.state,
      zip: dto.shippingAddress.zip,
      country: dto.shippingAddress.country,
    });

    const shippingAddress: Record<string, unknown> = { ...dto.shippingAddress };
    const billingAddress: Record<string, unknown> | null = dto.billingAddress
      ? { ...dto.billingAddress }
      : null;

    const order = await this.ordersService.createOrderFromCart({
      context,
      cart,
      customerId: customer.id,
      shippingAddress,
      billingAddress,
      note: dto.notes,
    });

    await this.inventoryService.reserveStock({
      tenantId: context.tenantId,
      storeId: context.storeId,
      orderId: order.id,
      items: cart.items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      })),
    });

    const payment = await this.paymentsService.createPaymentIntent({
      orderId: order.id,
      amount: order.totalAmount,
      currency: order.currency,
      methodType: dto.paymentMethod ?? 'bank_transfer',
      context,
    });

    await this.cartsService.markCartConverted(cart.id);

    const checkout = this.checkoutRepository.create({
      tenantId: context.tenantId,
      storeId: context.storeId,
      cartId: cart.id,
      customerId: customer.id,
      status: 'awaiting_payment',
      shippingAddressJson: shippingAddress,
      billingAddressJson: billingAddress,
      totalsJson: {
        subtotal: order.subtotalAmount,
        shipping: order.shippingAmount,
        tax: order.taxAmount,
        discounts: order.discountAmount,
        total: order.totalAmount,
      },
      paymentMethod: dto.paymentMethod ?? 'bank_transfer',
    });
    await this.checkoutRepository.save(checkout);

    return {
      order,
      paymentIntent: payment.intent,
      paymentMethod: payment.method,
    };
  }

  private getContext(): StoreContext {
    const tenantId = this.requestContext.tenantId;
    const storeId = this.requestContext.storeId;
    if (!tenantId || !storeId) {
      throw new BadRequestException('Store context missing');
    }
    return { tenantId, storeId };
  }
}
