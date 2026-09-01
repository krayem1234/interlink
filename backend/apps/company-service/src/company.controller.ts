import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CompanyService } from './company.service';

@Controller()
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  // Profile endpoints
  @Post('companies/profile')
  async createOrUpdateProfile(
    @Body() body: {
      userId: string;
      name?: string;
      address?: string;
      website?: string;
      description?: string;
      sector?: string;
    }
  ) {
    return this.companyService.createOrUpdateProfile(body.userId, body);
  }

  @Get('companies/profile/:userId')
  async getProfile(@Param('userId') userId: string) {
    return this.companyService.getProfile(userId);
  }

  @Get('companies/:companyId')
  async getProfileById(@Param('companyId') companyId: string) {
    return this.companyService.getProfileById(companyId);
  }

  @Delete('companies/profile/:userId')
  async deleteProfile(@Param('userId') userId: string) {
    return this.companyService.deleteProfile(userId);
  }

  // Admin endpoints
  @Get('companies/admin/companies')
  async getAllCompanies() {
    return this.companyService.getAllCompanies();
  }

  @Put('companies/admin/companies/:companyId/validate')
  async validateCompany(
    @Param('companyId') companyId: string,
    @Body() body: { validated: boolean }
  ) {
    return this.companyService.validateCompany(companyId, body.validated);
  }
}
