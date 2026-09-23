import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeliveredAtToOrders1790104056612 implements MigrationInterface {
    name = 'AddDeliveredAtToOrders1790104056612'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`orders\` ADD \`delivered_at\` timestamp NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`orders\` DROP COLUMN \`delivered_at\``);
    }

}
