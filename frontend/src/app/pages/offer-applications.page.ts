import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../core/auth/auth.service';
import { OfferService } from '../core/offer/offer.service';
import { Offer } from '../core/offer/offer.models';
import { ApplicationService } from '../core/application/application.service';
import { Application, ApplicationStatus } from '../core/application/application.models';
import { CompanyService } from '../core/company/company.service';
import { CompanyProfile } from '../core/company/company.models';

@Component({
  selector: 'app-offer-applications',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    ReactiveFormsModule,
    DatePipe
  ],
  template: `
    <div class="offer-applications-page">
      <div class="page-header">
        <button mat-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          Retour
        </button>
        <h1>Candidatures pour l'offre</h1>
      </div>

      <div *ngIf="loading()" class="loading-container">
        <mat-spinner diameter="48"></mat-spinner>
      </div>

      <div *ngIf="errorMessage()" class="error-message">
        {{ errorMessage() }}
      </div>

      <div *ngIf="offer()" class="offer-summary">
        <h2>{{ offer()?.title }}</h2>
        <p>{{ offer()?.description }}</p>
      </div>

      <div *ngIf="!loading() && !errorMessage()" class="applications-grid">
        <mat-card *ngFor="let app of applications()" class="application-card">
          <mat-card-header>
            <mat-card-title>{{ app.first_name }} {{ app.last_name }}</mat-card-title>
            <mat-card-subtitle>{{ app.email }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="status-badge" [ngClass]="getStatusClass(app.status)">
              {{ getStatusLabel(app.status) }}
            </div>
            <p *ngIf="app.phone" class="phone">Téléphone: {{ app.phone }}</p>
            <p *ngIf="app.motivation" class="motivation">
              <strong>Lettre de motivation:</strong><br>
              {{ app.motivation }}
            </p>
            <div *ngIf="app.cv_file_name" class="cv-link">
              <button mat-button color="primary" (click)="downloadCV(app.cv_storage_key!)">
                <mat-icon>download</mat-icon>
                Télécharger CV: {{ app.cv_file_name }}
              </button>
            </div>
            <div class="dates">
              <span>Candidature: {{ app.created_at | date: 'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="application-messaging">
              <button mat-stroked-button color="primary" (click)="openConversation(app.id)">
                <mat-icon>forum</mat-icon>
                Voir les messages du candidat
              </button>
            </div>
            <div class="status-update">
              <mat-form-field appearance="fill">
                <mat-label>Modifier le statut</mat-label>
                <mat-select [formControl]="$any(statusForm.get(app.id)!.get('status'))">
                  <mat-option value="PENDING">En attente</mat-option>
                  <mat-option value="INTERVIEW">Entretien</mat-option>
                  <mat-option value="ACCEPTED">Accepté</mat-option>
                  <mat-option value="REJECTED">Refusé</mat-option>
                  <mat-option value="CONTRACT">Contrat</mat-option>
                  <mat-option value="STARTED">Démarré</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="fill">
                <mat-label>Date d'entretien {{ statusForm.get(app.id)?.get('status')?.value === 'INTERVIEW' ? '(obligatoire)' : '(optionnelle)' }}</mat-label>
                <input matInput type="datetime-local" [formControl]="$any(statusForm.get(app.id)!.get('interviewAt'))">
                <mat-error *ngIf="statusForm.get(app.id)?.get('interviewAt')?.hasError('required')">Indiquez la date et l'heure de l'entretien.</mat-error>
              </mat-form-field>
              <button mat-raised-button color="primary" (click)="updateStatus(app.id)" [disabled]="statusForm.get(app.id)!.invalid || statusUpdating(app.id)">
                <mat-spinner *ngIf="statusUpdating(app.id)" diameter="20"></mat-spinner>
                <span *ngIf="!statusUpdating(app.id)">Mettre à jour</span>
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <div *ngIf="applications().length === 0" class="empty-state">
          <mat-icon>people_off</mat-icon>
          <p>Aucune candidature pour le moment</p>
        </div>
      </div>
    </div>
  `,
  styleUrl: './offer-list.page.scss'
})
export class OfferApplicationsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly offerService = inject(OfferService);
  private readonly applicationService = inject(ApplicationService);
  private readonly companyService = inject(CompanyService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly offer = signal<Offer | null>(null);
  readonly applications = signal<Application[]>([]);
  readonly companyProfile = signal<CompanyProfile | null>(null);
  readonly statusForm = this.fb.group({});
  private readonly _statusUpdating = new Map<string, boolean>();

  openConversation(applicationId: string): void {
    this.router.navigate(["/messages", applicationId]);
  }

  statusUpdating(id: string): boolean {
    return this._statusUpdating.get(id) || false;
  }

  async ngOnInit() {
    const offerId = this.route.snapshot.paramMap.get('offerId');
    if (!offerId) {
      this.errorMessage.set('Offre non trouvée');
      return;
    }

    await this.loadCompanyProfile();
    await this.loadOffer(offerId);
    await this.loadApplications(offerId);
  }

  async loadCompanyProfile() {
    try {
      const userId = this.auth.user()?.id;
      if (!userId) return;
      const result = await this.companyService.getProfile(userId);
      this.companyProfile.set(result.company);
    } catch (error) {
      console.error('Error loading company profile:', error);
    }
  }

  async loadOffer(offerId: string) {
    try {
      const result = await this.offerService.getOfferById(offerId);
      this.offer.set(result.offer);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Erreur lors du chargement de l\'offre');
    }
  }

  async loadApplications(offerId: string) {
    try {
      this.loading.set(true);
      const companyId = this.companyProfile()?.id;
      if (!companyId) {
        this.errorMessage.set('Profil entreprise non trouvé');
        return;
      }

      const result = await this.applicationService.getApplicationsByOffer(offerId, companyId);
      this.applications.set(result.applications);

      // Initialize form controls for each application
      result.applications.forEach(app => {
        const form = this.fb.group({
          status: [app.status, Validators.required],
          interviewAt: [app.interview_at ? new Date(app.interview_at).toISOString().slice(0, 16) : '']
        });
        this.setInterviewDateValidation(form);
        form.controls.status.valueChanges.subscribe(() => this.setInterviewDateValidation(form));
        this.statusForm.setControl(app.id, form);
      });
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Erreur lors du chargement des candidatures');
    } finally {
      this.loading.set(false);
    }
  }

  async updateStatus(applicationId: string) {
    const formGroup = this.statusForm.get(applicationId);
    if (!formGroup?.valid) return;

    this._statusUpdating.set(applicationId, true);
    try {
      const companyId = this.companyProfile()?.id;
      if (!companyId) return;

      await this.applicationService.updateApplicationStatus(applicationId, {
        companyId,
        status: formGroup.value.status as ApplicationStatus,
        interviewAt: formGroup.value.interviewAt || undefined
      });

      await this.loadApplications(this.offer()!.id!);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    } finally {
      this._statusUpdating.set(applicationId, false);
    }
  }

  private setInterviewDateValidation(form: ReturnType<FormBuilder['group']>): void {
    const interviewAt = form.get('interviewAt');
    if (!interviewAt) return;
    if (form.get('status')?.value === 'INTERVIEW') {
      interviewAt.setValidators([Validators.required]);
    } else {
      interviewAt.clearValidators();
    }
    interviewAt.updateValueAndValidity({ emitEvent: false });
  }

  downloadCV(filePath: string) {
    window.open(filePath, '_blank');
  }

  goBack() {
    this.router.navigateByUrl('/offers');
  }

  getStatusLabel(status: ApplicationStatus): string {
    const labels: Record<ApplicationStatus, string> = {
      PENDING: 'En attente',
      INTERVIEW: 'Entretien',
      ACCEPTED: 'Accepté',
      REJECTED: 'Refusé',
      CONTRACT: 'Contrat',
      STARTED: 'Démarré'
    };
    return labels[status] || status;
  }

  getStatusClass(status: ApplicationStatus): string {
    const classes: Record<ApplicationStatus, string> = {
      PENDING: 'pending',
      INTERVIEW: 'interview',
      ACCEPTED: 'accepted',
      REJECTED: 'rejected',
      CONTRACT: 'contract',
      STARTED: 'started'
    };
    return classes[status] || '';
  }
}



