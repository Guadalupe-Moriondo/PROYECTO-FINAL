import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/pagination';



// Tipos de archivo permitidos para las imagenes de productos
const ALLOWED_IMAGE_TYPES = /\.(jpg|jpeg|png|webp)$/i;

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Rutas publicas: cualquier visitante del sitio puede ver el catalogo
  // GET /productos?pagina=1&limite=20
  @Get()
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.productsService.findAll(pagination);
  }

  // GET /productos/buscar?nombre=filtro&categoriaId=1&precioMin=100&pagina=1&limite=20
  @Get('search')
  search(@Query() filters: ProductFilterDto) {
    return this.productsService.search(filters);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  

  // Endpoint dedicado para subir/reemplazar la foto de un producto.
  // Separado del PUT general porque este recibe multipart/form-data
  // (un archivo), no JSON como el resto de los endpoints.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post(':id/image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        // Carpeta donde se guardan fisicamente los archivos en el servidor
        destination: './uploads/products',
        filename: (req, file, callback) => {
          // Nunca usamos el nombre original del archivo (podria repetirse
          // entre dos uploads distintos, o contener caracteres raros).
          // Generamos un nombre unico con UUID + la extension original.
          const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!ALLOWED_IMAGE_TYPES.test(extname(file.originalname))) {
          return callback(
            new BadRequestException('Only .jpg, .jpeg, .png or .webp images are allowed'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB maximo por imagen
      },
    }),
  )
  uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.productsService.updateImage(id, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}

