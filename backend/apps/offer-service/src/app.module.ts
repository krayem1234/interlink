import { Controller, Get, Module } from '@nestjs/common';
import { PostgresService } from './postgres.service';
import { OfferService } from './offer.service';
import { OfferController } from './offer.controller';

@Controller()
class HealthController {
  @Get('health')
  health() {
    return {
      service: 'offer-service',
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  }
}

@Module({
  controllers: [HealthController, OfferController],
  providers: [PostgresService, OfferService]
})
export class AppModule {}
