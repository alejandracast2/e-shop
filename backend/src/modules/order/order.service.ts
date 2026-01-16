import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Customer } from '../customer/entities/customer.entity';
import { Product } from '../product/entities/product.entity';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    if (!createOrderDto.items?.length) {
      throw new BadRequestException('Order must include at least one item');
    }

    return this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(Product);
      const customerRepo = manager.getRepository(Customer);
      const orderRepo = manager.getRepository(Order);

      const customer = await this.resolveCustomer(customerRepo, createOrderDto);

      const items: OrderItem[] = [];
      let subtotal = 0;

      for (const item of createOrderDto.items) {
        const product = await productRepo.findOne({
          where: { id: item.productId },
        });
        if (!product || !product.isActive) {
          throw new BadRequestException(
            `Product ${item.productId} is not available`,
          );
        }
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${product.name}`,
          );
        }

        product.stock -= item.quantity;
        await productRepo.save(product);

        const lineTotal = product.price * item.quantity;
        subtotal += lineTotal;

        items.push(
          this.orderItemRepository.create({
            product,
            quantity: item.quantity,
            unitPrice: product.price,
            lineTotal,
          }),
        );
      }

      const total = subtotal;

      const shipping = this.resolveShipping(customer, createOrderDto);
      if (
        !shipping.shippingAddressLine1 ||
        !shipping.shippingCity ||
        !shipping.shippingState ||
        !shipping.shippingPostalCode ||
        !shipping.shippingCountry
      ) {
        throw new BadRequestException('Shipping address is required');
      }

      const order = orderRepo.create({
        customer,
        items,
        currency: createOrderDto.currency ?? 'USD',
        subtotal,
        total,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        notes: createOrderDto.notes,
        ...shipping,
      });

      return orderRepo.save(order);
    });
  }

  async findAll(status?: OrderStatus) {
    const query = this.orderRepository.createQueryBuilder('order');
    query.leftJoinAndSelect('order.items', 'items');
    query.leftJoinAndSelect('items.product', 'product');
    query.leftJoinAndSelect('order.customer', 'customer');

    if (status) {
      query.andWhere('order.status = :status', { status });
    }

    return query.orderBy('order.createdAt', 'DESC').getMany();
  }

  async findOne(id: number) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: { items: { product: true }, customer: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {
    const order = await this.findOne(id);
    order.status = updateOrderDto.status ?? order.status;
    order.paymentStatus = updateOrderDto.paymentStatus ?? order.paymentStatus;
    order.notes = updateOrderDto.notes ?? order.notes;
    return this.orderRepository.save(order);
  }

  async remove(id: number) {
    const order = await this.findOne(id);
    if (order.status !== OrderStatus.CANCELED) {
      return this.dataSource.transaction(async (manager) => {
        const productRepo = manager.getRepository(Product);
        for (const item of order.items) {
          const product = await productRepo.findOne({
            where: { id: item.product.id },
          });
          if (product) {
            product.stock += item.quantity;
            await productRepo.save(product);
          }
        }
        order.status = OrderStatus.CANCELED;
        return manager.getRepository(Order).save(order);
      });
    }
    return order;
  }

  private async resolveCustomer(
    customerRepo: Repository<Customer>,
    dto: CreateOrderDto,
  ) {
    if (dto.customerId) {
      const customer = await customerRepo.findOne({
        where: { id: dto.customerId },
      });
      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
      return customer;
    }

    if (!dto.customer) {
      throw new BadRequestException('Customer details are required');
    }

    const existing = await customerRepo.findOne({
      where: { email: dto.customer.email },
    });

    if (existing) {
      const merged = customerRepo.merge(existing, dto.customer);
      return customerRepo.save(merged);
    }

    const created = customerRepo.create(dto.customer);
    return customerRepo.save(created);
  }

  private resolveShipping(customer: Customer, dto: CreateOrderDto) {
    return {
      shippingName:
        dto.shippingName ?? `${customer.firstName} ${customer.lastName}`,
      shippingEmail: dto.shippingEmail ?? customer.email,
      shippingPhone: dto.shippingPhone ?? customer.phone ?? null,
      shippingAddressLine1:
        dto.shippingAddressLine1 ?? customer.addressLine1 ?? '',
      shippingAddressLine2:
        dto.shippingAddressLine2 ?? customer.addressLine2 ?? null,
      shippingCity: dto.shippingCity ?? customer.city ?? '',
      shippingState: dto.shippingState ?? customer.state ?? '',
      shippingPostalCode: dto.shippingPostalCode ?? customer.postalCode ?? '',
      shippingCountry: dto.shippingCountry ?? customer.country ?? '',
    };
  }
}
