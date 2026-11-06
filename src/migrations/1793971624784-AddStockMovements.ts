import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStockMovements1793971624784 implements MigrationInterface {
    name = 'AddStockMovements1793971624784'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`stock_movements\` ADD \`user_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`stock_movements\` ADD \`order_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`stock_movements\` ADD CONSTRAINT \`FK_d7fedfd6ee0f4a06648c48631c6\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`stock_movements\` ADD CONSTRAINT \`FK_8311bb94d8e30b9995383801e3d\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`stock_movements\` DROP FOREIGN KEY \`FK_8311bb94d8e30b9995383801e3d\``);
        await queryRunner.query(`ALTER TABLE \`stock_movements\` DROP FOREIGN KEY \`FK_d7fedfd6ee0f4a06648c48631c6\``);
        await queryRunner.query(`ALTER TABLE \`stock_movements\` DROP COLUMN \`order_id\``);
        await queryRunner.query(`ALTER TABLE \`stock_movements\` DROP COLUMN \`user_id\``);
    }

}
