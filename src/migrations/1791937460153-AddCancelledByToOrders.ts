import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCancelledByToOrders1791937460153 implements MigrationInterface {
    name = 'AddCancelledByToOrders1791937460153'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`orders\` ADD \`cancelled_by\` varchar(20) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`orders\` DROP COLUMN \`cancelled_by\``);
    }

}
