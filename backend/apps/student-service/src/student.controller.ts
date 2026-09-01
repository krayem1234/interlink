import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { StudentService } from './student.service';

@Controller()
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  // Profile endpoints
  @Post('students/profile')
  async createOrUpdateProfile(
    @Body() body: {
      userId: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      linkedinUrl?: string;
      githubUrl?: string;
      skills?: string[];
    }
  ) {
    return this.studentService.createOrUpdateProfile(body.userId, body);
  }

  @Get('students/profile/:userId')
  async getProfile(@Param('userId') userId: string) {
    return this.studentService.getProfile(userId);
  }

  @Get('students/:studentId')
  async getProfileById(@Param('studentId') studentId: string) {
    return this.studentService.getProfileById(studentId);
  }

  @Delete('students/profile/:userId')
  async deleteProfile(@Param('userId') userId: string) {
    return this.studentService.deleteProfile(userId);
  }

  // CV endpoints
  @Post('students/cv')
  async uploadCV(
    @Body() body: {
      userId: string;
      fileName: string;
      storageKey: string;
      mimeType?: string;
      sizeBytes?: number;
    }
  ) {
    return this.studentService.uploadCV(body.userId, body);
  }

  @Get('students/:userId/cv')
  async getCVs(@Param('userId') userId: string) {
    return this.studentService.getCVs(userId);
  }

  @Delete('students/cv/:documentId')
  async deleteCV(
    @Param('documentId') documentId: string,
    @Body() body: { userId: string }
  ) {
    return this.studentService.deleteCV(body.userId, documentId);
  }

  // Admin endpoints
  @Get('students/admin/students')
  async getAllStudents() {
    return this.studentService.getAllStudents();
  }
}
