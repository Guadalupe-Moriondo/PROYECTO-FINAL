import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategoryActive1785179660915 implements MigrationInterface {
    name = 'AddCategoryActive1785179660915'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`categories\` ADD \`active\` tinyint NOT NULL DEFAULT 1`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`categories\` DROP COLUMN \`active\``);
    }

}
