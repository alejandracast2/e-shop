import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const product = this.productRepository.create({
      ...createProductDto,
      isActive: createProductDto.isActive ?? true,
    });
    return this.productRepository.save(product);
  }

  async findAll(params?: { active?: boolean; search?: string }) {
    const query = this.productRepository.createQueryBuilder('product');

    if (typeof params?.active === 'boolean') {
      query.andWhere('product.isActive = :active', { active: params.active });
    }

    if (params?.search) {
      query.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    return query.orderBy('product.createdAt', 'DESC').getMany();
  }

  async findOne(id: number) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);
    const updated = this.productRepository.merge(product, updateProductDto);
    return this.productRepository.save(updated);
  }

  async remove(id: number) {
    const product = await this.findOne(id);
    product.isActive = false;
    return this.productRepository.save(product);
  }
}
