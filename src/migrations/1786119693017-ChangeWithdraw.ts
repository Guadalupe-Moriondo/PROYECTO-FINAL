import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeWithdraw1786119693017 implements MigrationInterface {
    name = 'ChangeWithdraw1786119693017'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`status\` \`status\` enum ('pending', 'confirmed', 'in_preparation', 'withdraw', 'delivered') NOT NULL DEFAULT 'pending'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`status\` \`status\` enum ('pending', 'confirmed', 'in_preparation', 'shipped', 'delivered') NOT NULL DEFAULT 'pending'`);
    }

}
