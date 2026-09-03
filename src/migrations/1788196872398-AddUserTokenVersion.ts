import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserTokenVersion1788196872398 implements MigrationInterface {
    name = 'AddUserTokenVersion1788196872398'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`tokenVersion\` int NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`tokenVersion\``);
    }

}
