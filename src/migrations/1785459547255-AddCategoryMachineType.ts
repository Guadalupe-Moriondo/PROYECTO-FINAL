import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategoryMachineType1785459547255 implements MigrationInterface {
    name = 'AddCategoryMachineType1785459547255'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`categories\` ADD \`machineType\` varchar(20) NOT NULL DEFAULT 'otros'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`categories\` DROP COLUMN \`machineType\``);
    }

}
