import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}
  @Get('user/:userId') list(@Param('userId') userId: string) { return this.service.list(userId); }
  @Put(':id/read') markRead(@Param('id') id: string, @Body() body: { userId?: string }) { return this.service.markRead(id, body.userId || ''); }
  @Put('user/:userId/read-all') markAll(@Param('userId') userId: string) { return this.service.markAllRead(userId); }
}
