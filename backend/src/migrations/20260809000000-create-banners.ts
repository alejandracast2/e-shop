import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateBanners20260809000000 implements MigrationInterface {
  name = 'CreateBanners20260809000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('banners')) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'banners',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'createdAt', type: 'timestamptz', default: 'now()' },
          { name: 'updatedAt', type: 'timestamptz', default: 'now()' },
          { name: 'deletedAt', type: 'timestamptz', isNullable: true },
          { name: 'tenantId', type: 'uuid' },
          { name: 'storeId', type: 'uuid' },
          { name: 'title', type: 'varchar', length: '160' },
          { name: 'subtitle', type: 'text', isNullable: true },
          { name: 'imageUrl', type: 'varchar', length: '2048' },
          { name: 'mobileImageUrl', type: 'varchar', length: '2048', isNullable: true },
          { name: 'ctaLabel', type: 'varchar', length: '80', isNullable: true },
          { name: 'ctaUrl', type: 'varchar', length: '2048', isNullable: true },
          { name: 'altText', type: 'varchar', length: '240', isNullable: true },
          { name: 'position', type: 'int', default: '0' },
          { name: 'isActive', type: 'boolean', default: 'true' },
          { name: 'startsAt', type: 'timestamptz', isNullable: true },
          { name: 'endsAt', type: 'timestamptz', isNullable: true },
        ],
      }),
    );

    await queryRunner.createIndex(
      'banners',
      new TableIndex({
        name: 'IDX_banners_store_position',
        columnNames: ['storeId', 'position'],
      }),
    );
    await queryRunner.createIndex(
      'banners',
      new TableIndex({
        name: 'IDX_banners_tenant_store_active',
        columnNames: ['tenantId', 'storeId', 'isActive'],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('banners')) {
      await queryRunner.dropTable('banners');
    }
  }
}
