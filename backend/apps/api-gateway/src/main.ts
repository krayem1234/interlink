import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.getHttpAdapter().getInstance().get('/', (_req: unknown, res: { json: (value: unknown) => void }) => res.json({ name: 'InternLink API', status: 'online', health: '/api/health', routes: '/api/*' }));
  app.setGlobalPrefix('api');
  const port = Number(process.env.PORT || 3000);
  await app.listen(port);
  console.log(`API Gateway listening on ${port}`);
}

bootstrap();

