import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT || 3007);
  await app.listen(port);
  console.log(`Notification service listening on ${port}`);
}

bootstrap();
