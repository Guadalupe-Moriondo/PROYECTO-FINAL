import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderNotifications1786052194526 implements MigrationInterface {
    name = 'AddOrderNotifications1786052194526'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`orders\` ADD \`customerNotified\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`orders\` ADD \`notificationMethod\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`orders\` ADD \`customerNotifiedAt\` timestamp NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`orders\` DROP COLUMN \`customerNotifiedAt\``);
        await queryRunner.query(`ALTER TABLE \`orders\` DROP COLUMN \`notificationMethod\``);
        await queryRunner.query(`ALTER TABLE \`orders\` DROP COLUMN \`customerNotified\``);
    }

}
