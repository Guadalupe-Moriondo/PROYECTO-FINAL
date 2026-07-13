import { Module } from '@nestjs/common';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { BusinessRepository } from './business.repository';
import { QueriesController } from './queries.controller';
import { QueriesService } from './queries.service';
import { QueriesRepository } from './queries.repository';
import { ProductsModule } from '../products/products.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';

// Este modulo fusiona "Empresa" (datos generales del negocio) y
// "Consultas" (mensajes del boton de contacto/presupuesto). Se fusionaron
// porque ninguno de los dos tiene logica de negocio compleja: son mas
// bien "contenido del sitio publico" que procesos de negocio como
// pedidos o stock, y cada uno por separado era un modulo demasiado chico.
@Module({
  imports: [ProductsModule, AuthModule, MailModule],
  controllers: [BusinessController, QueriesController],
  providers: [BusinessService, BusinessRepository, QueriesService, QueriesRepository],
})
export class ContentModule {}
