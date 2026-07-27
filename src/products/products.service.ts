import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { ProductsRepository } from './products.repository';
import { CategoriesRepository } from '../categories/categories.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { buildPaginatedResult, PaginationQueryDto } from '../common/pagination';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly categoriesRepository: CategoriesRepository,
  ) {}

  async create(dto: CreateProductDto) {
    // Verificamos que la categoria exista antes de crear el producto
    const category = await this.categoriesRepository.findOneBy({ id: dto.categoryId });
    if (!category) {
      throw new NotFoundException(`Category with id ${dto.categoryId} not found`);
    }
    const product = this.productsRepository.create({ ...dto, category });
    return this.productsRepository.save(product);
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

  async update(id: number, dto: UpdateProductDto) {
    const product = await this.findOne(id);
    if (dto.categoryId) {
      const category = await this.categoriesRepository.findOneBy({ id: dto.categoryId });
      if (!category) {
        throw new NotFoundException(`Category with id ${dto.categoryId} not found`);
      }
      product.category = category;
    }
    Object.assign(product, dto);
    return this.productsRepository.save(product);
  }


  async remove(id: number) {
    // Baja logica en vez de borrado fisico: asi no se rompen pedidos historicos
    // que ya referencian este producto
    const product = await this.findOne(id);
    product.active = false;
    return this.productsRepository.save(product);
  }

  findWithLowStock() {
    return this.productsRepository.findWithLowStock();
  }

  // Asocia la imagen recien subida (por Multer) al producto, y borra
  // del disco la imagen anterior si existia, para no acumular archivos
  // huerfanos cada vez que el admin cambia la foto de un producto.
  async updateImage(id: number, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file was received');
    }

    const product = await this.findOne(id);

    if (product.imageUrl) {
      // El nombre del archivo es la ultima parte de la URL guardada
      const oldFileName = product.imageUrl.split('/').pop();
      if (oldFileName) {
        const oldPath = join(process.cwd(), 'uploads', 'products', oldFileName);
        // No usamos try/catch con throw: si el archivo viejo ya no existe
        // por algun motivo, no queremos que eso rompa la subida de la nueva imagen
        await unlink(oldPath).catch(() => null);
      }
    }

    // Guardamos la URL relativa con la que despues se sirve el archivo
    // (ver la configuracion de app.useStaticAssets en main.ts)
    product.imageUrl = `/uploads/products/${file.filename}`;
    return this.productsRepository.save(product);
  }
}
