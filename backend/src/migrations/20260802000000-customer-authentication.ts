import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CustomerAuthentication20260802000000 implements MigrationInterface {
  name = 'CustomerAuthentication20260802000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('users', 'googleSubject'))) {
      await queryRunner.query(
        'ALTER TABLE "users" ADD "googleSubject" character varying(255)',
      );
    }
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_google_subject_unique',
        columnNames: ['googleSubject'],
        isUnique: true,
      }),
    );

    if (!(await queryRunner.hasColumn('customers', 'birthDate'))) {
      await queryRunner.query('ALTER TABLE "customers" ADD "birthDate" date');
    }
    if (!(await queryRunner.hasColumn('customers', 'ageConfirmedAt'))) {
      await queryRunner.query(
        'ALTER TABLE "customers" ADD "ageConfirmedAt" TIMESTAMP WITH TIME ZONE',
      );
    }
    if (!(await queryRunner.hasColumn('customers', 'ageConfirmationMethod'))) {
      await queryRunner.query(
        'ALTER TABLE "customers" ADD "ageConfirmationMethod" character varying(40)',
      );
    }
    await queryRunner.createIndex(
      'customers',
      new TableIndex({
        name: 'IDX_customers_store_user_unique',
        columnNames: ['storeId', 'userId'],
        isUnique: true,
      }),
    );

    if (!(await queryRunner.hasTable('customer_email_codes'))) {
      await queryRunner.createTable(
        new Table({
          name: 'customer_email_codes',
          columns: [
            { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
            { name: 'createdAt', type: 'timestamptz', default: 'now()' },
            { name: 'updatedAt', type: 'timestamptz', default: 'now()' },
            { name: 'deletedAt', type: 'timestamptz', isNullable: true },
            { name: 'tenantId', type: 'uuid' },
            { name: 'storeId', type: 'uuid' },
            { name: 'userId', type: 'uuid', isNullable: true },
            { name: 'email', type: 'varchar', length: '160' },
            { name: 'purpose', type: 'varchar', length: '24' },
            { name: 'codeHash', type: 'varchar', length: '120' },
            { name: 'expiresAt', type: 'timestamptz' },
            { name: 'consumedAt', type: 'timestamptz', isNullable: true },
            { name: 'attempts', type: 'int', default: '0' },
          ],
        }),
      );
    }
    await queryRunner.createIndex(
      'customer_email_codes',
      new TableIndex({
        name: 'IDX_customer_email_codes_lookup',
        columnNames: ['email', 'purpose', 'storeId', 'createdAt'],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('customer_email_codes')) {
      await queryRunner.dropTable('customer_email_codes');
    }

    const customerTable = await queryRunner.getTable('customers');
    if (customerTable?.indices.find((index) => index.name === 'IDX_customers_store_user_unique')) {
      await queryRunner.dropIndex('customers', 'IDX_customers_store_user_unique');
    }
    for (const column of ['ageConfirmationMethod', 'ageConfirmedAt', 'birthDate']) {
      if (await queryRunner.hasColumn('customers', column)) {
        await queryRunner.dropColumn('customers', column);
      }
    }

    const usersTable = await queryRunner.getTable('users');
    if (usersTable?.indices.find((index) => index.name === 'IDX_users_google_subject_unique')) {
      await queryRunner.dropIndex('users', 'IDX_users_google_subject_unique');
    }
    if (await queryRunner.hasColumn('users', 'googleSubject')) {
      await queryRunner.dropColumn('users', 'googleSubject');
    }
  }
}
