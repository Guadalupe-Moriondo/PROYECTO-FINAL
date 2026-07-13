import { Injectable, NotFoundException } from '@nestjs/common';
import { QueriesRepository } from './queries.repository';
import { ProductsRepository } from '../products/products.repository';
import { MailService } from '../mail/mail.service';
import { CreateQueryDto } from './dto/create-queries.dto';
import { QueryStatus } from './entities/queries.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class QueriesService {
  constructor(
    private readonly queriesRepository: QueriesRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly mailService: MailService,
  ) {}

  async create(dto: CreateQueryDto) {
    // Si la consulta viene desde la pagina de un producto puntual,
    // validamos que ese producto exista (pero no es obligatorio: puede
    // ser una consulta general sin producto asociado)
    let product: Product | null = null;
    if (dto.productId) {
      product = await this.productsRepository.findOneBy({ id: dto.productId });
      if (!product) {
        throw new NotFoundException(`Product with id ${dto.productId} not found`);
      }
    }

    const query = this.queriesRepository.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      type: dto.type,
      message: dto.message,
      product,
    });
    const saved = await this.queriesRepository.save(query);

    // Avisamos al admin apenas llega, igual que con los pedidos nuevos.
    // No bloqueante: si el email falla, la consulta ya quedo guardada igual.
    this.mailService.notifyNewQuery(saved);

    return saved;
  }

  findAll() {
    return this.queriesRepository.find({ order: { createdAt: 'DESC' } });
  }

  findPending() {
    return this.queriesRepository.findPending();
  }

  async markAsAnswered(id: number) {
    const query = await this.queriesRepository.findOneBy({ id });
    if (!query) throw new NotFoundException('Query not found');
    query.status = QueryStatus.ANSWERED;
    return this.queriesRepository.save(query);
  }
}
