import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderStatusToOrderVouchers1748000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customer_order_vouchers" ADD "orderStatus" varchar NOT NULL DEFAULT 'OPEN'`);
        await queryRunner.query(`ALTER TABLE "supplier_order_vouchers" ADD "orderStatus" varchar NOT NULL DEFAULT 'OPEN'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customer_order_vouchers" DROP COLUMN "orderStatus"`);
        await queryRunner.query(`ALTER TABLE "supplier_order_vouchers" DROP COLUMN "orderStatus"`);
    }
}
