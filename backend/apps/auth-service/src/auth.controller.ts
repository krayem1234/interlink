import { Body, Controller, Get, Post, Put, Param } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('health')
  health() {
    return {
      service: 'auth-service',
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  }

  @Post('auth/register')
  register(
    @Body()
    payload: {
      email?: string;
      password?: string;
      role?: 'STUDENT' | 'COMPANY' | 'ADMIN';
    }
  ) {
    return this.authService.register(payload);
  }

  @Post('auth/login')
  login(
    @Body()
    payload: {
      email?: string;
      password?: string;
    }
  ) {
    return this.authService.login(payload);
  }

  @Post('auth/google')
  googleLogin(@Body() payload: { credential?: string }) {
    return this.authService.googleLogin(payload);
  }

  @Post('auth/change-password')
  changePassword(
    @Body()
    payload: {
      email?: string;
      currentPassword?: string;
      newPassword?: string;
      securityQuestions?: Array<{ question?: string; answer?: string }>;
    }
  ) {
    return this.authService.changePassword(payload);
  }

  @Post('auth/security-questions')
  getSecurityQuestions(
    @Body()
    payload: {
      email?: string;
    }
  ) {
    return this.authService.getSecurityQuestions(payload);
  }

  @Post('auth/refresh')
  refresh(
    @Body()
    payload: {
      refreshToken?: string;
    }
  ) {
    return this.authService.refresh(payload);
  }

  @Post('auth/forgot-password/request-otp')
  requestOtp(
    @Body()
    payload: {
      email?: string;
    }
  ) {
    return this.authService.requestPasswordOtp(payload);
  }

  @Post('auth/forgot-password/verify-otp')
  verifyOtp(
    @Body()
    payload: {
      email?: string;
      otp?: string;
    }
  ) {
    return this.authService.verifyPasswordOtp(payload);
  }

  @Post('auth/forgot-password/reset')
  resetPassword(
    @Body()
    payload: {
      email?: string;
      otp?: string;
      newPassword?: string;
    }
  ) {
    return this.authService.resetPassword(payload);
  }

  @Post('auth/forgot-password/reset-with-questions')
  resetPasswordWithSecurityQuestions(
    @Body()
    payload: {
      email?: string;
      answers?: string[];
      newPassword?: string;
    }
  ) {
    return this.authService.resetPasswordWithSecurityQuestions(payload);
  }

  // --- User password change request endpoints ---
  @Post('auth/request-password-change')
  requestPasswordChange(
    @Body()
    payload: { userId?: string; newPassword?: string }
  ) {
    return this.authService.requestPasswordChange(payload);
  }

  // --- Admin endpoints ---
  @Get('auth/admin/users')
  getAllUsers() {
    return this.authService.getAllUsers();
  }

  @Put('auth/admin/users/:userId/block')
  blockUser(
    @Param('userId') userId: string
  ) {
    return this.authService.toggleUserBlock({ userId, blocked: true });
  }

  @Put('auth/admin/users/:userId/unblock')
  unblockUser(
    @Param('userId') userId: string
  ) {
    return this.authService.toggleUserBlock({ userId, blocked: false });
  }

  @Get('auth/admin/password-change-requests')
  getPendingPasswordChangeRequests() {
    return this.authService.getPendingPasswordChangeRequests();
  }

  @Put('auth/admin/password-change-requests/:requestId/approve')
  approvePasswordChange(
    @Param('requestId') requestId: string
  ) {
    return this.authService.approvePasswordChange({ requestId });
  }

  @Put('auth/admin/password-change-requests/:requestId/reject')
  rejectPasswordChange(
    @Param('requestId') requestId: string
  ) {
    return this.authService.rejectPasswordChange({ requestId });
  }
}

