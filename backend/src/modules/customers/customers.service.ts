import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestContextService } from '../tenancy/request-context.service';
import { Customer } from './entities/customer.entity';
import { CustomerAddress } from './entities/customer-address.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

type StoreContext = { tenantId: string; storeId: string };

export type CustomerAccountInput = CreateCustomerDto & {
  userId: string;
  birthDate?: string;
  ageConfirmedAt?: Date;
  ageConfirmationMethod?: string;
};

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

  async findOrCreateCustomerAccount(input: CustomerAccountInput, context?: StoreContext) {
    const { tenantId, storeId } = this.resolveContext(context);
    const existingByUser = await this.customerRepository.findOne({
      where: { tenantId, storeId, userId: input.userId },
    });
    const existingByEmail = await this.customerRepository.findOne({
      where: { tenantId, storeId, email: input.email },
    });
    const customer = existingByUser ?? existingByEmail;

    if (customer && customer.userId && customer.userId !== input.userId) {
      throw new ConflictException('The customer email is already linked to another account');
    }

    if (customer) {
      const merged = this.customerRepository.merge(customer, {
        userId: input.userId,
        fullName: input.fullName ?? customer.fullName,
        email: input.email ?? customer.email,
        phone: input.phone ?? customer.phone,
        documentId: input.documentId ?? customer.documentId,
        birthDate: input.birthDate ?? customer.birthDate,
        ageConfirmedAt: input.ageConfirmedAt ?? customer.ageConfirmedAt,
        ageConfirmationMethod:
          input.ageConfirmationMethod ?? customer.ageConfirmationMethod,
      });
      return this.customerRepository.save(merged);
    }

    return this.customerRepository.save(
      this.customerRepository.create({
        tenantId,
        storeId,
        userId: input.userId,
        fullName: input.fullName,
        email: input.email,
        phone: input.phone ?? null,
        documentId: input.documentId ?? null,
        birthDate: input.birthDate ?? null,
        ageConfirmedAt: input.ageConfirmedAt ?? null,
        ageConfirmationMethod: input.ageConfirmationMethod ?? null,
      }),
    );
  }

  async getCustomerForUser(userId: string, context?: StoreContext) {
    const { tenantId, storeId } = this.resolveContext(context);
    return this.customerRepository.findOne({
      where: { tenantId, storeId, userId },
      relations: { addresses: true },
    });
  }

  isCustomerOfLegalAge(customer: Customer) {
    if (!customer.ageConfirmedAt || !customer.birthDate) {
      return false;
    }

    const [year, month, day] = customer.birthDate.split('-').map(Number);
    if (!year || !month || !day) return false;

    const today = new Date();
    let age = today.getUTCFullYear() - year;
    const monthDifference = today.getUTCMonth() + 1 - month;
    const dayDifference = today.getUTCDate() - day;
    if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
      age -= 1;
    }
    return age >= 18;
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
