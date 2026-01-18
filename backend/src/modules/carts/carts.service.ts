import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RequestContextService } from '../tenancy/request-context.service';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { ProductVariant } from '../catalog/entities/product-variant.entity';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpsertCartItemsDto } from './dto/upsert-cart-items.dto';

type StoreContext = { tenantId: string; storeId: string };

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    private readonly requestContext: RequestContextService,
  ) {}

  async createCart(dto: CreateCartDto) {
    const context = this.getContext();

    if (dto.cartId) {
      const existing = await this.cartRepository.findOne({
        where: { id: dto.cartId, tenantId: context.tenantId, storeId: context.storeId },
        relations: { items: { variant: { product: true } } },
      });
      if (existing) {
        if (dto.items?.length) {
          await this.upsertItems({
            cartId: existing.id,
            items: dto.items,
          });
        }
        return this.getCart(existing.id);
      }
    }

    const cart = this.cartRepository.create({
      tenantId: context.tenantId,
      storeId: context.storeId,
      customerId: dto.customerId ?? null,
      currency: dto.currency ?? 'USD',
      status: 'active',
    });
    const saved = await this.cartRepository.save(cart);
    if (dto.items?.length) {
      await this.upsertItems({ cartId: saved.id, items: dto.items });
    }
    return this.getCart(saved.id);
  }

  async getCart(cartId: string) {
    const context = this.getContext();
    const cart = await this.cartRepository.findOne({
      where: { id: cartId, tenantId: context.tenantId, storeId: context.storeId },
      relations: { items: { variant: { product: true } } },
    });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }
    return cart;
  }

  async upsertItems(dto: UpsertCartItemsDto) {
    const context = this.getContext();
    const cart = await this.cartRepository.findOne({
      where: { id: dto.cartId, tenantId: context.tenantId, storeId: context.storeId },
    });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    if (!dto.items.length) {
      throw new BadRequestException('No items provided');
    }

    const variantIds = dto.items.map((item) => item.variantId);
    const variants = await this.variantRepository.find({
      where: { id: In(variantIds) },
      relations: { product: true },
    });
    const variantMap = new Map(variants.map((variant) => [variant.id, variant]));

    const existingItems = await this.cartItemRepository.find({
      where: { cartId: cart.id, variantId: In(variantIds) },
    });
    const existingMap = new Map(existingItems.map((item) => [item.variantId, item]));

    const toSave: CartItem[] = [];

    for (const item of dto.items) {
      const variant = variantMap.get(item.variantId);
      if (!variant) {
        throw new BadRequestException(`Variant not found: ${item.variantId}`);
      }

      const existing = existingMap.get(item.variantId);
      if (existing) {
        existing.quantity = item.quantity;
        existing.unitPrice = variant.price;
        existing.titleSnapshot = variant.product?.title ?? existing.titleSnapshot ?? null;
        toSave.push(existing);
      } else {
        toSave.push(
          this.cartItemRepository.create({
            cartId: cart.id,
            variantId: variant.id,
            quantity: item.quantity,
            unitPrice: variant.price,
            titleSnapshot: variant.product?.title ?? null,
          }),
        );
      }
    }

    await this.cartItemRepository.save(toSave);
    return this.getCart(cart.id);
  }

  async updateCartItem(cartItemId: string, quantity: number) {
    const context = this.getContext();
    const item = await this.cartItemRepository.findOne({
      where: { id: cartItemId },
      relations: { cart: true },
    });
    if (!item || item.cart.tenantId !== context.tenantId || item.cart.storeId !== context.storeId) {
      throw new NotFoundException('Cart item not found');
    }

    item.quantity = quantity;
    await this.cartItemRepository.save(item);
    return this.getCart(item.cartId);
  }

  async markCartConverted(cartId: string) {
    const context = this.getContext();
    const cart = await this.cartRepository.findOne({
      where: { id: cartId, tenantId: context.tenantId, storeId: context.storeId },
    });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }
    cart.status = 'converted';
    return this.cartRepository.save(cart);
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
