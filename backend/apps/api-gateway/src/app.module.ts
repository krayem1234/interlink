import { Controller, Get, Module } from '@nestjs/common';
import { AuthProxyController } from './auth-proxy.controller';
import { StudentProxyController } from './student-proxy.controller';
import { CompanyProxyController } from './company-proxy.controller';
import { OfferProxyController } from './offer-proxy.controller';
import { ApplicationProxyController } from './application-proxy.controller';
import { MessagingProxyController } from './messaging-proxy.controller';
import { NotificationProxyController } from './notification-proxy.controller';
import { Week7Controller } from './week7.controller';

@Controller()
class HealthController {
  @Get() root() { return { name: 'InternLink API', status: 'online', health: '/api/health', documentation: 'Use the /api routes.' }; }

  @Get('health')
  health() {
    return {
      service: 'api-gateway',
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  }
}

@Module({
  controllers: [HealthController, AuthProxyController, StudentProxyController, CompanyProxyController, OfferProxyController, ApplicationProxyController, MessagingProxyController, NotificationProxyController, Week7Controller]
})
export class AppModule {}



