import { Controller, Get, Post, Put, Delete, Body, Param, HttpException, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('applications')
export class ApplicationProxyController {
  private readonly applicationBaseUrl = process.env.APPLICATION_SERVICE_URL || 'http://localhost:3005';

  private async forwardRequest(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, request?: Request, body?: unknown) {
    const url = new URL(`${this.applicationBaseUrl}${path}`);
    if (request?.query) {
      for (const [key, value] of Object.entries(request.query)) {
        if (typeof value === 'string') {
          url.searchParams.set(key, value);
        } else if (Array.isArray(value)) {
          value.forEach((v) => typeof v === 'string' && url.searchParams.append(key, v));
        }
      }
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'content-type': 'application/json'
      },
      body: method !== 'GET' ? JSON.stringify(body || {}) : undefined
    });

    const raw = await response.text();
    let parsed: unknown = raw;
    try {
      parsed = raw ? (JSON.parse(raw) as unknown) : {};
    } catch {
      parsed = raw;
    }

    if (!response.ok) {
      throw new HttpException(parsed || 'upstream error', response.status);
    }

    return parsed;
  }

  @Post()
  async createApplication(@Body() body: unknown) {
    return this.forwardRequest('POST', '/applications', undefined, body);
  }

  @Get('student/:studentId')
  async getApplicationsByStudent(@Param('studentId') studentId: string, @Req() req: Request) {
    return this.forwardRequest('GET', `/applications/student/${studentId}`, req);
  }

  @Get('offer/:offerId')
  async getApplicationsByOffer(@Param('offerId') offerId: string, @Req() req: Request) {
    return this.forwardRequest('GET', `/applications/offer/${offerId}`, req);
  }

  @Get('company/:companyId')
  async getApplicationsByCompany(@Param('companyId') companyId: string, @Req() req: Request) {
    return this.forwardRequest('GET', `/applications/company/${companyId}`, req);
  }

  @Put(':applicationId/status')
  async updateApplicationStatus(
    @Param('applicationId') applicationId: string,
    @Body() body: unknown
  ) {
    return this.forwardRequest('PUT', `/applications/${applicationId}/status`, undefined, body);
  }

  @Get(':applicationId')
  async getApplicationById(
    @Param('applicationId') applicationId: string,
    @Req() req: Request
  ) {
    return this.forwardRequest('GET', `/applications/${applicationId}`, req);
  }
}
