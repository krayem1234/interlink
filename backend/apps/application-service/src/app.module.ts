import { Controller, Get, Module } from '@nestjs/common';
import { PostgresService } from './postgres.service';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';

@Controller()
class HealthController {
  @Get('health')
  health() {
    return {
      service: 'application-service',
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  }
}

@Module({
  controllers: [HealthController, ApplicationController],
  providers: [PostgresService, ApplicationService]
})
export class AppModule {}
