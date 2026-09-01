import { Body, Controller, Get, HttpException, Post, Put, Param } from '@nestjs/common';

@Controller('auth')
export class AuthProxyController {
  private readonly authBaseUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

  @Get('health')
  async health() {
    return this.forwardRequest('GET', '/health');
  }

  @Post('register')
  async register(@Body() body: unknown) {
    return this.forwardRequest('POST', '/auth/register', body);
  }

  @Post('login')
  async login(@Body() body: unknown) {
    return this.forwardRequest('POST', '/auth/login', body);
  }

  @Post('google')
  async googleLogin(@Body() body: unknown) {
    return this.forwardRequest('POST', '/auth/google', body);
  }

  @Post('change-password')
  async changePassword(@Body() body: unknown) {
    return this.forwardRequest('POST', '/auth/change-password', body);
  }

  @Post('security-questions')
  async getSecurityQuestions(@Body() body: unknown) {
    return this.forwardRequest('POST', '/auth/security-questions', body);
  }

  @Post('refresh')
  async refresh(@Body() body: unknown) {
    return this.forwardRequest('POST', '/auth/refresh', body);
  }

  @Post('forgot-password/request-otp')
  async requestOtp(@Body() body: unknown) {
    return this.forwardRequest('POST', '/auth/forgot-password/request-otp', body);
  }

  @Post('forgot-password/verify-otp')
  async verifyOtp(@Body() body: unknown) {
    return this.forwardRequest('POST', '/auth/forgot-password/verify-otp', body);
  }

  @Post('forgot-password/reset')
  async resetPassword(@Body() body: unknown) {
    return this.forwardRequest('POST', '/auth/forgot-password/reset', body);
  }

  @Post('forgot-password/reset-with-questions')
  async resetPasswordWithSecurityQuestions(@Body() body: unknown) {
    return this.forwardRequest('POST', '/auth/forgot-password/reset-with-questions', body);
  }

  // --- User password change request endpoints ---
  @Post('request-password-change')
  async requestPasswordChange(@Body() body: unknown) {
    return this.forwardRequest('POST', '/auth/request-password-change', body);
  }

  // --- Admin endpoints ---
  @Get('admin/users')
  async getAllUsers() {
    return this.forwardRequest('GET', '/auth/admin/users');
  }

  @Put('admin/users/:userId/block')
  async blockUser(@Param('userId') userId: string) {
    return this.forwardRequest('PUT', `/auth/admin/users/${userId}/block`);
  }

  @Put('admin/users/:userId/unblock')
  async unblockUser(@Param('userId') userId: string) {
    return this.forwardRequest('PUT', `/auth/admin/users/${userId}/unblock`);
  }

  @Get('admin/password-change-requests')
  async getPendingPasswordChangeRequests() {
    return this.forwardRequest('GET', '/auth/admin/password-change-requests');
  }

  @Put('admin/password-change-requests/:requestId/approve')
  async approvePasswordChange(@Param('requestId') requestId: string) {
    return this.forwardRequest('PUT', `/auth/admin/password-change-requests/${requestId}/approve`);
  }

  @Put('admin/password-change-requests/:requestId/reject')
  async rejectPasswordChange(@Param('requestId') requestId: string) {
    return this.forwardRequest('PUT', `/auth/admin/password-change-requests/${requestId}/reject`);
  }

  private async forwardRequest(method: 'GET' | 'POST' | 'PUT', path: string, body?: unknown) {
    const response = await fetch(`${this.authBaseUrl}${path}`, {
      method,
      headers: {
        'content-type': 'application/json'
      },
      body: method === 'POST' || method === 'PUT' ? JSON.stringify(body || {}) : undefined
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
}

