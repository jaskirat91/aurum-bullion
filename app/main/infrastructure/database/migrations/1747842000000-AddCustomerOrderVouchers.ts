import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerOrderVouchers1747842000000 implements MigrationInterface {
  name = 'AddCustomerOrderVouchers1747842000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customer_order_vouchers" (
        "voucherId" varchar PRIMARY KEY NOT NULL,
        "orderType" varchar NOT NULL,
        "accountId" varchar NOT NULL,
        "itemId" varchar,
        "goldWeight" decimal(14,3),
        "goldRate" decimal(18,2),
        "amount" decimal(18,2),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_customer_order_vouchers_voucher" FOREIGN KEY ("voucherId") REFERENCES "vouchers" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_customer_order_vouchers_account" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_customer_order_vouchers_item" FOREIGN KEY ("itemId") REFERENCES "items" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "customer_order_vouchers"`);
  }
}
