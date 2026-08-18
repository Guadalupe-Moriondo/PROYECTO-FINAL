import { MigrationInterface, QueryRunner } from "typeorm";

export class Categories1787080937052 implements MigrationInterface {
    name = 'Categories1787080937052'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`categories\` DROP COLUMN \`machineType\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`categories\` ADD \`machineType\` varchar(20) NOT NULL DEFAULT 'otros'`);
    }

}
