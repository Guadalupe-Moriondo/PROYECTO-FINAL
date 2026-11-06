import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderStatusHistory1793883433062 implements MigrationInterface {
    name = 'AddOrderStatusHistory1793883433062'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`order_status_history\` (\`id\` int NOT NULL AUTO_INCREMENT, \`status\` enum ('pending', 'confirmed', 'in_preparation', 'withdraw', 'delivered', 'cancelled') NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`order_id\` int NULL, \`changed_by_user_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`order_status_history\` ADD CONSTRAINT \`FK_1ca7d5228cf9dc589b60243933c\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`order_status_history\` ADD CONSTRAINT \`FK_965678b54f0a0361ca72c541b20\` FOREIGN KEY (\`changed_by_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`order_status_history\` DROP FOREIGN KEY \`FK_965678b54f0a0361ca72c541b20\``);
        await queryRunner.query(`ALTER TABLE \`order_status_history\` DROP FOREIGN KEY \`FK_1ca7d5228cf9dc589b60243933c\``);
        await queryRunner.query(`DROP TABLE \`order_status_history\``);
    }

}
