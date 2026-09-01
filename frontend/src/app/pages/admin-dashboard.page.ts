import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../core/auth/auth.service';
import { StudentService } from '../core/student/student.service';
import { CompanyService } from '../core/company/company.service';
import { StudentProfile } from '../core/student/student.models';
import { CompanyProfile } from '../core/company/company.models';
import { AdminUser, PasswordChangeRequest } from '../core/auth/auth.models';

@Component({
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatProgressSpinnerModule, MatTooltipModule, RouterLink, DatePipe],
  templateUrl: './admin-dashboard.page.html',
  styleUrl: './admin-dashboard.page.scss'
})
export class AdminDashboardPage {
  private readonly auth = inject(AuthService);
  private readonly studentService = inject(StudentService);
  private readonly companyService = inject(CompanyService);

  readonly user = this.auth.user;
  readonly loading = signal(false);
  readonly students = signal<StudentProfile[]>([]);
  readonly companies = signal<CompanyProfile[]>([]);
  readonly users = signal<AdminUser[]>([]);
  readonly passwordChangeRequests = signal<PasswordChangeRequest[]>([]);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    try {
      const [studentsResult, companiesResult, usersResult, passwordRequestsResult] = await Promise.all([
        this.studentService.getAllStudents(),
        this.companyService.getAllCompanies(),
        this.auth.getAllUsers(),
        this.auth.getPendingPasswordChangeRequests()
      ]);
      this.students.set(studentsResult.students);
      this.companies.set(companiesResult.companies);
      this.users.set(usersResult);
      this.passwordChangeRequests.set(passwordRequestsResult);
    } catch (error) {
      this.errorMessage.set('Erreur lors du chargement des données');
      console.error(error);
    } finally {
      this.loading.set(false);
    }
  }

  async validateCompany(companyId: string, validated: boolean) {
    try {
      const result = await this.companyService.validateCompany(companyId, validated);
      this.companies.update(current => 
        current.map(company => company.id === companyId ? result.company : company)
      );
      this.successMessage.set(validated ? 'Entreprise validée avec succès' : 'Entreprise invalidée avec succès');
      setTimeout(() => this.successMessage.set(''), 3000);
    } catch (error) {
      this.errorMessage.set('Erreur lors de la validation de l\'entreprise');
      console.error(error);
    }
  }

  async toggleUserBlock(userId: string, block: boolean) {
    try {
      if (block) {
        await this.auth.blockUser(userId);
      } else {
        await this.auth.unblockUser(userId);
      }
      this.users.update(current => 
        current.map(user => 
          user.id === userId ? { ...user, isBlocked: block } : user)
      );
      this.successMessage.set(block ? 'Utilisateur bloqué avec succès' : 'Utilisateur débloqué avec succès');
      setTimeout(() => this.successMessage.set(''), 3000);
    } catch (error) {
      this.errorMessage.set('Erreur lors du blocage/déblocage de l\'utilisateur');
      console.error(error);
    }
  }

  async handlePasswordChangeRequest(requestId: string, approve: boolean) {
    try {
      if (approve) {
        await this.auth.approvePasswordChangeRequest(requestId);
      } else {
        await this.auth.rejectPasswordChangeRequest(requestId);
      }
      this.passwordChangeRequests.update(current => current.filter(r => r.id !== requestId));
      this.successMessage.set(approve ? 'Demande de changement de mot de passe approuvée' : 'Demande de changement de mot de passe refusée');
      setTimeout(() => this.successMessage.set(''), 3000);
    } catch (error) {
      this.errorMessage.set('Erreur lors du traitement de la demande');
      console.error(error);
    }
  }
}
