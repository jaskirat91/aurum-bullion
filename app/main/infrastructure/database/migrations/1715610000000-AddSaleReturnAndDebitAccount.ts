import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSaleReturnAndDebitAccount1715610000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create sale_return_vouchers table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sale_return_vouchers" (
        "voucherId" varchar PRIMARY KEY NOT NULL,
        "customerId" varchar NOT NULL,
        "totalGoldWeight" decimal(10,3),
        "totalAmount" decimal(18,2),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_sale_return_vouchers_voucher" FOREIGN KEY ("voucherId") REFERENCES "vouchers" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_sale_return_vouchers_customer" FOREIGN KEY ("customerId") REFERENCES "parties" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // 2. Create sale_return_voucher_items table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sale_return_voucher_items" (
        "id" varchar PRIMARY KEY NOT NULL,
        "voucherId" varchar NOT NULL,
        "productId" varchar NOT NULL,
        "netGoldWeight" decimal(14,3) NOT NULL DEFAULT (0),
        "goldPurity" decimal(6,3),
        "pureGoldWeight" decimal(14,3),
        "netAmount" decimal(12,2) NOT NULL DEFAULT (0),
        "amountPercentage" decimal(6,3),
        "soldAmount" decimal(12,2),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_sale_return_items_voucher" FOREIGN KEY ("voucherId") REFERENCES "sale_return_vouchers" ("voucherId") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_sale_return_items_product" FOREIGN KEY ("productId") REFERENCES "finished_products" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // 3. Add debitAccountId to material_transactions
    // We check if it exists first to prevent errors during dev synchronization
    const tableInfo = await queryRunner.query(`PRAGMA table_info(material_transactions)`);
    const hasColumn = tableInfo.some((col: any) => col.name === 'debitAccountId');
    
    if (!hasColumn) {
      await queryRunner.query(`ALTER TABLE "material_transactions" ADD COLUMN "debitAccountId" varchar`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "sale_return_voucher_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sale_return_vouchers"`);
    // Note: SQLite doesn't support DROP COLUMN easily, so we leave debitAccountId as is
  }
}
