import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { ApplicationService, ApplicationStatus } from './application.service';

@Controller()
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post('applications')
  async createApplication(@Body() body: { studentId: string; offerId: string; motivation?: string; cvDocumentId?: string }) {
    return this.applicationService.createApplication(body.studentId, body.offerId, body.motivation, body.cvDocumentId);
  }

  @Get('applications/student/:studentId')
  async getApplicationsByStudent(@Param('studentId') studentId: string) {
    return this.applicationService.getApplicationsByStudent(studentId);
  }

  @Get('applications/offer/:offerId')
  async getApplicationsByOffer(@Param('offerId') offerId: string, @Query('companyId') companyId: string) {
    return this.applicationService.getApplicationsByOffer(offerId, companyId);
  }

  @Get('applications/company/:companyId')
  async getApplicationsByCompany(@Param('companyId') companyId: string) {
    return this.applicationService.getApplicationsByCompany(companyId);
  }

  @Put('applications/:applicationId/status')
  async updateApplicationStatus(
    @Param('applicationId') applicationId: string,
    @Body() body: { companyId: string; status: ApplicationStatus; interviewAt?: string }
  ) {
    return this.applicationService.updateApplicationStatus(applicationId, body.companyId, body.status, body.interviewAt);
  }

  @Get('applications/:applicationId')
  async getApplicationById(
    @Param('applicationId') applicationId: string,
    @Query('studentId') studentId?: string,
    @Query('companyId') companyId?: string
  ) {
    return this.applicationService.getApplicationById(
      applicationId,
      studentId,
      companyId
    );
  }
}
