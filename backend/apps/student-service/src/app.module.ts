import { Controller, Get, Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { PostgresService } from './postgres.service';

@Controller()
class HealthController {
  @Get('health')
  health() {
    return {
      service: 'student-service',
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  }
}

@Module({
  controllers: [HealthController, StudentController],
  providers: [StudentService, PostgresService]
})
export class AppModule {}
