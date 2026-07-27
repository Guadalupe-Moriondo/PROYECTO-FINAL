import { Module } from '@nestjs/common';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { BusinessRepository } from './business.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [BusinessController],
  providers: [BusinessService, BusinessRepository],
})
export class ContentModule {}