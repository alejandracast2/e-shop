import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from '../iam/entities/role.entity';
import { UserRole } from '../iam/entities/user-role.entity';
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
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
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
    const tenants = await this.tenantRepository.find({ order: { createdAt: 'DESC' } });
    const missingOwnerTenantIds = tenants
      .filter((tenant) => !tenant.ownerUserId)
      .map((tenant) => tenant.id);

    if (!missingOwnerTenantIds.length) {
      return tenants;
    }

    const inferredOwners = await this.findInferredOwners(missingOwnerTenantIds);
    return tenants.map((tenant) => ({
      ...tenant,
      ownerUserId: tenant.ownerUserId ?? inferredOwners.get(tenant.id) ?? null,
    }));
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

  private async findInferredOwners(tenantIds: string[]) {
    const role = await this.roleRepository.findOne({ where: { name: 'tenant_owner' } });
    if (!role || !tenantIds.length) {
      return new Map<string, string>();
    }

    const assignments = await this.userRoleRepository.find({
      where: {
        roleId: role.id,
        tenantId: In(tenantIds),
      },
      order: { createdAt: 'ASC' },
    });

    const ownersByTenant = new Map<string, Set<string>>();
    for (const assignment of assignments) {
      if (!assignment.tenantId) {
        continue;
      }

      const current = ownersByTenant.get(assignment.tenantId) ?? new Set<string>();
      current.add(assignment.userId);
      ownersByTenant.set(assignment.tenantId, current);
    }

    const inferredOwners = new Map<string, string>();
    for (const [tenantId, userIds] of ownersByTenant.entries()) {
      if (userIds.size === 1) {
        inferredOwners.set(tenantId, Array.from(userIds)[0]);
      }
    }

    return inferredOwners;
  }
}
