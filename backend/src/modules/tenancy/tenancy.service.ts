import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { Store } from './entities/store.entity';
import { StoreSettings } from './entities/store-settings.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpdateStoreSettingsDto } from './dto/update-store-settings.dto';

@Injectable()
export class TenancyService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(StoreSettings)
    private readonly storeSettingsRepository: Repository<StoreSettings>,
  ) {}

  async createTenant(dto: CreateTenantDto) {
    const tenant = this.tenantRepository.create({
      name: dto.name,
      ownerUserId: dto.ownerUserId ?? null,
      status: 'active',
    });
    return this.tenantRepository.save(tenant);
  }

  async listTenants() {
    return this.tenantRepository.find({ order: { createdAt: 'DESC' } });
  }

  async createStore(tenantId: string, dto: CreateStoreDto) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const store = this.storeRepository.create({
      tenantId: tenant.id,
      name: dto.name,
      slug: dto.slug,
      status: 'active',
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      addressJson: dto.addressJson ?? null,
      currency: dto.currency ?? 'USD',
      timezone: dto.timezone ?? 'UTC',
    });

    const saved = await this.storeRepository.save(store);
    await this.ensureSettings(saved.id);
    return saved;
  }

  async listStoresByTenant(tenantId: string) {
    return this.storeRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async listStoresForTenant(tenantId: string) {
    return this.listStoresByTenant(tenantId);
  }

  async updateStore(storeId: string, dto: UpdateStoreDto) {
    const store = await this.storeRepository.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    const updated = this.storeRepository.merge(store, dto);
    return this.storeRepository.save(updated);
  }

  async getStoreSettings(storeId: string) {
    await this.ensureSettings(storeId);
    return this.storeSettingsRepository.findOne({ where: { storeId } });
  }

  async updateStoreSettings(storeId: string, dto: UpdateStoreSettingsDto) {
    await this.ensureSettings(storeId);
    const settings = await this.storeSettingsRepository.findOne({ where: { storeId } });
    const updated = this.storeSettingsRepository.merge(settings!, dto);
    return this.storeSettingsRepository.save(updated);
  }

  private async ensureSettings(storeId: string) {
    const existing = await this.storeSettingsRepository.findOne({ where: { storeId } });
    if (!existing) {
      await this.storeSettingsRepository.save(
        this.storeSettingsRepository.create({ storeId }),
      );
    }
  }
}
