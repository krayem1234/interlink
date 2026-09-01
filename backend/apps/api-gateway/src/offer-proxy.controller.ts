import { Controller, Get, Post, Put, Delete, Body, Param, HttpException } from '@nestjs/common';

@Controller('offers')
export class OfferProxyController {
  private readonly offerBaseUrl = process.env.OFFER_SERVICE_URL || 'http://localhost:3004';

  private async forwardRequest(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown) {
    const response = await fetch(`${this.offerBaseUrl}${path}`, {
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
  async createOffer(@Body() body: unknown) {
    return this.forwardRequest('POST', '/offers', body);
  }

  @Put(':offerId')
  async updateOffer(@Param('offerId') offerId: string, @Body() body: unknown) {
    return this.forwardRequest('PUT', `/offers/${offerId}`, body);
  }

  @Get('company/:companyId')
  async getOffersByCompany(@Param('companyId') companyId: string) {
    return this.forwardRequest('GET', `/offers/company/${companyId}`);
  }

  @Get(':offerId')
  async getOfferById(@Param('offerId') offerId: string) {
    return this.forwardRequest('GET', `/offers/${offerId}`);
  }

  @Get()
  async getAllOffers() {
    return this.forwardRequest('GET', '/offers');
  }

  @Delete(':offerId')
  async deleteOffer(@Param('offerId') offerId: string, @Body() body: unknown) {
    return this.forwardRequest('DELETE', `/offers/${offerId}`, body);
  }
}
