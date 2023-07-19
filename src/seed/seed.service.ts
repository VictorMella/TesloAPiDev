import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Repository } from 'typeorm';
import { ProductsService } from '../products/products.service';
import { initialData } from './data/seed-data';
import * as bcrypt from 'bcrypt';
@Injectable()
export class SeedService {
  constructor(
    private readonly productService: ProductsService,
    @InjectRepository(User)
    private readonly userReposetory: Repository<User>,
  ) {}
  async runSeed() {
    await this.deleteTables();

    const firstUser = await this.insertUsers();
    await this.insertNewProducts(firstUser);
    return 'SEEEEED';
  }

  private async deleteTables() {
    await this.productService.deleteAllProducts();

    const queryBuilder = this.userReposetory.createQueryBuilder();
    await queryBuilder.delete().where({}).execute();
  }

  private async insertUsers() {
    const seedUser = initialData.users;

    seedUser.forEach((user) => {
      user.password = bcrypt.hashSync(user.password, 10);
    });
    const users: User[] = [];
    seedUser.forEach((user) => {
      users.push(this.userReposetory.create(user));
    });

    const dbUsers = await this.userReposetory.save(users);
    return dbUsers[0];
  }

  private async insertNewProducts(user: User) {
    await this.productService.deleteAllProducts();

    const productsSeed = initialData.products;

    const insertPromises = [];

    productsSeed.forEach((product) => {
      insertPromises.push(this.productService.create(product, user));
    });

    await Promise.all(insertPromises);

    return true;
  }
}
