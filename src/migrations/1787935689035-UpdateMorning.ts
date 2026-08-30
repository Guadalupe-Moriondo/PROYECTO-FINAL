import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMorning1787935689035 implements MigrationInterface {
    name = 'UpdateMorning1787935689035'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`business\` DROP COLUMN \`mondayOpen\``);
        await queryRunner.query(`ALTER TABLE \`business\` DROP COLUMN \`mondayClose\``);
        await queryRunner.query(`ALTER TABLE \`business\` ADD \`morningOpen\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`business\` ADD \`morningClose\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`business\` DROP COLUMN \`morningClose\``);
        await queryRunner.query(`ALTER TABLE \`business\` DROP COLUMN \`morningOpen\``);
        await queryRunner.query(`ALTER TABLE \`business\` ADD \`mondayClose\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`business\` ADD \`mondayOpen\` varchar(255) NULL`);
    }

}
