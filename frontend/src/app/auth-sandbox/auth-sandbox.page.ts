import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  templateUrl: './auth-sandbox.page.html',
  styleUrl: './auth-sandbox.page.scss'
})
export class AuthSandboxPage {
  private readonly fb = inject(FormBuilder);
  private lastOtp: string | null = null;

  readonly registerForm = this.fb.nonNullable.group({
    email: ['student1@internlink.local', [Validators.required, Validators.email]],
    password: ['StrongPass123', [Validators.required, Validators.minLength(8)]],
    role: ['STUDENT', Validators.required]
  });

  readonly loginForm = this.fb.nonNullable.group({
    email: ['student1@internlink.local', [Validators.required, Validators.email]],
    password: ['StrongPass123', [Validators.required]]
  });

  readonly refreshForm = this.fb.nonNullable.group({
    refreshToken: ['', [Validators.required]]
  });

  readonly otpRequestForm = this.fb.nonNullable.group({
    email: ['student1@internlink.local', [Validators.required, Validators.email]]
  });

  readonly otpVerifyForm = this.fb.nonNullable.group({
    email: ['student1@internlink.local', [Validators.required, Validators.email]],
    otp: ['', [Validators.required]]
  });

  readonly resetForm = this.fb.nonNullable.group({
    email: ['student1@internlink.local', [Validators.required, Validators.email]],
    otp: ['', [Validators.required]],
    newPassword: ['NewStrongPass123', [Validators.required, Validators.minLength(8)]]
  });

  statusMessage = 'Aucune action effectuée.';
  responseText = '{}';
  lastLogin: { accessToken?: string; refreshToken?: string } | null = null;

  async register() {
    return this.callApi('/api/auth/register', this.registerForm.getRawValue());
  }

  async login() {
    const result = await this.callApi('/api/auth/login', this.loginForm.getRawValue());
    if (result && typeof result === 'object') {
      this.lastLogin = result as { accessToken?: string; refreshToken?: string };
      this.refreshForm.patchValue({ refreshToken: this.lastLogin.refreshToken || '' });
    }
  }

  async refresh() {
    return this.callApi('/api/auth/refresh', this.refreshForm.getRawValue());
  }

  async requestOtp() {
    const result = await this.callApi('/api/auth/forgot-password/request-otp', this.otpRequestForm.getRawValue());

    if (result && typeof result === 'object' && 'devOtp' in result) {
      const devOtp = String((result as { devOtp?: string }).devOtp || '');
      this.lastOtp = devOtp;
      this.otpVerifyForm.patchValue({ otp: devOtp });
      this.resetForm.patchValue({ otp: devOtp });
      this.statusMessage = 'OTP genere et pre-rempli dans les formulaires de verification.';
    }

    return result;
  }

  async verifyOtp() {
    if (!this.otpVerifyForm.getRawValue().otp && this.lastOtp) {
      this.otpVerifyForm.patchValue({ otp: this.lastOtp });
    }
    return this.callApi('/api/auth/forgot-password/verify-otp', this.otpVerifyForm.getRawValue());
  }

  async resetPassword() {
    if (!this.resetForm.getRawValue().otp && this.lastOtp) {
      this.resetForm.patchValue({ otp: this.lastOtp });
    }
    return this.callApi('/api/auth/forgot-password/reset', this.resetForm.getRawValue());
  }

  private async callApi(path: string, body: unknown) {
    this.statusMessage = `Appel en cours: ${path}`;

    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const payload = await response.json();
      this.responseText = JSON.stringify(payload, null, 2);
      this.statusMessage = response.ok ? `Succès: ${path}` : `Erreur ${response.status}: ${path}`;
      return payload;
    } catch (error) {
      this.responseText = JSON.stringify({ error: 'Unable to reach API Gateway' }, null, 2);
      this.statusMessage = `Erreur reseau: ${path}`;
      return null;
    }
  }
}
