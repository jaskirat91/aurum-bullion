import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCashVouchers1747900000000 implements MigrationInterface {
  name = 'AddCashVouchers1747900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cash_vouchers" (
        "voucherId" varchar PRIMARY KEY NOT NULL,
        "partyAccountId" varchar NOT NULL,
        "accountId" varchar NOT NULL,
        "receiptAmount" decimal(18,2),
        "paymentAmount" decimal(18,2),
        "goldRate" decimal(18,2),
        "goldWeight" decimal(14,3),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_cash_vouchers_voucher" FOREIGN KEY ("voucherId") REFERENCES "vouchers" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_cash_vouchers_party_account" FOREIGN KEY ("partyAccountId") REFERENCES "accounts" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_cash_vouchers_account" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "cash_vouchers"`);
  }
}
