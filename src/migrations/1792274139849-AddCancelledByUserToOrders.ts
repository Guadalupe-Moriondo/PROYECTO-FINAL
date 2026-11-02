import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCancelledByUserToOrders1792274139849 implements MigrationInterface {
    name = 'AddCancelledByUserToOrders1792274139849'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`orders\` ADD \`cancelled_by_user_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`orders\` ADD CONSTRAINT \`FK_db249db755b246770b9ad346c54\` FOREIGN KEY (\`cancelled_by_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_db249db755b246770b9ad346c54\``);
        await queryRunner.query(`ALTER TABLE \`orders\` DROP COLUMN \`cancelled_by_user_id\``);
    }

}
