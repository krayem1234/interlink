import { Controller, Get, Post, Put, Delete, Body, Param, HttpException } from '@nestjs/common';

@Controller('students')
export class StudentProxyController {
  private readonly studentBaseUrl = process.env.STUDENT_SERVICE_URL || 'http://localhost:3002';

  private async forwardRequest(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown) {
    const response = await fetch(`${this.studentBaseUrl}${path}`, {
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
    return this.forwardRequest('POST', '/students/profile', body);
  }

  @Get('profile/:userId')
  async getProfile(@Param('userId') userId: string) {
    return this.forwardRequest('GET', `/students/profile/${userId}`);
  }

  @Get(':studentId')
  async getProfileById(@Param('studentId') studentId: string) {
    return this.forwardRequest('GET', `/students/${studentId}`);
  }

  @Delete('profile/:userId')
  async deleteProfile(@Param('userId') userId: string) {
    return this.forwardRequest('DELETE', `/students/profile/${userId}`);
  }

  // CV endpoints
  @Post('cv')
  async uploadCV(@Body() body: unknown) {
    return this.forwardRequest('POST', '/students/cv', body);
  }

  @Get(':userId/cv')
  async getCVs(@Param('userId') userId: string) {
    return this.forwardRequest('GET', `/students/${userId}/cv`);
  }

  @Delete('cv/:documentId')
  async deleteCV(@Param('documentId') documentId: string, @Body() body: unknown) {
    return this.forwardRequest('DELETE', `/students/cv/${documentId}`, body);
  }

  // Admin endpoints
  @Get('admin/students')
  async getAllStudents() {
    return this.forwardRequest('GET', '/students/admin/students');
  }
}
