import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('bootstrap');
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      }, //transforma el formato de los dt, eje string a number
      whitelist: true, //Elimina las propiedades demas
      forbidNonWhitelisted: true, //Notifica las propiedades que estan demas
    }),
  );
  await app.listen(process.env.PORT);
  logger.log(`Hola, estas en el puerto ${process.env.PORT}`);
}
bootstrap();
