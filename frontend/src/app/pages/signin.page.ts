import { AfterViewInit, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../core/auth/auth.service';

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
  templateUrl: './signin.page.html',
  styleUrl: './signin.page.scss'
})
export class SigninPage implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly showPassword = signal(false);
  readonly googleClientId = '129711183527-q7mm5fs45sj8r0vfqv5ajh5c9ik6t2bc.apps.googleusercontent.com';

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  ngAfterViewInit(): void {
    this.renderGoogleButton();
  }

  private renderGoogleButton(attempt = 0): void {
    const googleApi = (window as any).google;
    const container = document.getElementById('google-signin-button');
    if (!googleApi?.accounts?.id || !container) {
      if (attempt < 20) setTimeout(() => this.renderGoogleButton(attempt + 1), 250);
      return;
    }
    googleApi.accounts.id.initialize({
      client_id: this.googleClientId,
      callback: (response: { credential?: string }) => void this.handleGoogleCredential(response.credential)
    });
    googleApi.accounts.id.renderButton(container, { theme: 'outline', size: 'large', width: 360, text: 'continue_with' });
  }

  private async handleGoogleCredential(credential?: string): Promise<void> {
    if (!credential || this.loading()) return;
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      await this.auth.googleLogin(credential);
      await this.router.navigateByUrl(this.auth.getPostLoginRoute());
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Connexion Google échouée');
    } finally {
      this.loading.set(false);
    }
  }
  async submit(): Promise<void> {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      await this.auth.login(this.form.getRawValue());
      await this.router.navigateByUrl(this.auth.getPostLoginRoute());
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Connexion Ã©chouÃ©e');
    } finally {
      this.loading.set(false);
    }
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }
}

