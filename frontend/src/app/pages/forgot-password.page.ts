import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../core/auth/auth.service';

type ResetMethod = 'otp' | 'questions';
type Step = 'email' | 'method' | 'reset' | 'success';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return newPassword && confirmPassword && newPassword !== confirmPassword
    ? { passwordsMismatch: true }
    : null;
}

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './forgot-password.page.html',
  styleUrl: './forgot-password.page.scss'
})
export class ForgotPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly step = signal<Step>('email');
  readonly method = signal<ResetMethod | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly devOtp = signal('');
  readonly securityQuestions = signal<string[]>([]);
  readonly hasSecurityQuestions = signal(false);
  readonly showNewPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  readonly resetForm = this.fb.nonNullable.group(
    {
      otp: [''],
      answer1: [''],
      answer2: [''],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    },
    { validators: passwordsMatch }
  );

  readonly stepIndex = signal(0);

  async submitEmail(): Promise<void> {
    if (this.emailForm.invalid || this.loading()) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const email = this.emailForm.getRawValue().email;

    try {
      const result = await this.auth.getSecurityQuestions(email);
      this.hasSecurityQuestions.set(result.length >= 2);
      this.securityQuestions.set(result);
      this.step.set('method');
      this.stepIndex.set(1);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Erreur lors de la vérification');
    } finally {
      this.loading.set(false);
    }
  }

  selectMethod(selected: ResetMethod): void {
    if (selected === 'questions' && !this.hasSecurityQuestions()) {
      this.errorMessage.set('Aucune question de sécurité configurée pour ce compte.');
      return;
    }

    this.method.set(selected);
    this.errorMessage.set('');
    this.resetForm.reset({ newPassword: '', confirmPassword: '', otp: '', answer1: '', answer2: '' });
    this.step.set('reset');
    this.stepIndex.set(2);
  }

  async submitReset(): Promise<void> {
    if (this.resetForm.invalid || this.loading()) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const email = this.emailForm.getRawValue().email;
    const values = this.resetForm.getRawValue();
    const selectedMethod = this.method();

    if (selectedMethod === 'otp' && !values.otp) {
      this.errorMessage.set('Veuillez saisir le code OTP.');
      return;
    }

    if (selectedMethod === 'questions' && (!values.answer1 || !values.answer2)) {
      this.errorMessage.set('Veuillez répondre aux deux questions.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      if (selectedMethod === 'otp') {
        await this.auth.resetPasswordWithOtp(email, values.otp, values.newPassword);
      } else {
        await this.auth.resetPasswordWithQuestions(
          email,
          [values.answer1, values.answer2],
          values.newPassword
        );
      }

      this.successMessage.set('Votre mot de passe a été réinitialisé avec succès.');
      this.step.set('success');
      this.stepIndex.set(3);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Réinitialisation échouée');
    } finally {
      this.loading.set(false);
    }
  }

  async requestOtp(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const result = await this.auth.requestPasswordOtp(this.emailForm.getRawValue().email);
      if (result.devOtp) {
        this.devOtp.set(result.devOtp);
        this.resetForm.patchValue({ otp: result.devOtp });
      }
      this.successMessage.set(
        result.devOtp
          ? `Code OTP généré (mode dev) : ${result.devOtp}`
          : 'Un code OTP a été envoyé à votre adresse email.'
      );
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Envoi OTP échoué');
    } finally {
      this.loading.set(false);
    }
  }

  goBack(): void {
    const current = this.step();
    if (current === 'reset') {
      this.step.set('method');
      this.stepIndex.set(1);
      this.errorMessage.set('');
      this.successMessage.set('');
    } else if (current === 'method') {
      this.step.set('email');
      this.stepIndex.set(0);
      this.errorMessage.set('');
    }
  }

  toggleNewPassword(): void {
    this.showNewPassword.update((v) => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((v) => !v);
  }
}
