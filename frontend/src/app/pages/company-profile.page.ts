import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../core/auth/auth.service';
import { CompanyService } from '../core/company/company.service';
import { CompanyProfile } from '../core/company/company.models';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DatePipe
  ],
  templateUrl: './company-profile.page.html',
  styleUrl: './company-profile.page.scss'
})
export class CompanyProfilePage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly companyService = inject(CompanyService);
  private readonly router = inject(Router);

  readonly user = this.auth.user;
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly companyProfile = signal<CompanyProfile | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    address: [''],
    website: [''],
    description: [''],
    sector: ['']
  });

  async ngOnInit() {
    await this.loadProfile();
  }

  async loadProfile() {
    try {
      const userId = this.user()?.id;
      if (!userId) return;

      const result = await this.companyService.getProfile(userId);
      this.companyProfile.set(result.company);
      this.form.patchValue({
        name: result.company.name,
        address: result.company.address || '',
        website: result.company.website || '',
        description: result.company.description || '',
        sector: result.company.sector || ''
      });
    } catch (error) {
      // Profile might not exist yet - that's okay
    }
  }

  async saveProfile(): Promise<void> {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const userId = this.user()?.id;
      if (!userId) throw new Error('User not found');

      const values = this.form.getRawValue();
      const result = await this.companyService.createOrUpdateProfile({
        userId,
        name: values.name,
        address: values.address,
        website: values.website,
        description: values.description,
        sector: values.sector
      });

      this.companyProfile.set(result.company);
      this.successMessage.set(result.message);
      
      // Rediriger vers le dashboard après 1,5 secondes
      setTimeout(() => {
        this.router.navigateByUrl('/dashboard');
      }, 1500);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement');
    } finally {
      this.loading.set(false);
    }
  }

  goBack(): void {
    this.router.navigateByUrl('/dashboard');
  }
}
