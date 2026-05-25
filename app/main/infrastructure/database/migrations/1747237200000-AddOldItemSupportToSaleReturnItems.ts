import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds support for "old items" in sale_return_voucher_items:
 *  - productId becomes nullable (items not in the system have no productId)
 *  - isOldItem flag to distinguish old items from system items
 *  - oldItemName / oldItemTag for display of old items
 *
 * SQLite does not support ALTER COLUMN, so we use the standard
 * rename-recreate-copy-drop pattern.
 */
export class AddOldItemSupportToSaleReturnItems1747237200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Check which new columns already exist (dev synchronize may have added them)
    const tableInfo = await queryRunner.query(`PRAGMA table_info(sale_return_voucher_items)`);
    const cols = tableInfo.map((c: any) => c.name as string);

    const hasIsOldItem  = cols.includes('isOldItem');
    const hasOldName    = cols.includes('oldItemName');
    const hasOldTag     = cols.includes('oldItemTag');

    // 2. If the table already has the new columns the schema is up-to-date;
    //    we only need to make productId nullable via rename-recreate when it is NOT yet nullable.
    //    We detect this by checking SQLite's notnull flag for productId.
    const productIdInfo = tableInfo.find((c: any) => c.name === 'productId');
    const productIdIsNullable = productIdInfo ? productIdInfo.notnull === 0 : true;

    // 3. Add the flag columns and tag specs if missing
    if (!hasIsOldItem) {
      await queryRunner.query(
        `ALTER TABLE "sale_return_voucher_items" ADD COLUMN "isOldItem" boolean NOT NULL DEFAULT 0`,
      );
    }
    if (!hasOldName) {
      await queryRunner.query(
        `ALTER TABLE "sale_return_voucher_items" ADD COLUMN "oldItemName" varchar`,
      );
    }
    if (!hasOldTag) {
      await queryRunner.query(
        `ALTER TABLE "sale_return_voucher_items" ADD COLUMN "oldItemTag" varchar`,
      );
    }
    
    // Add tag specs
    const tagSpecs = [
      { name: 'tagGrossWeight', type: 'decimal(14,3)' },
      { name: 'tagKundanWeight', type: 'decimal(14,3)' },
      { name: 'tagStoneWeight', type: 'decimal(14,3)' },
      { name: 'tagMottiWeight', type: 'decimal(14,3)' },
      { name: 'tagNetWeight', type: 'decimal(14,3)' },
      { name: 'tagAmount', type: 'decimal(14,2)' },
    ];

    for (const spec of tagSpecs) {
      if (!cols.includes(spec.name)) {
        await queryRunner.query(
          `ALTER TABLE "sale_return_voucher_items" ADD COLUMN "${spec.name}" ${spec.type}`,
        );
      }
    }

    // 4. If productId is still NOT NULL we need to recreate the table to make it nullable.
    if (!productIdIsNullable) {
      // Disable foreign keys during the operation
      await queryRunner.query(`PRAGMA foreign_keys = OFF`);

      await queryRunner.query(`
        CREATE TABLE "sale_return_voucher_items_new" (
          "id"               varchar PRIMARY KEY NOT NULL,
          "voucherId"        varchar NOT NULL,
          "productId"        varchar,
          "isOldItem"        boolean NOT NULL DEFAULT 0,
          "oldItemName"      varchar,
          "oldItemTag"       varchar,
          "tagGrossWeight"    decimal(14,3),
          "tagKundanWeight"   decimal(14,3),
          "tagStoneWeight"    decimal(14,3),
          "tagMottiWeight"    decimal(14,3),
          "tagNetWeight"      decimal(14,3),
          "tagAmount"         decimal(14,2),
          "netGoldWeight"    decimal(14,3) NOT NULL DEFAULT (0),
          "goldPurity"       decimal(6,3),
          "pureGoldWeight"   decimal(14,3),
          "netAmount"        decimal(12,2) NOT NULL DEFAULT (0),
          "amountPercentage" decimal(6,3),
          "soldAmount"       decimal(12,2),
          "createdAt"        datetime NOT NULL DEFAULT (datetime('now')),
          "updatedAt"        datetime NOT NULL DEFAULT (datetime('now')),
          CONSTRAINT "FK_sale_return_items_new_voucher"
            FOREIGN KEY ("voucherId")
            REFERENCES "sale_return_vouchers" ("voucherId")
            ON DELETE NO ACTION ON UPDATE NO ACTION,
          CONSTRAINT "FK_sale_return_items_new_product"
            FOREIGN KEY ("productId")
            REFERENCES "finished_products" ("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION
        )
      `);

      // Copy existing rows
      await queryRunner.query(`
        INSERT INTO "sale_return_voucher_items_new"
          ("id","voucherId","productId","isOldItem","oldItemName","oldItemTag",
           "tagGrossWeight","tagKundanWeight","tagStoneWeight","tagMottiWeight","tagNetWeight","tagAmount",
           "netGoldWeight","goldPurity","pureGoldWeight",
           "netAmount","amountPercentage","soldAmount","createdAt","updatedAt")
        SELECT
          "id","voucherId","productId",
          COALESCE("isOldItem", 0),
          "oldItemName","oldItemTag",
          "tagGrossWeight","tagKundanWeight","tagStoneWeight","tagMottiWeight","tagNetWeight","tagAmount",
          "netGoldWeight","goldPurity","pureGoldWeight",
          "netAmount","amountPercentage","soldAmount","createdAt","updatedAt"
        FROM "sale_return_voucher_items"
      `);

      await queryRunner.query(`DROP TABLE "sale_return_voucher_items"`);
      await queryRunner.query(
        `ALTER TABLE "sale_return_voucher_items_new" RENAME TO "sale_return_voucher_items"`,
      );

      await queryRunner.query(`PRAGMA foreign_keys = ON`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse: recreate original table without the new columns and with productId NOT NULL
    await queryRunner.query(`PRAGMA foreign_keys = OFF`);

    await queryRunner.query(`
      CREATE TABLE "sale_return_voucher_items_old" (
        "id"               varchar PRIMARY KEY NOT NULL,
        "voucherId"        varchar NOT NULL,
        "productId"        varchar NOT NULL,
        "netGoldWeight"    decimal(14,3) NOT NULL DEFAULT (0),
        "goldPurity"       decimal(6,3),
        "pureGoldWeight"   decimal(14,3),
        "netAmount"        decimal(12,2) NOT NULL DEFAULT (0),
        "amountPercentage" decimal(6,3),
        "soldAmount"       decimal(12,2),
        "createdAt"        datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt"        datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_sale_return_items_old_voucher"
          FOREIGN KEY ("voucherId")
          REFERENCES "sale_return_vouchers" ("voucherId")
          ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_sale_return_items_old_product"
          FOREIGN KEY ("productId")
          REFERENCES "finished_products" ("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // Only copy rows that have a productId (old items without productId are dropped)
    await queryRunner.query(`
      INSERT INTO "sale_return_voucher_items_old"
        ("id","voucherId","productId",
         "netGoldWeight","goldPurity","pureGoldWeight",
         "netAmount","amountPercentage","soldAmount","createdAt","updatedAt")
      SELECT
        "id","voucherId","productId",
        "netGoldWeight","goldPurity","pureGoldWeight",
        "netAmount","amountPercentage","soldAmount","createdAt","updatedAt"
      FROM "sale_return_voucher_items"
      WHERE "productId" IS NOT NULL
    `);

    await queryRunner.query(`DROP TABLE "sale_return_voucher_items"`);
    await queryRunner.query(
      `ALTER TABLE "sale_return_voucher_items_old" RENAME TO "sale_return_voucher_items"`,
    );

    await queryRunner.query(`PRAGMA foreign_keys = ON`);
  }
}
