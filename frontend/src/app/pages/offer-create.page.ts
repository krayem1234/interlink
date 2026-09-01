import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { OfferService } from '../core/offer/offer.service';
import { CompanyService } from '../core/company/company.service';
import { CompanyProfile } from '../core/company/company.models';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatChipsModule
  ],
  templateUrl: './offer-create.page.html',
  styleUrl: './offer-create.page.scss'
})
export class OfferCreatePage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly offerService = inject(OfferService);
  private readonly companyService = inject(CompanyService);
  private readonly router = inject(Router);

  readonly user = this.auth.user;
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly companyProfile = signal<CompanyProfile | null>(null);
  readonly technologiesInput = signal('');

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    durationWeeks: [1, [Validators.required, Validators.min(1)]],
    internshipType: ['PFE' as const, Validators.required],
    seats: [1, [Validators.required, Validators.min(1)]],
    deadline: ['', Validators.required],
    location: ['']
  });

  readonly technologies = signal<string[]>([]);

  async ngOnInit() {
    await this.loadCompanyProfile();
  }

  async loadCompanyProfile() {
    try {
      const userId = this.user()?.id;
      if (!userId) return;
      const result = await this.companyService.getProfile(userId);
      this.companyProfile.set(result.company);
    } catch (error) {
      this.errorMessage.set('Vous devez compléter votre profil entreprise avant de publier des offres');
    }
  }

  addTechnology() {
    const tech = this.technologiesInput().trim();
    if (tech && !this.technologies().includes(tech)) {
      this.technologies.update(prev => [...prev, tech]);
      this.technologiesInput.set('');
    }
  }

  removeTechnology(tech: string) {
    this.technologies.update(prev => prev.filter(t => t !== tech));
  }

  async createOffer(): Promise<void> {
    if (this.form.invalid || this.loading()) return;

    const companyId = this.companyProfile()?.id;
    if (!companyId) {
      this.errorMessage.set('Profil entreprise non trouvé');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const values = this.form.getRawValue();
      const result = await this.offerService.createOffer({
        companyId,
        title: values.title,
        description: values.description,
        technologies: this.technologies(),
        durationWeeks: values.durationWeeks,
        internshipType: values.internshipType,
        seats: values.seats,
        deadline: values.deadline,
        location: values.location
      });

      this.successMessage.set(result.message);
      
      setTimeout(() => {
        this.router.navigateByUrl('/offers');
      }, 1500);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Erreur lors de la création de l\'offre');
    } finally {
      this.loading.set(false);
    }
  }

  goBack(): void {
    this.router.navigateByUrl('/offers');
  }
}
