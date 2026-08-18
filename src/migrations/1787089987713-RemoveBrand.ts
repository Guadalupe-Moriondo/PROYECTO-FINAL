import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveBrand1787089987713 implements MigrationInterface {
    name = 'RemoveBrand1787089987713'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`products\` DROP COLUMN \`brand\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`products\` ADD \`brand\` varchar(100) NULL`);
    }

}
