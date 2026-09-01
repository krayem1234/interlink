import { Controller, Get, Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { PostgresService } from './postgres.service';
@Controller() class HealthController { @Get('health') health() { return { service: 'notification-service', status: 'ok', timestamp: new Date().toISOString() }; } }
@Module({ controllers: [HealthController, NotificationController], providers: [NotificationService, PostgresService] })
export class AppModule {}
