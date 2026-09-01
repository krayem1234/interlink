import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { MessagingService } from './messaging.service';

@Controller('messages')
export class MessagingController {
  constructor(private readonly service: MessagingService) {}
  @Get('application/:applicationId') list(@Param('applicationId') applicationId: string, @Query('userId') userId: string) { return this.service.list(applicationId, userId); }
  @Post() send(@Body() body: { applicationId?: string; senderUserId?: string; body?: string; attachment?: { name?: string; mimeType?: string; data?: string } }) { return this.service.send(body.applicationId || '', body.senderUserId || '', body.body || '', body.attachment?.name && body.attachment.mimeType && body.attachment.data ? { name: body.attachment.name, mimeType: body.attachment.mimeType, data: body.attachment.data } : undefined); }
}

