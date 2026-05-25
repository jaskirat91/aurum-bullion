import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVoucherModules1715086800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create gold_vouchers table if not exists
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "gold_vouchers" (
        "voucherId" varchar PRIMARY KEY NOT NULL,
        "partyAccountId" varchar NOT NULL,
        "receiptGold" decimal(14,3),
        "issueGold" decimal(14,3),
        "receiptAmount" decimal(18,2),
        "issueAmount" decimal(18,2),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_gold_vouchers_voucher" FOREIGN KEY ("voucherId") REFERENCES "vouchers" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_gold_vouchers_party" FOREIGN KEY ("partyAccountId") REFERENCES "accounts" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "gold_vouchers"`);
  }
}
