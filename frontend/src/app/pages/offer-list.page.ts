import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth/auth.service';
import { OfferService } from '../core/offer/offer.service';
import { Offer } from '../core/offer/offer.models';
import { CompanyService } from '../core/company/company.service';
import { CompanyProfile } from '../core/company/company.models';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FormsModule,
    RouterModule,
    DatePipe
  ],
  templateUrl: './offer-list.page.html',
  styleUrl: './offer-list.page.scss'
})
export class OfferListPage {
  private readonly auth = inject(AuthService);
  private readonly offerService = inject(OfferService);
  private readonly companyService = inject(CompanyService);
  private readonly router = inject(Router);

  readonly user = this.auth.user;
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly offers = signal<Offer[]>([]);
  readonly companyProfile = signal<CompanyProfile | null>(null);
  readonly searchTerm = signal('');
  readonly selectedType = signal<'ALL' | Offer['internship_type']>('ALL');
  readonly internshipTypes: Array<'ALL' | Offer['internship_type']> = ['ALL', 'PFE', 'SUMMER', 'ALTERNANCE'];
  readonly filteredOffers = computed(() => {
    const term = this.searchTerm().trim().toLocaleLowerCase();
    const type = this.selectedType();
    return this.offers().filter((offer) => {
      const matchesType = type === 'ALL' || offer.internship_type === type;
      const searchable = [offer.title, offer.description, offer.location || '', ...(offer.technologies || [])].join(' ').toLocaleLowerCase();
      return matchesType && (!term || searchable.includes(term));
    });
  });

  async ngOnInit() {
    await this.loadCompanyProfileIfNeeded();
    await this.loadOffers();
  }

  async loadCompanyProfileIfNeeded() {
    if (this.user()?.role !== 'COMPANY') return;
    try {
      const userId = this.user()?.id;
      if (!userId) return;
      const result = await this.companyService.getProfile(userId);
      this.companyProfile.set(result.company);
    } catch (error) {
      console.error('Error loading company profile:', error);
    }
  }

  async loadOffers() {
    try {
      this.loading.set(true);
      if (this.user()?.role === 'COMPANY' && this.companyProfile()) {
        const result = await this.offerService.getOffersByCompany(this.companyProfile()!.id);
        this.offers.set(result.offers);
      } else {
        const result = await this.offerService.getAllOffers();
        this.offers.set(result.offers);
      }
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Erreur lors du chargement des offres');
    } finally {
      this.loading.set(false);
    }
  }

  goToCreateOffer(): void {
    this.router.navigateByUrl('/offers/create');
  }

  goToOfferDetail(offerId: string): void {
    this.router.navigateByUrl(`/offers/${offerId}`);
  }

  goToApplications(offerId: string): void {
    this.router.navigateByUrl(`/offers/${offerId}/applications`);
  }

  typeLabel(type: 'ALL' | Offer['internship_type']): string {
    return { ALL: 'Toutes', PFE: 'PFE', SUMMER: 'Été', ALTERNANCE: 'Alternance' }[type];
  }
}
