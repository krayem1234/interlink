import { Body, Controller, Get, Param, Post, Query, HttpException } from '@nestjs/common';
@Controller('messages')
export class MessagingProxyController {
  private readonly baseUrl = process.env.MESSAGING_SERVICE_URL || 'http://localhost:3006';
  private async forward(method: 'GET' | 'POST', path: string, body?: unknown) {
    const response = await fetch(`${this.baseUrl}${path}`, { method, headers: { 'content-type': 'application/json' }, body: method === 'POST' ? JSON.stringify(body || {}) : undefined });
    const raw = await response.text(); let parsed: unknown = raw; try { parsed = raw ? JSON.parse(raw) : {}; } catch {}
    if (!response.ok) throw new HttpException(parsed || 'upstream error', response.status); return parsed;
  }
  @Get('application/:applicationId') list(@Param('applicationId') id: string, @Query('userId') userId: string) { return this.forward('GET', `/messages/application/${id}?userId=${encodeURIComponent(userId || '')}`); }
  @Post() send(@Body() body: unknown) { return this.forward('POST', '/messages', body); }
}
