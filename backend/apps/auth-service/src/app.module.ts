import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PostgresService } from './postgres.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PostgresService]
})
export class AppModule {}
