import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Application, ApplicationStatus } from '../core/application/application.models';
import { ApplicationService } from '../core/application/application.service';
import { AuthService } from '../core/auth/auth.service';
import { StudentService } from '../core/student/student.service';

@Component({
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <main class="applications-page">
      <section class="applications-hero">
        <div>
          <p class="eyebrow">Espace étudiant</p>
          <h1>Mes candidatures</h1>
          <p>Suivez les réponses des entreprises et vos prochaines étapes.</p>
        </div>
        <a mat-flat-button color="primary" routerLink="/offers">
          <mat-icon>travel_explore</mat-icon>
          Explorer les offres
        </a>
      </section>

      <div *ngIf="loading()" class="loading-state"><mat-spinner diameter="42"></mat-spinner></div>
      <div *ngIf="errorMessage()" class="feedback error"><mat-icon>error_outline</mat-icon>{{ errorMessage() }}</div>

      <section *ngIf="!loading() && !errorMessage() && applications().length" class="application-list">
        <article *ngFor="let application of applications()" class="application-item">
          <div class="status-rail" [ngClass]="getStatusClass(application.status)"></div>
          <div class="application-main">
            <div class="application-heading">
              <div>
                <p class="offer-label">Offre de stage</p>
                <h2>{{ application.offer_title || 'Offre de stage' }}</h2>
              </div>
              <span class="status-chip" [ngClass]="getStatusClass(application.status)">
                <mat-icon>{{ getStatusIcon(application.status) }}</mat-icon>
                {{ getStatusLabel(application.status) }}
              </span>
            </div>

            <div class="response-panel" [ngClass]="getStatusClass(application.status)">
              <mat-icon>{{ getStatusIcon(application.status) }}</mat-icon>
              <div>
                <strong>{{ getResponseTitle(application.status) }}</strong>
                <p>{{ getResponseMessage(application.status) }}</p>
              </div>
            </div>

            <div class="application-meta">
              <span><mat-icon>event</mat-icon> Candidature envoyée le {{ application.created_at | date: 'dd/MM/yyyy' }}</span>
              <span *ngIf="application.interview_at"><mat-icon>schedule</mat-icon> Entretien : {{ application.interview_at | date: 'dd/MM/yyyy à HH:mm' }}</span>
              <span *ngIf="application.status === 'INTERVIEW' && !application.interview_at"><mat-icon>schedule</mat-icon> Date d'entretien en attente de confirmation</span>
            </div>
          </div>
            <div class="application-actions">
              <a mat-stroked-button color="primary" [routerLink]="['/messages', application.id]">
                <mat-icon>forum</mat-icon>
                Ouvrir la messagerie
              </a>
            </div>
        </article>
      </section>

      <section *ngIf="!loading() && !errorMessage() && !applications().length" class="empty-state">
        <div class="empty-icon"><mat-icon>work_outline</mat-icon></div>
        <h2>Aucune candidature pour le moment</h2>
        <p>Lorsque vous postulerez, les réponses des entreprises apparaîtront ici.</p>
        <a mat-flat-button color="primary" routerLink="/offers">Voir les offres</a>
      </section>
    </main>
  `,
  styleUrl: './my-applications.page.scss'
})
export class MyApplicationsPage {
  private readonly auth = inject(AuthService);
  private readonly studentService = inject(StudentService);
  private readonly applicationService = inject(ApplicationService);

  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly applications = signal<Application[]>([]);

  async ngOnInit(): Promise<void> {
    try {
      const userId = this.auth.user()?.id;
      if (!userId) throw new Error('Session introuvable.');
      const profile = await this.studentService.getProfile(userId);
      const result = await this.applicationService.getApplicationsByStudent(profile.student.id);
      this.applications.set(result.applications);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossible de charger vos candidatures.');
    } finally {
      this.loading.set(false);
    }
  }

  getStatusLabel(status: ApplicationStatus): string {
    return { PENDING: 'En attente', INTERVIEW: 'Entretien', ACCEPTED: 'Acceptée', REJECTED: 'Non retenue', CONTRACT: 'Contrat', STARTED: 'Stage commencé' }[status];
  }

  getStatusClass(status: ApplicationStatus): string {
    return status.toLowerCase();
  }

  getStatusIcon(status: ApplicationStatus): string {
    return { PENDING: 'hourglass_top', INTERVIEW: 'event_available', ACCEPTED: 'check_circle', REJECTED: 'cancel', CONTRACT: 'description', STARTED: 'rocket_launch' }[status];
  }

  getResponseTitle(status: ApplicationStatus): string {
    return { PENDING: 'Votre candidature est en cours d’examen', INTERVIEW: 'L’entreprise vous propose un entretien', ACCEPTED: 'Félicitations, votre candidature est acceptée', REJECTED: 'L’entreprise a rendu sa décision', CONTRACT: 'Un contrat vous attend', STARTED: 'Votre stage a commencé' }[status];
  }

  getResponseMessage(status: ApplicationStatus): string {
    return { PENDING: 'L’entreprise n’a pas encore communiqué sa décision.', INTERVIEW: 'Consultez la date indiquée ci-dessous et préparez votre échange.', ACCEPTED: 'L’entreprise souhaite poursuivre avec vous. Elle vous contactera pour les prochaines étapes.', REJECTED: 'Cette candidature n’a pas été retenue. Continuez à explorer les autres opportunités.', CONTRACT: 'La candidature est passée à l’étape contractuelle.', STARTED: 'Votre parcours de stage est maintenant en cours.' }[status];
  }
}






