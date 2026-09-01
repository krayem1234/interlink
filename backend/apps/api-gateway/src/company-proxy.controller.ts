import { Controller, Get, Post, Put, Delete, Body, Param, HttpException } from '@nestjs/common';

@Controller('companies')
export class CompanyProxyController {
  private readonly companyBaseUrl = process.env.COMPANY_SERVICE_URL || 'http://localhost:3003';

  private async forwardRequest(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown) {
    const response = await fetch(`${this.companyBaseUrl}${path}`, {
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

  // Profile endpoints
  @Post('profile')
  async createOrUpdateProfile(@Body() body: unknown) {
    return this.forwardRequest('POST', '/companies/profile', body);
  }

  @Get('profile/:userId')
  async getProfile(@Param('userId') userId: string) {
    return this.forwardRequest('GET', `/companies/profile/${userId}`);
  }

  @Get(':companyId')
  async getProfileById(@Param('companyId') companyId: string) {
    return this.forwardRequest('GET', `/companies/${companyId}`);
  }

  @Delete('profile/:userId')
  async deleteProfile(@Param('userId') userId: string) {
    return this.forwardRequest('DELETE', `/companies/profile/${userId}`);
  }

  // Admin endpoints
  @Get('admin/companies')
  async getAllCompanies() {
    return this.forwardRequest('GET', '/companies/admin/companies');
  }

  @Put('admin/companies/:companyId/validate')
  async validateCompany(@Param('companyId') companyId: string, @Body() body: unknown) {
    return this.forwardRequest('PUT', `/companies/admin/companies/${companyId}/validate`, body);
  }
}
