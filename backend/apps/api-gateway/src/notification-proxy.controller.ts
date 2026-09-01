import { Body, Controller, Get, Param, Put, HttpException } from '@nestjs/common';
@Controller('notifications')
export class NotificationProxyController {
  private readonly baseUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007';
  private async forward(method: 'GET' | 'PUT', path: string, body?: unknown) {
    const response = await fetch(`${this.baseUrl}${path}`, { method, headers: { 'content-type': 'application/json' }, body: method === 'PUT' ? JSON.stringify(body || {}) : undefined });
    const raw = await response.text(); let parsed: unknown = raw; try { parsed = raw ? JSON.parse(raw) : {}; } catch {}
    if (!response.ok) throw new HttpException(parsed || 'upstream error', response.status); return parsed;
  }
  @Get('user/:userId') list(@Param('userId') id: string) { return this.forward('GET', `/notifications/user/${id}`); }
  @Put(':id/read') markRead(@Param('id') id: string, @Body() body: unknown) { return this.forward('PUT', `/notifications/${id}/read`, body); }
  @Put('user/:userId/read-all') markAll(@Param('userId') id: string) { return this.forward('PUT', `/notifications/user/${id}/read-all`); }
}
