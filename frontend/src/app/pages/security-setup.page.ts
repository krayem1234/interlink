import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../core/auth/auth.service';
import { SECURITY_QUESTION_SUGGESTIONS } from '../core/auth/auth.models';

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
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './security-setup.page.html',
  styleUrl: './security-setup.page.scss'
})
export class SecuritySetupPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly showCurrentPassword = signal(false);
  readonly showNewPassword = signal(false);
  readonly questionSuggestions = SECURITY_QUESTION_SUGGESTIONS;

  readonly form = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      question1: [SECURITY_QUESTION_SUGGESTIONS[0], [Validators.required, Validators.minLength(5)]],
      answer1: ['', [Validators.required, Validators.minLength(2)]],
      question2: [SECURITY_QUESTION_SUGGESTIONS[1], [Validators.required, Validators.minLength(5)]],
      answer2: ['', [Validators.required, Validators.minLength(2)]]
    },
    { validators: passwordsMatch }
  );

  async submit(): Promise<void> {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    const user = this.auth.user();
    if (!user) {
      await this.router.navigateByUrl('/signin');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const values = this.form.getRawValue();

    try {
      await this.auth.changePassword({
        email: user.email,
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        securityQuestions: [
          { question: values.question1, answer: values.answer1 },
          { question: values.question2, answer: values.answer2 }
        ]
      });
      await this.router.navigateByUrl('/dashboard');
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Configuration échouée');
    } finally {
      this.loading.set(false);
    }
  }

  toggleCurrentPassword(): void {
    this.showCurrentPassword.update((v) => !v);
  }

  toggleNewPassword(): void {
    this.showNewPassword.update((v) => !v);
  }
}
