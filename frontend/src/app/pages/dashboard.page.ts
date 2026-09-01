import { Component, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { StudentService } from '../core/student/student.service';
import { CompanyService } from '../core/company/company.service';

@Component({
  standalone: true,
  imports: [MatCardModule, RouterLink],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss'
})
export class DashboardPage {
  private readonly auth = inject(AuthService);
  private readonly studentService = inject(StudentService);
  private readonly companyService = inject(CompanyService);

  readonly user = this.auth.user;
  readonly hasProfile = signal(false);

  readonly userName = computed(() => {
    const u = this.user();
    return u ? u.email.split('@')[0] : '';
  });

  readonly roleLabel = computed(() => {
    switch (this.user()?.role) {
      case 'COMPANY':
        return 'Entreprise';
      case 'ADMIN':
        return 'Administrateur';
      default:
        return 'Étudiant';
    }
  });

  readonly nextSteps = computed(() => {
    switch (this.user()?.role) {
      case 'COMPANY':
        return [
          'Compléter ton profil entreprise',
          'Publier une offre de stage',
          'Consulter les candidatures reçues'
        ];
      case 'ADMIN':
        return [
          'Valider les comptes entreprise',
          'Modérer les offres publiées',
          'Suivre les statistiques globales'
        ];
      default:
        return [
          'Compléter ton profil étudiant',
          'Uploader ton CV',
          'Explorer les offres disponibles'
        ];
    }
  });

  async ngOnInit() {
    await this.checkProfile();
  }

  async checkProfile() {
    try {
      const userId = this.user()?.id;
      if (!userId) return;
      
      const role = this.user()?.role;
      if (role === 'COMPANY') {
        await this.companyService.getProfile(userId);
      } else {
        await this.studentService.getProfile(userId);
      }
      this.hasProfile.set(true);
    } catch {
      this.hasProfile.set(false);
    }
  }
}
