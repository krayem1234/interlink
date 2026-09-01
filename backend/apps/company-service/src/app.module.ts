import { Controller, Get, Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { PostgresService } from './postgres.service';

@Controller()
class HealthController {
  @Get('health')
  health() {
    return {
      service: 'company-service',
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  }
}

@Module({
  controllers: [HealthController, CompanyController],
  providers: [CompanyService, PostgresService]
})
export class AppModule {}
