import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestContextService } from '../tenancy/request-context.service';
import { Customer } from './entities/customer.entity';
import { CustomerAddress } from './entities/customer-address.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

type StoreContext = { tenantId: string; storeId: string };

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(CustomerAddress)
    private readonly addressRepository: Repository<CustomerAddress>,
    private readonly requestContext: RequestContextService,
  ) {}

  async createCustomer(dto: CreateCustomerDto, context?: StoreContext) {
    const { tenantId, storeId } = this.resolveContext(context);
    const customer = this.customerRepository.create({
      tenantId,
      storeId,
      fullName: dto.fullName,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      documentId: dto.documentId ?? null,
    });
    return this.customerRepository.save(customer);
  }

  async findOrCreateCustomer(dto: CreateCustomerDto, context?: StoreContext) {
    const { tenantId, storeId } = this.resolveContext(context);
    if (dto.email) {
      const existing = await this.customerRepository.findOne({
        where: { tenantId, storeId, email: dto.email },
      });
      if (existing) {
        const merged = this.customerRepository.merge(existing, {
          fullName: dto.fullName ?? existing.fullName,
          phone: dto.phone ?? existing.phone,
          documentId: dto.documentId ?? existing.documentId,
        });
        return this.customerRepository.save(merged);
      }
    }
    return this.createCustomer(dto, { tenantId, storeId });
  }

  async addAddress(
    customerId: string,
    address: {
      address1: string;
      address2?: string;
      city: string;
      state: string;
      zip: string;
      country: string;
      label?: string;
    },
  ) {
    const customer = await this.customerRepository.findOne({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const existing = await this.addressRepository.findOne({
      where: { customerId, isDefault: true },
    });

    const addressEntity = this.addressRepository.create({
      customerId,
      address1: address.address1,
      address2: address.address2 ?? null,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
      label: address.label ?? null,
      isDefault: !existing,
    });

    return this.addressRepository.save(addressEntity);
  }

  async listCustomers() {
    const { tenantId, storeId } = this.resolveContext();
    return this.customerRepository.find({
      where: { tenantId, storeId },
      order: { createdAt: 'DESC' },
    });
  }

  async getCustomer(id: string) {
    const { tenantId, storeId } = this.resolveContext();
    const customer = await this.customerRepository.findOne({
      where: { id, tenantId, storeId },
      relations: { addresses: true },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async updateCustomer(id: string, dto: UpdateCustomerDto) {
    const { tenantId, storeId } = this.resolveContext();
    const customer = await this.customerRepository.findOne({
      where: { id, tenantId, storeId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    const updated = this.customerRepository.merge(customer, {
      fullName: dto.fullName ?? customer.fullName,
      email: dto.email ?? customer.email,
      phone: dto.phone ?? customer.phone,
      documentId: dto.documentId ?? customer.documentId,
    });
    return this.customerRepository.save(updated);
  }

  private resolveContext(context?: StoreContext): StoreContext {
    const tenantId = context?.tenantId ?? this.requestContext.tenantId;
    const storeId = context?.storeId ?? this.requestContext.storeId;
    if (!tenantId || !storeId) {
      throw new BadRequestException('Store context missing');
    }
    return { tenantId, storeId };
  }
}
