import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from '../common/dto/pagination.dto';
import { DataSource, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { validate as isUUID } from 'uuid';
import { Product, ProductImage } from './entities';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  constructor(
    @InjectRepository(Product)
    private readonly repository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly repositoryProductImages: Repository<ProductImage>,
    private readonly dtSource: DataSource,
  ) {}
  async create(createProductDto: CreateProductDto, user: User) {
    try {
      const { images = [], ...productDetails } = createProductDto;
      const producto = this.repository.create({
        ...productDetails,
        images: images.map((image) =>
          this.repositoryProductImages.create({ url: image }),
        ),
        user,
      });
      await this.repository.save(producto);
      return { ...producto, images };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    const products = await this.repository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true, //Llena la columna images
      },
    });

    return products.map((product) => ({
      ...product,
      images: product.images.map((img) => img.url),
    }));
  }

  async findOne(term: string) {
    let product: Product;
    if (isUUID(term)) {
      product = await this.repository.findOneBy({ id: term });
    } else {
      const queryBuilder = this.repository.createQueryBuilder('prod');
      product = await queryBuilder
        .where('UPPER(title) =:title or slug=:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        })
        .leftJoinAndSelect('prod.images', 'prodImages')
        .getOne();
    }
    if (!product) throw new NotFoundException('Producto no encontrado');

    return product;
  }

  async fingOnePlain(term: string) {
    const { images = [], ...rest } = await this.findOne(term);
    return {
      ...rest,
      images: images.map((img) => img.url),
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto, user: User) {
    const { images, ...toUpdate } = updateProductDto;

    const product = await this.repository.preload({
      id,
      ...toUpdate,
    });

    if (!product)
      throw new NotFoundException(`Product with id: ${id} not found`);

    //Crear query runner
    const queryRunner = this.dtSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (images) {
        await queryRunner.manager.delete(ProductImage, { product: { id } });
        product.images = images.map((image) =>
          this.repositoryProductImages.create({ url: image }),
        );
      } else {
        /* product.images = await this.repositoryProductImages.findBy({
          product: { id },
        }); */
      }
      product.user = user;

      await queryRunner.manager.save(product);
      //await this.repository.save(product);
      await queryRunner.commitTransaction();
      await queryRunner.release();

      //return product;
      return this.fingOnePlain(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    if (!product) throw new NotFoundException('Producto no encontrado');
    await this.repository.remove(product);

    return 'Producto eliminado';
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException(error?.detail);
    }
    this.logger.error(error);
    throw new InternalServerErrorException('Ayuda');
  }

  async deleteAllProducts() {
    const queryBuilder = this.repository.createQueryBuilder('product');
    try {
      return await queryBuilder.delete().where({}).execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }
}
