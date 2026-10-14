import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCancellationToOrders1791914371938 implements MigrationInterface {
    name = 'AddCancellationToOrders1791914371938'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`orders\` ADD \`cancelled_at\` timestamp NULL`);
        await queryRunner.query(`ALTER TABLE \`orders\` ADD \`cancel_reason\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`status\` \`status\` enum ('pending', 'confirmed', 'in_preparation', 'withdraw', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`status\` \`status\` enum ('pending', 'confirmed', 'in_preparation', 'withdraw', 'delivered') NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE \`orders\` DROP COLUMN \`cancel_reason\``);
        await queryRunner.query(`ALTER TABLE \`orders\` DROP COLUMN \`cancelled_at\``);
    }

}
