import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailToBusiness1784234228893 implements MigrationInterface {
    name = 'AddEmailToBusiness1784234228893'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`business\` ADD \`email\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`business\` DROP COLUMN \`email\``);
    }

}
