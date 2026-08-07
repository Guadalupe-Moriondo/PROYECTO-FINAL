import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOwnerAdmin1785865225049 implements MigrationInterface {
    name = 'AddOwnerAdmin1785865225049'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`owner\` tinyint NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`owner\``);
    }

}
