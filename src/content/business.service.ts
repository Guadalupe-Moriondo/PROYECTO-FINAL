import { Injectable } from '@nestjs/common';
import { BusinessRepository } from './business.repository';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessService {
  constructor(private readonly businessRepository: BusinessRepository) {}

  async get() {
    const business = await this.businessRepository.getOnly();
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
