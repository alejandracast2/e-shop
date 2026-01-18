import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Warehouse } from './entities/warehouse.entity';
import { InventoryLevel } from './entities/inventory-level.entity';
import { InventoryMovement, InventoryMovementType } from './entities/inventory-movement.entity';
import { InventoryReservation } from './entities/inventory-reservation.entity';

type StockContext = { tenantId: string; storeId: string };

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(InventoryLevel)
    private readonly levelRepository: Repository<InventoryLevel>,
    @InjectRepository(InventoryMovement)
    private readonly movementRepository: Repository<InventoryMovement>,
    @InjectRepository(InventoryReservation)
    private readonly reservationRepository: Repository<InventoryReservation>,
    private readonly dataSource: DataSource,
  ) {}

  async ensureDefaultWarehouse(context: StockContext) {
    const existing = await this.warehouseRepository.findOne({
      where: { tenantId: context.tenantId, storeId: context.storeId },
    });
    if (existing) return existing;

    return this.warehouseRepository.save(
      this.warehouseRepository.create({
        tenantId: context.tenantId,
        storeId: context.storeId,
        name: 'Main Warehouse',
      }),
    );
  }

  async getAvailabilityByVariantIds(context: StockContext, variantIds: string[]) {
    if (!variantIds.length) return {};
    const levels = await this.levelRepository.find({
      where: {
        storeId: context.storeId,
        tenantId: context.tenantId,
        variantId: In(variantIds),
      },
    });

    return levels.reduce<Record<string, number>>((acc, level) => {
      const available = level.onHand - level.reserved;
      acc[level.variantId] = (acc[level.variantId] ?? 0) + available;
      return acc;
    }, {});
  }

  async setStock(params: StockContext & { variantId: string; onHand: number; reason?: string }) {
    return this.dataSource.transaction(async (manager) => {
      const warehouse = await this.ensureDefaultWarehouse(params);
      const levelRepo = manager.getRepository(InventoryLevel);
      const movementRepo = manager.getRepository(InventoryMovement);

      let level = await levelRepo.findOne({
        where: { warehouseId: warehouse.id, variantId: params.variantId },
      });

      if (!level) {
        level = levelRepo.create({
          tenantId: params.tenantId,
          storeId: params.storeId,
          warehouseId: warehouse.id,
          variantId: params.variantId,
          onHand: 0,
          reserved: 0,
        });
      }

      const diff = params.onHand - level.onHand;
      level.onHand = params.onHand;
      await levelRepo.save(level);

      await movementRepo.save(
        movementRepo.create({
          tenantId: params.tenantId,
          storeId: params.storeId,
          warehouseId: warehouse.id,
          variantId: params.variantId,
          type: 'adjust',
          quantity: diff,
          reason: params.reason ?? 'Manual adjustment',
        }),
      );

      return level;
    });
  }

  async reserveStock(params: StockContext & { orderId?: string; cartId?: string; items: Array<{ variantId: string; quantity: number }> }) {
    if (!params.items.length) return [];
    return this.dataSource.transaction(async (manager) => {
      const warehouse = await this.ensureDefaultWarehouse(params);
      const levelRepo = manager.getRepository(InventoryLevel);
      const reservationRepo = manager.getRepository(InventoryReservation);
      const movementRepo = manager.getRepository(InventoryMovement);

      const reservations: InventoryReservation[] = [];

      for (const item of params.items) {
        let level = await levelRepo.findOne({
          where: { warehouseId: warehouse.id, variantId: item.variantId },
        });

        if (!level) {
          level = levelRepo.create({
            tenantId: params.tenantId,
            storeId: params.storeId,
            warehouseId: warehouse.id,
            variantId: item.variantId,
            onHand: 0,
            reserved: 0,
          });
        }

        const available = level.onHand - level.reserved;
        if (available < item.quantity) {
          throw new BadRequestException(`Insufficient stock for variant ${item.variantId}`);
        }

        level.reserved += item.quantity;
        await levelRepo.save(level);

        const reservation = reservationRepo.create({
          tenantId: params.tenantId,
          storeId: params.storeId,
          warehouseId: warehouse.id,
          variantId: item.variantId,
          orderId: params.orderId ?? null,
          cartId: params.cartId ?? null,
          quantity: item.quantity,
        });
        reservations.push(await reservationRepo.save(reservation));

        await movementRepo.save(
          movementRepo.create({
            tenantId: params.tenantId,
            storeId: params.storeId,
            warehouseId: warehouse.id,
            variantId: item.variantId,
            type: 'reserve',
            quantity: item.quantity,
            referenceType: params.orderId ? 'order' : 'cart',
            referenceId: params.orderId ?? params.cartId ?? null,
          }),
        );
      }

      return reservations;
    });
  }

  async consumeReservations(params: StockContext & { orderId: string }) {
    const reservations = await this.reservationRepository.find({
      where: {
        orderId: params.orderId,
        tenantId: params.tenantId,
        storeId: params.storeId,
      },
    });
    if (!reservations.length) return;

    await this.dataSource.transaction(async (manager) => {
      const levelRepo = manager.getRepository(InventoryLevel);
      const reservationRepo = manager.getRepository(InventoryReservation);
      const movementRepo = manager.getRepository(InventoryMovement);

      for (const reservation of reservations) {
        const level = await levelRepo.findOne({
          where: { warehouseId: reservation.warehouseId, variantId: reservation.variantId },
        });
        if (!level) continue;

        level.reserved = Math.max(0, level.reserved - reservation.quantity);
        level.onHand = Math.max(0, level.onHand - reservation.quantity);
        await levelRepo.save(level);

        await movementRepo.save(
          movementRepo.create({
            tenantId: params.tenantId,
            storeId: params.storeId,
            warehouseId: reservation.warehouseId,
            variantId: reservation.variantId,
            type: 'out',
            quantity: reservation.quantity,
            referenceType: 'order',
            referenceId: params.orderId,
          }),
        );

        await reservationRepo.remove(reservation);
      }
    });
  }

  async releaseReservations(params: StockContext & { orderId: string }) {
    const reservations = await this.reservationRepository.find({
      where: {
        orderId: params.orderId,
        tenantId: params.tenantId,
        storeId: params.storeId,
      },
    });
    if (!reservations.length) return;

    await this.dataSource.transaction(async (manager) => {
      const levelRepo = manager.getRepository(InventoryLevel);
      const reservationRepo = manager.getRepository(InventoryReservation);
      const movementRepo = manager.getRepository(InventoryMovement);

      for (const reservation of reservations) {
        const level = await levelRepo.findOne({
          where: { warehouseId: reservation.warehouseId, variantId: reservation.variantId },
        });
        if (!level) continue;

        level.reserved = Math.max(0, level.reserved - reservation.quantity);
        await levelRepo.save(level);

        await movementRepo.save(
          movementRepo.create({
            tenantId: params.tenantId,
            storeId: params.storeId,
            warehouseId: reservation.warehouseId,
            variantId: reservation.variantId,
            type: 'release',
            quantity: reservation.quantity,
            referenceType: 'order',
            referenceId: params.orderId,
          }),
        );

        await reservationRepo.remove(reservation);
      }
    });
  }

  async createMovement(params: StockContext & { variantId: string; warehouseId: string; type: InventoryMovementType; quantity: number; reason?: string }) {
    return this.movementRepository.save(
      this.movementRepository.create({
        tenantId: params.tenantId,
        storeId: params.storeId,
        warehouseId: params.warehouseId,
        variantId: params.variantId,
        type: params.type,
        quantity: params.quantity,
        reason: params.reason ?? null,
      }),
    );
  }
}
