import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { RequestContextService } from '../tenancy/request-context.service';
import { Category } from './entities/category.entity';
import { AttributeDefinition } from './entities/attribute-definition.entity';
import { AttributeOption } from './entities/attribute-option.entity';
import { ProductType } from './entities/product-type.entity';
import { ProductTypeAttribute } from './entities/product-type-attribute.entity';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductAttributeValue } from './entities/product-attribute-value.entity';
import { VariantAttributeValue } from './entities/variant-attribute-value.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { CreateProductDto, CreateVariantDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { InventoryService } from '../inventory/inventory.service';

type StoreContext = { tenantId: string; storeId: string };

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(AttributeDefinition)
    private readonly attributeRepository: Repository<AttributeDefinition>,
    @InjectRepository(AttributeOption)
    private readonly attributeOptionRepository: Repository<AttributeOption>,
    @InjectRepository(ProductType)
    private readonly productTypeRepository: Repository<ProductType>,
    @InjectRepository(ProductTypeAttribute)
    private readonly productTypeAttributeRepository: Repository<ProductTypeAttribute>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductAttributeValue)
    private readonly productAttributeRepository: Repository<ProductAttributeValue>,
    @InjectRepository(VariantAttributeValue)
    private readonly variantAttributeRepository: Repository<VariantAttributeValue>,
    private readonly requestContext: RequestContextService,
    private readonly dataSource: DataSource,
    private readonly inventoryService: InventoryService,
  ) {}

  async createCategory(dto: CreateCategoryDto) {
    const { tenantId, storeId } = this.getContext();
    const category = this.categoryRepository.create({
      tenantId,
      storeId,
      name: dto.name,
      slug: dto.slug,
      parentId: dto.parentId ?? null,
      path: dto.path ?? null,
      position: dto.position ?? 0,
      isActive: true,
    });
    return this.categoryRepository.save(category);
  }

  async listCategories() {
    const { tenantId, storeId } = this.getContext();
    return this.categoryRepository.find({
      where: { tenantId, storeId },
      order: { position: 'ASC', name: 'ASC' },
    });
  }

  async updateCategory(categoryId: string, dto: UpdateCategoryDto) {
    const { tenantId, storeId } = this.getContext();
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, tenantId, storeId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const updated = this.categoryRepository.merge(category, {
      ...dto,
      parentId: dto.parentId ?? category.parentId,
      path: dto.path ?? category.path,
      position: dto.position ?? category.position,
      isActive: dto.isActive ?? category.isActive,
    });
    return this.categoryRepository.save(updated);
  }

  async listStorefrontCategories() {
    const { tenantId, storeId } = this.getContext();
    const categories = await this.categoryRepository.find({
      where: { tenantId, storeId },
      order: { position: 'ASC', name: 'ASC' },
    });

    type CategoryNode = Category & { children: CategoryNode[] };

    const byIdCategory = new Map<string, Category>();
    categories.forEach((category) => {
      byIdCategory.set(category.id, category);
    });

    const visibleCache = new Map<string, boolean>();
    const isVisible = (category: Category): boolean => {
      if (visibleCache.has(category.id)) {
        return visibleCache.get(category.id) ?? false;
      }
      if (category.isActive === false) {
        visibleCache.set(category.id, false);
        return false;
      }
      if (!category.parentId) {
        visibleCache.set(category.id, true);
        return true;
      }
      const parent = byIdCategory.get(category.parentId);
      if (!parent) {
        visibleCache.set(category.id, true);
        return true;
      }
      const visible = isVisible(parent);
      visibleCache.set(category.id, visible);
      return visible;
    };

    const visibleCategories = categories.filter((category) => isVisible(category));

    const byId = new Map<string, CategoryNode>();
    visibleCategories.forEach((category) => {
      byId.set(category.id, { ...category, children: [] });
    });

    const roots: CategoryNode[] = [];
    visibleCategories.forEach((category) => {
      const node = byId.get(category.id);
      if (!node) return;
      if (category.parentId) {
        const parent = byId.get(category.parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  async createAttribute(dto: CreateAttributeDto) {
    const { tenantId, storeId } = this.getContext();
    const attribute = this.attributeRepository.create({
      tenantId,
      storeId,
      code: dto.code,
      name: dto.name,
      type: dto.type,
      isVariantAxis: dto.isVariantAxis ?? false,
      isFilterable: dto.isFilterable ?? false,
      isRequired: dto.isRequired ?? false,
      unit: dto.unit ?? null,
    });

    const saved = await this.attributeRepository.save(attribute);
    if (dto.options?.length) {
      const options = dto.options.map((option) =>
        this.attributeOptionRepository.create({
          attributeDefinitionId: saved.id,
          value: option.value,
          sortOrder: option.sortOrder ?? 0,
        }),
      );
      await this.attributeOptionRepository.save(options);
    }

    return this.attributeRepository.findOne({
      where: { id: saved.id },
      relations: { options: true },
    });
  }

  async listAttributes() {
    const { tenantId, storeId } = this.getContext();
    return this.attributeRepository.find({
      where: { tenantId, storeId },
      relations: { options: true },
      order: { name: 'ASC' },
    });
  }

  async createProductType(dto: CreateProductTypeDto) {
    const { tenantId, storeId } = this.getContext();
    const productType = this.productTypeRepository.create({
      tenantId,
      storeId,
      name: dto.name,
    });
    const saved = await this.productTypeRepository.save(productType);

    if (dto.attributes?.length) {
      const rows = dto.attributes.map((attribute) =>
        this.productTypeAttributeRepository.create({
          productTypeId: saved.id,
          attributeDefinitionId: attribute.attributeDefinitionId,
          isRequired: attribute.isRequired ?? false,
          isVariantAxis: attribute.isVariantAxis ?? false,
        }),
      );
      await this.productTypeAttributeRepository.save(rows);
    }

    return this.productTypeRepository.findOne({
      where: { id: saved.id },
      relations: { attributes: { attributeDefinition: true } },
    });
  }

  async listProductTypes() {
    const { tenantId, storeId } = this.getContext();
    return this.productTypeRepository.find({
      where: { tenantId, storeId },
      relations: { attributes: { attributeDefinition: true } },
      order: { name: 'ASC' },
    });
  }

  async createProduct(dto: CreateProductDto) {
    const { tenantId, storeId } = this.getContext();
    return this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(Product);
      const product = productRepo.create({
        tenantId,
        storeId,
        title: dto.title,
        description: dto.description ?? null,
        brand: dto.brand ?? null,
        status: dto.status ?? 'draft',
        slug: dto.slug,
        categoryId: dto.categoryId ?? null,
        productTypeId: dto.productTypeId ?? null,
      });
      const savedProduct = await productRepo.save(product);

      if (dto.attributes?.length) {
        const productAttrs = dto.attributes.map((attr) =>
          manager.getRepository(ProductAttributeValue).create({
            productId: savedProduct.id,
            attributeDefinitionId: attr.attributeDefinitionId,
            valueOptionId: attr.valueOptionId ?? null,
            valueText: attr.valueText ?? null,
            valueNumber: attr.valueNumber ?? null,
            valueBool: attr.valueBool ?? null,
            valueDate: attr.valueDate ? new Date(attr.valueDate) : null,
          }),
        );
        await manager.getRepository(ProductAttributeValue).save(productAttrs);
      }

      if (dto.variants?.length) {
        for (const variantDto of dto.variants) {
          await this.createVariantInternal(manager, savedProduct.id, variantDto);
        }
      }

      return productRepo.findOne({
        where: { id: savedProduct.id },
        relations: {
          variants: { attributes: { attributeDefinition: true, valueOption: true } },
          attributes: { attributeDefinition: true, valueOption: true },
        },
      });
    });
  }

  async updateProduct(productId: string, dto: UpdateProductDto) {
    const { tenantId, storeId } = this.getContext();
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId, storeId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const { attributes, variants, ...patch } = dto;
    const updated = this.productRepository.merge(product, {
      ...patch,
      status: patch.status ?? product.status,
    });
    const saved = await this.productRepository.save(updated);

    if (attributes) {
      await this.productAttributeRepository.delete({ productId: saved.id });
      if (attributes.length) {
        const rows = attributes.map((attr) =>
          this.productAttributeRepository.create({
            productId: saved.id,
            attributeDefinitionId: attr.attributeDefinitionId,
            valueOptionId: attr.valueOptionId ?? null,
            valueText: attr.valueText ?? null,
            valueNumber: attr.valueNumber ?? null,
            valueBool: attr.valueBool ?? null,
            valueDate: attr.valueDate ? new Date(attr.valueDate) : null,
          }),
        );
        await this.productAttributeRepository.save(rows);
      }
    }

    if (variants) {
      await this.variantRepository.delete({ productId: saved.id });
      for (const variantDto of variants) {
        await this.createVariant(saved.id, variantDto);
      }
    }

    return this.getProductAdmin(saved.id);
  }

  async createVariant(productId: string, dto: CreateVariantDto) {
    const { tenantId, storeId } = this.getContext();
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId, storeId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.dataSource.transaction((manager) =>
      this.createVariantInternal(manager, product.id, dto),
    );
  }

  async updateVariant(variantId: string, dto: UpdateVariantDto) {
    const { tenantId, storeId } = this.getContext();
    const variant = await this.variantRepository.findOne({
      where: { id: variantId },
      relations: { product: true },
    });

    if (!variant || variant.product?.tenantId !== tenantId || variant.product?.storeId !== storeId) {
      throw new NotFoundException('Variant not found');
    }

    const updated = this.variantRepository.merge(variant, {
      sku: dto.sku ?? variant.sku,
      barcode: dto.barcode ?? variant.barcode,
      price: dto.price ?? variant.price,
      compareAtPrice: dto.compareAtPrice ?? variant.compareAtPrice,
      cost: dto.cost ?? variant.cost,
      weight: dto.weight ?? variant.weight,
      dimensionsJson: dto.dimensionsJson ?? variant.dimensionsJson,
      isActive: dto.isActive ?? variant.isActive,
    });

    const saved = await this.variantRepository.save(updated);

    if (dto.attributes) {
      await this.variantAttributeRepository.delete({ variantId: saved.id });
      if (dto.attributes.length) {
        const attrs = dto.attributes.map((attr) =>
          this.variantAttributeRepository.create({
            variantId: saved.id,
            attributeDefinitionId: attr.attributeDefinitionId,
            valueOptionId: attr.valueOptionId ?? null,
            valueText: attr.valueText ?? null,
          }),
        );
        await this.variantAttributeRepository.save(attrs);
      }
    }

    return this.variantRepository.findOne({
      where: { id: saved.id },
      relations: { attributes: { attributeDefinition: true, valueOption: true }, product: true },
    });
  }

  async listProductsAdmin() {
    const { tenantId, storeId } = this.getContext();
    const products = await this.productRepository.find({
      where: { tenantId, storeId },
      relations: {
        variants: { attributes: { attributeDefinition: true, valueOption: true } },
        category: true,
        images: { file: true },
      },
      order: { createdAt: 'DESC' },
    });
    await this.attachAvailability({ tenantId, storeId }, products);
    return products;
  }

  async getProductAdmin(productId: string) {
    const { tenantId, storeId } = this.getContext();
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId, storeId },
      relations: {
        variants: { attributes: { attributeDefinition: true, valueOption: true } },
        attributes: { attributeDefinition: true, valueOption: true },
        category: true,
        images: { file: true },
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    await this.attachAvailability({ tenantId, storeId }, [product]);
    return product;
  }

  async listStorefrontProducts(params: { search?: string; categoryId?: string }) {
    const { tenantId, storeId } = this.getContext();
    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variant')
      .leftJoinAndSelect('product.images', 'image')
      .leftJoinAndSelect('image.file', 'file')
      .where('product.tenantId = :tenantId', { tenantId })
      .andWhere('product.storeId = :storeId', { storeId })
      .andWhere('product.status = :status', { status: 'active' });

    if (params.search) {
      query.andWhere('product.title ILIKE :search', {
        search: `%${params.search}%`,
      });
    }

    if (params.categoryId) {
      query.andWhere('product.categoryId = :categoryId', {
        categoryId: params.categoryId,
      });
    }

    const products = await query.orderBy('product.createdAt', 'DESC').getMany();
    await this.attachAvailability({ tenantId, storeId }, products);
    return products;
  }

  async getStorefrontProductBySlug(slug: string) {
    const { tenantId, storeId } = this.getContext();
    const product = await this.productRepository.findOne({
      where: { tenantId, storeId, slug, status: 'active' },
      relations: {
        variants: { attributes: { attributeDefinition: true, valueOption: true } },
        attributes: { attributeDefinition: true, valueOption: true },
        category: true,
        images: { file: true },
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    await this.attachAvailability({ tenantId, storeId }, [product]);
    return product;
  }

  private getContext(): StoreContext {
    const tenantId = this.requestContext.tenantId;
    const storeId = this.requestContext.storeId;
    if (!tenantId || !storeId) {
      throw new BadRequestException('Store context missing');
    }
    return { tenantId, storeId };
  }

  private async createVariantInternal(
    manager: EntityManager,
    productId: string,
    dto: CreateVariantDto,
  ) {
    const variantRepo = manager.getRepository(ProductVariant);
    const attrRepo = manager.getRepository(VariantAttributeValue);
    const variant = variantRepo.create({
      productId,
      sku: dto.sku ?? null,
      barcode: dto.barcode ?? null,
      price: dto.price,
      compareAtPrice: dto.compareAtPrice ?? null,
      cost: dto.cost ?? null,
      weight: dto.weight ?? null,
      dimensionsJson: dto.dimensionsJson ?? null,
      isActive: dto.isActive ?? true,
    });
    const savedVariant = await variantRepo.save(variant);

    if (dto.attributes?.length) {
      const attrs = dto.attributes.map((attr) =>
        attrRepo.create({
          variantId: savedVariant.id,
          attributeDefinitionId: attr.attributeDefinitionId,
          valueOptionId: attr.valueOptionId ?? null,
          valueText: attr.valueText ?? null,
        }),
      );
      await attrRepo.save(attrs);
    }

    return variantRepo.findOne({
      where: { id: savedVariant.id },
      relations: { attributes: { attributeDefinition: true, valueOption: true } },
    });
  }

  private async attachAvailability(
    context: StoreContext,
    products: Product[],
  ) {
    const variantIds = products.flatMap((product) =>
      product.variants?.map((variant) => variant.id) ?? [],
    );
    if (!variantIds.length) return;

    const availability = await this.inventoryService.getAvailabilityByVariantIds(
      context,
      variantIds,
    );

    products.forEach((product) => {
      product.variants?.forEach((variant) => {
        (variant as ProductVariant & { availableStock?: number }).availableStock =
          availability[variant.id] ?? 0;
      });
    });
  }
}
