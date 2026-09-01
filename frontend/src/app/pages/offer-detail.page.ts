import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../core/auth/auth.service';
import { OfferService } from '../core/offer/offer.service';
import { Offer } from '../core/offer/offer.models';
import { StudentService } from '../core/student/student.service';
import { ApplicationService } from '../core/application/application.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { StudentProfile, StudentDocument } from '../core/student/student.models';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterModule,
    DatePipe,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './offer-detail.page.html',
  styleUrl: './offer-detail.page.scss'
})
export class OfferDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly offerService = inject(OfferService);
  private readonly studentService = inject(StudentService);
  private readonly applicationService = inject(ApplicationService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly user = this.auth.user;
  readonly loading = signal(false);
  readonly loadingProfile = signal(false);
  readonly applying = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly offer = signal<Offer | null>(null);
  readonly studentProfile = signal<StudentProfile | null>(null);
  readonly cvs = signal<StudentDocument[]>([]);

  readonly applicationForm = this.fb.nonNullable.group({
    motivation: ['', Validators.required],
    cvDocumentId: ['', Validators.required]
  });

  async ngOnInit() {
    await this.loadOffer();
    await this.loadStudentProfileAndCVs();
  }

  async loadOffer() {
    try {
      this.loading.set(true);
      const offerId = this.route.snapshot.paramMap.get('offerId');
      if (!offerId) throw new Error('Offer ID not found');

      const result = await this.offerService.getOfferById(offerId);
      this.offer.set(result.offer);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Erreur lors du chargement de l\'offre');
    } finally {
      this.loading.set(false);
    }
  }

  async loadStudentProfileAndCVs() {
    if (this.user()?.role !== 'STUDENT') return;

    try {
      this.loadingProfile.set(true);
      const userId = this.user()?.id;
      if (!userId) return;

      // Load profile and CVs separately
      try {
        const profileResult = await this.studentService.getProfile(userId);
        this.studentProfile.set(profileResult.student);
      } catch {
        this.studentProfile.set(null);
      }

      try {
        const cvsResult = await this.studentService.getCVs(userId);
        this.cvs.set(cvsResult.documents);
      } catch {
        this.cvs.set([]);
      }
    } finally {
      this.loadingProfile.set(false);
    }
  }

  goBack(): void {
    this.router.navigateByUrl('/offers');
  }

  goToApplications(): void {
    this.router.navigateByUrl(`/offers/${this.offer()?.id}/applications`);
  }

  async apply(): Promise<void> {
    const studentId = this.studentProfile()?.id;
    if (
      this.applicationForm.invalid || 
      this.applying() || 
      !this.offer()?.id || 
      !studentId
    ) return;

    this.applying.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const values = this.applicationForm.getRawValue();
      
      await this.applicationService.createApplication({
        studentId: studentId,
        offerId: this.offer()!.id,
        motivation: values.motivation,
        cvDocumentId: values.cvDocumentId
      });

      this.snackBar.open('Candidature envoyée avec succès !', 'OK', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
      this.router.navigateByUrl('/offers');
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Erreur lors de l\'envoi de la candidature');
    } finally {
      this.applying.set(false);
    }
  }
}
