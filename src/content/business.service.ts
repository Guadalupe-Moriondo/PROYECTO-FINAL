import { Injectable } from '@nestjs/common';
import { BusinessRepository } from './business.repository';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessService {
  constructor(private readonly businessRepository: BusinessRepository) {}

  async get() {
    const business = await this.businessRepository.getOnly();
    // Si todavia nadie cargo los datos, devolvemos un objeto vacio
    // en vez de un error, para que el frontend no se rompa
    return business || {};
  }

  async update(dto: UpdateBusinessDto) {
    let business = await this.businessRepository.getOnly();
    if (!business) {
      business = this.businessRepository.create(dto);
    } else {
      Object.assign(business, dto);
    }
    return this.businessRepository.save(business);
  }
}
