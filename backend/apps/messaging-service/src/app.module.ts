import { Controller, Get, Module } from '@nestjs/common';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { PostgresService } from './postgres.service';

@Controller()
class HealthController { @Get('health') health() { return { service: 'messaging-service', status: 'ok', timestamp: new Date().toISOString() }; } }
@Module({ controllers: [HealthController, MessagingController], providers: [MessagingService, PostgresService] })
export class AppModule {}
