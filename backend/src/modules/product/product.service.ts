import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Category } from './entities/category.entity';
import { Color } from './entities/color.entity';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Color)
    private readonly colorRepository: Repository<Color>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const { variants, stock, size, color, category, ...baseData } =
      createProductDto;

    const categoryEntity = category
      ? await this.resolveCategory(category)
      : undefined;

    const product = this.productRepository.create({
      ...baseData,
      category: categoryEntity,
      isActive: createProductDto.isActive ?? true,
    });

    const savedProduct = await this.productRepository.save(product);

    const variantPayloads =
      variants?.length
        ? variants
        : size || color || typeof stock === 'number'
          ? [
              {
                size: size ?? '',
                color: color ?? '',
                stock: stock ?? 0,
                sku: createProductDto.sku,
              },
            ]
          : [];

    if (!variantPayloads.length) {
      throw new BadRequestException(
        'Variants are required for clothing products',
      );
    }

    const preparedVariants: ProductVariant[] = [];
    let totalStock = 0;

    for (const variant of variantPayloads) {
      if (!variant.size || !variant.color) {
        throw new BadRequestException('Variant size and color are required');
      }
      const colorEntity = await this.resolveColor(
        variant.color,
        variant.colorHex,
      );
      preparedVariants.push(
        this.variantRepository.create({
          product: savedProduct,
          size: variant.size,
          color: colorEntity,
          stock: variant.stock,
          sku: variant.sku,
        }),
      );
      totalStock += variant.stock;
    }

    await this.variantRepository.save(preparedVariants);

    savedProduct.stock = totalStock;
    await this.productRepository.save(savedProduct);

    return this.findOne(savedProduct.id);
  }

  async findAll(params?: { active?: boolean; search?: string }) {
    const query = this.productRepository.createQueryBuilder('product');
    query.leftJoinAndSelect('product.variants', 'variant');
    query.leftJoinAndSelect('variant.color', 'color');
    query.leftJoinAndSelect('product.category', 'category');

    if (typeof params?.active === 'boolean') {
      query.andWhere('product.isActive = :active', { active: params.active });
    }

    if (params?.search) {
      query.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    const products = await query.orderBy('product.createdAt', 'DESC').getMany();
    return products.map((product) => ({
      ...product,
      stock:
        product.variants?.reduce((sum, variant) => sum + variant.stock, 0) ?? 0,
    }));
  }

  async findOne(id: number) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: { variants: { color: true }, category: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    const totalStock =
      product.variants?.reduce((sum, variant) => sum + variant.stock, 0) ?? 0;
    return { ...product, stock: totalStock };
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    const categoryEntity = updateProductDto.category
      ? await this.resolveCategory(updateProductDto.category)
      : product.category;
    const updated = this.productRepository.merge(product, {
      ...updateProductDto,
      category: categoryEntity,
    });
    return this.productRepository.save(updated);
  }

  async remove(id: number) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    product.isActive = false;
    return this.productRepository.save(product);
  }

  private async resolveCategory(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const existing = await this.categoryRepository.findOne({
      where: { name: trimmed },
    });
    if (existing) return existing;
    return this.categoryRepository.save(
      this.categoryRepository.create({ name: trimmed }),
    );
  }

  private async resolveColor(name: string, colorHex?: string) {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const existing = await this.colorRepository.findOne({
      where: { name: trimmed },
    });
    if (existing) return existing;
    return this.colorRepository.save(
      this.colorRepository.create({
        name: trimmed,
        hex: colorHex?.trim() || null,
      }),
    );
  }
}
