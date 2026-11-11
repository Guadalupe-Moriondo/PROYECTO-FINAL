import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { ProductsRepository } from './products.repository';
import { CategoriesRepository } from '../categories/categories.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { DataSource } from 'typeorm';
import { Product } from './entities/product.entity';
import { StockMovement, MovementType } from './entities/stock-movement.entity';
import { buildPaginatedResult, PaginationQueryDto } from '../common/pagination';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly categoriesRepository: CategoriesRepository,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateProductDto, userId: number) {
    const category = await this.categoriesRepository.findOneBy({ id: dto.categoryId });
    if (!category || !category.active) {
      throw new NotFoundException(`Category with id ${dto.categoryId} not found`);
    }
    try {
      return await this.dataSource.transaction(async (manager) => {
        const saved = await manager.save(manager.create(Product, { ...dto, category }));
        if ((dto.stock ?? 0) > 0) {
          await manager.save(
            manager.create(StockMovement, {
              product: { id: saved.id },
              type: MovementType.IN,
              quantity: dto.stock,
              reason: 'Stock inicial',
              user: { id: userId },
            }),
          );
        }
        return saved;
      });
    } catch (e: any) {
      if (e?.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Ya existe un producto con ese código');
      }
      throw e;
    }
  }

  async findAll(pagination: PaginationQueryDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.productsRepository.findAllPaginated(page, limit);
    return buildPaginatedResult(data, total, page, limit);
  }

  async search(filters: ProductFilterDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const [data, total] = await this.productsRepository.searchWithFilters(filters);
    return buildPaginatedResult(data, total, page, limit);
  }

  async findOne(id: number) {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: {
        category: true
      },
    });
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  async findOnePublic(id: number) {
    const product = await this.findOne(id);
    if (!product.active) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  async update(id: number, dto: UpdateProductDto) {
    const product = await this.findOne(id);
    if (dto.categoryId) {
      const category = await this.categoriesRepository.findOneBy({ id: dto.categoryId });
      if (!category || !category.active) {
        throw new NotFoundException(`Category with id ${dto.categoryId} not found`);
      }
      product.category = category;
    }
    Object.assign(product, dto);
    try {
      return await this.productsRepository.save(product);
    } catch (e: any) {
      if (e?.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Ya existe un producto con ese código');
      }
      throw e;
    }
  }


  async remove(id: number) {
    const product = await this.findOne(id);
    product.active = false;
    return this.productsRepository.save(product);
  }

  async updateImage(id: number, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file was received');
    }

    const product = await this.findOne(id);

    if (product.imageUrl) {
      const oldFileName = product.imageUrl.split('/').pop();
      if (oldFileName) {
        const oldPath = join(process.cwd(), 'uploads', 'products', oldFileName);
        await unlink(oldPath).catch(() => null);
      }
    }
    product.imageUrl = `/uploads/products/${file.filename}`;
    return this.productsRepository.save(product);
  }
}
