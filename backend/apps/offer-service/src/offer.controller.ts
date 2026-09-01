import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { OfferService } from './offer.service';

@Controller()
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Post('offers')
  async createOffer(
    @Body() body: {
      companyId: string;
      title: string;
      description: string;
      technologies?: string[];
      durationWeeks: number;
      internshipType: 'PFE' | 'SUMMER' | 'ALTERNANCE';
      seats?: number;
      deadline: string;
      location?: string;
    }
  ) {
    return this.offerService.createOffer(body.companyId, body);
  }

  @Put('offers/:offerId')
  async updateOffer(
    @Param('offerId') offerId: string,
    @Body() body: {
      companyId: string;
      title?: string;
      description?: string;
      technologies?: string[];
      durationWeeks?: number;
      internshipType?: 'PFE' | 'SUMMER' | 'ALTERNANCE';
      seats?: number;
      deadline?: string;
      location?: string;
    }
  ) {
    return this.offerService.updateOffer(offerId, body.companyId, body);
  }

  @Get('offers/company/:companyId')
  async getOffersByCompany(@Param('companyId') companyId: string) {
    return this.offerService.getOffersByCompany(companyId);
  }

  @Get('offers/:offerId')
  async getOfferById(@Param('offerId') offerId: string, @Body() body?: { companyId?: string }) {
    return this.offerService.getOfferById(offerId, body?.companyId);
  }

  @Get('offers')
  async getAllOffers() {
    return this.offerService.getAllOffers();
  }

  @Delete('offers/:offerId')
  async deleteOffer(
    @Param('offerId') offerId: string,
    @Body() body: { companyId: string }
  ) {
    return this.offerService.deleteOffer(offerId, body.companyId);
  }
}
