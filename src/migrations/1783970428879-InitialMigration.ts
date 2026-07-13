import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1783970428879 implements MigrationInterface {
    name = 'InitialMigration1783970428879'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(150) NOT NULL, \`email\` varchar(150) NOT NULL, \`password_hash\` varchar(255) NOT NULL, \`role\` enum ('customer', 'admin') NOT NULL DEFAULT 'customer', \`phone\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`categories\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`description\` text NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`products\` (\`id\` int NOT NULL AUTO_INCREMENT, \`code\` varchar(50) NOT NULL, \`name\` varchar(150) NOT NULL, \`description\` text NULL, \`machineryCompatibility\` text NULL, \`brand\` varchar(100) NULL, \`price\` decimal(10,2) NOT NULL, \`stock\` int NOT NULL DEFAULT '0', \`min_stock\` int NOT NULL DEFAULT '5', \`imageUrl\` varchar(255) NULL, \`active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`category_id\` int NULL, UNIQUE INDEX \`IDX_7cfc24d6c24f0ec91294003d6b\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`order_details\` (\`id\` int NOT NULL AUTO_INCREMENT, \`quantity\` int NOT NULL, \`unit_price\` decimal(10,2) NOT NULL, \`order_id\` int NULL, \`product_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`orders\` (\`id\` int NOT NULL AUTO_INCREMENT, \`order_number\` varchar(255) NOT NULL, \`status\` enum ('pending', 'confirmed', 'in_preparation', 'shipped', 'delivered') NOT NULL DEFAULT 'pending', \`payment_method\` enum ('cash', 'transfer', 'card') NOT NULL, \`total\` decimal(10,2) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`user_id\` int NULL, UNIQUE INDEX \`IDX_75eba1c6b1a66b09f2a97e6927\` (\`order_number\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`stock_movements\` (\`id\` int NOT NULL AUTO_INCREMENT, \`type\` enum ('in', 'out') NOT NULL, \`quantity\` int NOT NULL, \`reason\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`product_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`queries\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(150) NOT NULL, \`email\` varchar(150) NOT NULL, \`phone\` varchar(255) NULL, \`type\` enum ('general_query', 'quote') NOT NULL DEFAULT 'general_query', \`message\` text NOT NULL, \`status\` enum ('pending', 'answered') NOT NULL DEFAULT 'pending', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`product_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`business\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(150) NOT NULL, \`address\` varchar(255) NULL, \`phone\` varchar(255) NULL, \`whatsapp\` varchar(255) NULL, \`hours\` text NULL, \`instagram\` varchar(255) NULL, \`facebook\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`cart_items\` (\`id\` int NOT NULL AUTO_INCREMENT, \`quantity\` int NOT NULL DEFAULT '1', \`cart_id\` int NULL, \`product_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`carts\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NULL, UNIQUE INDEX \`REL_2ec1c94a977b940d85a4f498ae\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`products\` ADD CONSTRAINT \`FK_9a5f6868c96e0069e699f33e124\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`order_details\` ADD CONSTRAINT \`FK_3ff3367344edec5de2355a562ee\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`order_details\` ADD CONSTRAINT \`FK_ce1f689e43b39edd9330cadaeb8\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`orders\` ADD CONSTRAINT \`FK_a922b820eeef29ac1c6800e826a\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`stock_movements\` ADD CONSTRAINT \`FK_2c1bb05b80ddcc562cd28d826c6\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`queries\` ADD CONSTRAINT \`FK_521bd0a57540f56f07826e60367\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`cart_items\` ADD CONSTRAINT \`FK_6385a745d9e12a89b859bb25623\` FOREIGN KEY (\`cart_id\`) REFERENCES \`carts\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`cart_items\` ADD CONSTRAINT \`FK_30e89257a105eab7648a35c7fce\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`carts\` ADD CONSTRAINT \`FK_2ec1c94a977b940d85a4f498aea\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`carts\` DROP FOREIGN KEY \`FK_2ec1c94a977b940d85a4f498aea\``);
        await queryRunner.query(`ALTER TABLE \`cart_items\` DROP FOREIGN KEY \`FK_30e89257a105eab7648a35c7fce\``);
        await queryRunner.query(`ALTER TABLE \`cart_items\` DROP FOREIGN KEY \`FK_6385a745d9e12a89b859bb25623\``);
        await queryRunner.query(`ALTER TABLE \`queries\` DROP FOREIGN KEY \`FK_521bd0a57540f56f07826e60367\``);
        await queryRunner.query(`ALTER TABLE \`stock_movements\` DROP FOREIGN KEY \`FK_2c1bb05b80ddcc562cd28d826c6\``);
        await queryRunner.query(`ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_a922b820eeef29ac1c6800e826a\``);
        await queryRunner.query(`ALTER TABLE \`order_details\` DROP FOREIGN KEY \`FK_ce1f689e43b39edd9330cadaeb8\``);
        await queryRunner.query(`ALTER TABLE \`order_details\` DROP FOREIGN KEY \`FK_3ff3367344edec5de2355a562ee\``);
        await queryRunner.query(`ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_9a5f6868c96e0069e699f33e124\``);
        await queryRunner.query(`DROP INDEX \`REL_2ec1c94a977b940d85a4f498ae\` ON \`carts\``);
        await queryRunner.query(`DROP TABLE \`carts\``);
        await queryRunner.query(`DROP TABLE \`cart_items\``);
        await queryRunner.query(`DROP TABLE \`business\``);
        await queryRunner.query(`DROP TABLE \`queries\``);
        await queryRunner.query(`DROP TABLE \`stock_movements\``);
        await queryRunner.query(`DROP INDEX \`IDX_75eba1c6b1a66b09f2a97e6927\` ON \`orders\``);
        await queryRunner.query(`DROP TABLE \`orders\``);
        await queryRunner.query(`DROP TABLE \`order_details\``);
        await queryRunner.query(`DROP INDEX \`IDX_7cfc24d6c24f0ec91294003d6b\` ON \`products\``);
        await queryRunner.query(`DROP TABLE \`products\``);
        await queryRunner.query(`DROP TABLE \`categories\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }

}
