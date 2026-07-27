import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBusinessHours1784851486975 implements MigrationInterface {
    name = 'AddBusinessHours1784851486975'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`business\` DROP COLUMN \`hours\``);
        await queryRunner.query(`ALTER TABLE \`business\` ADD \`mondayOpen\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`business\` ADD \`mondayClose\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`business\` ADD \`afternoonOpen\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`business\` ADD \`afternoonClose\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`business\` ADD \`saturdayOpen\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`business\` ADD \`saturdayClose\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`business\` DROP COLUMN \`saturdayClose\``);
        await queryRunner.query(`ALTER TABLE \`business\` DROP COLUMN \`saturdayOpen\``);
        await queryRunner.query(`ALTER TABLE \`business\` DROP COLUMN \`afternoonClose\``);
        await queryRunner.query(`ALTER TABLE \`business\` DROP COLUMN \`afternoonOpen\``);
        await queryRunner.query(`ALTER TABLE \`business\` DROP COLUMN \`mondayClose\``);
        await queryRunner.query(`ALTER TABLE \`business\` DROP COLUMN \`mondayOpen\``);
        await queryRunner.query(`ALTER TABLE \`business\` ADD \`hours\` text NULL`);
    }

}
