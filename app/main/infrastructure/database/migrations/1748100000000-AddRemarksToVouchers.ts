import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRemarksToVouchers1748100000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cash_vouchers" ADD "remarks" text`);
        await queryRunner.query(`ALTER TABLE "cash_vouchers" ADD "remarksTime" varchar(20)`);
        await queryRunner.query(`ALTER TABLE "gold_vouchers" ADD "remarks" text`);
        await queryRunner.query(`ALTER TABLE "gold_vouchers" ADD "remarksTime" varchar(20)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cash_vouchers" DROP COLUMN "remarks"`);
        await queryRunner.query(`ALTER TABLE "cash_vouchers" DROP COLUMN "remarksTime"`);
        await queryRunner.query(`ALTER TABLE "gold_vouchers" DROP COLUMN "remarks"`);
        await queryRunner.query(`ALTER TABLE "gold_vouchers" DROP COLUMN "remarksTime"`);
    }
}
