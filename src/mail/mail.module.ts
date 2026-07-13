import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Module({
  providers: [MailService],
  exports: [MailService], // otros modulos (Pedidos) lo van a inyectar
})
export class MailModule {}
