import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBusinessLocation1784849373960 implements MigrationInterface {
    name = 'AddBusinessLocation1784849373960'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`business\` ADD \`city\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`business\` ADD \`province\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`business\` ADD \`country\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`business\` DROP COLUMN \`country\``);
        await queryRunner.query(`ALTER TABLE \`business\` DROP COLUMN \`province\``);
        await queryRunner.query(`ALTER TABLE \`business\` DROP COLUMN \`city\``);
    }

}
