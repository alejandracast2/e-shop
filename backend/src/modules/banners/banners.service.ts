import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestContextService } from '../tenancy/request-context.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { Banner } from './entities/banner.entity';

type StoreContext = {
  tenantId: string;
  storeId: string;
};

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner)
    private readonly bannerRepository: Repository<Banner>,
    private readonly requestContext: RequestContextService,
  ) {}

  async create(dto: CreateBannerDto) {
    const context = this.getContext();
    const banner = this.bannerRepository.create({
      ...this.toEntityValues(dto),
      tenantId: context.tenantId,
      storeId: context.storeId,
    });
    this.validateBanner(banner);
    return this.bannerRepository.save(banner);
  }

  async listAdmin() {
    const context = this.getContext();
    return this.bannerRepository.find({
      where: context,
      order: { position: 'ASC', createdAt: 'DESC' },
    });
  }

  async update(bannerId: string, dto: UpdateBannerDto) {
    const banner = await this.findInCurrentStore(bannerId);
    const updated = this.bannerRepository.merge(banner, this.toEntityValues(dto));
    this.validateBanner(updated);
    return this.bannerRepository.save(updated);
  }

  async remove(bannerId: string) {
    const banner = await this.findInCurrentStore(bannerId);
    await this.bannerRepository.softRemove(banner);
    return { deleted: true };
  }

  async listStorefront() {
    const context = this.getContext();
    const now = new Date();

    return this.bannerRepository
      .createQueryBuilder('banner')
      .where('banner.tenantId = :tenantId', { tenantId: context.tenantId })
      .andWhere('banner.storeId = :storeId', { storeId: context.storeId })
      .andWhere('banner.isActive = :isActive', { isActive: true })
      .andWhere('(banner.startsAt IS NULL OR banner.startsAt <= :now)', { now })
      .andWhere('(banner.endsAt IS NULL OR banner.endsAt > :now)', { now })
      .orderBy('banner.position', 'ASC')
      .addOrderBy('banner.createdAt', 'DESC')
      .getMany();
  }

  private async findInCurrentStore(bannerId: string) {
    const context = this.getContext();
    const banner = await this.bannerRepository.findOne({
      where: { id: bannerId, ...context },
    });
    if (!banner) {
      throw new NotFoundException('Banner not found');
    }
    return banner;
  }

  private getContext(): StoreContext {
    const tenantId = this.requestContext.tenantId;
    const storeId = this.requestContext.storeId;
    if (!tenantId || !storeId) {
      throw new BadRequestException('Store context missing');
    }
    return { tenantId, storeId };
  }

  private toEntityValues(dto: CreateBannerDto | UpdateBannerDto): Partial<Banner> {
    const { startsAt, endsAt, ...values } = dto;
    const data: Partial<Banner> = { ...values };

    if (startsAt !== undefined) {
      data.startsAt = startsAt ? new Date(startsAt) : null;
    }
    if (endsAt !== undefined) {
      data.endsAt = endsAt ? new Date(endsAt) : null;
    }

    return data;
  }

  private validateBanner(banner: Pick<Banner, 'ctaLabel' | 'ctaUrl' | 'startsAt' | 'endsAt'>) {
    if (Boolean(banner.ctaLabel) !== Boolean(banner.ctaUrl)) {
      throw new BadRequestException('CTA label and CTA URL must be provided together');
    }

    if (banner.startsAt && banner.endsAt && banner.endsAt <= banner.startsAt) {
      throw new BadRequestException('Banner end date must be after its start date');
    }
  }
}
