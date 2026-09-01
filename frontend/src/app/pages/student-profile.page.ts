import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../core/auth/auth.service';
import { StudentService } from '../core/student/student.service';
import { StudentProfile, StudentDocument } from '../core/student/student.models';
import { MatChipsModule } from '@angular/material/chips';
import { MatChipInputEvent, MatChipInput } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatChipInput,
    DatePipe
  ],
  templateUrl: './student-profile.page.html',
  styleUrl: './student-profile.page.scss'
})
export class StudentProfilePage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly studentService = inject(StudentService);
  private readonly router = inject(Router);

  readonly user = this.auth.user;
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly studentProfile = signal<StudentProfile | null>(null);
  readonly cvs = signal<StudentDocument[]>([]);
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: [''],
    linkedinUrl: [''],
    githubUrl: ['']
  });

  readonly skills = signal<string[]>([]);

  async ngOnInit() {
    await this.loadProfile();
    await this.loadCVs();
  }

  async loadProfile() {
    try {
      const userId = this.user()?.id;
      if (!userId) return;

      const result = await this.studentService.getProfile(userId);
      this.studentProfile.set(result.student);
      this.skills.set([...(result.student.skills || [])]);
      this.form.patchValue({
        firstName: result.student.first_name || '',
        lastName: result.student.last_name || '',
        phone: result.student.phone || '',
        linkedinUrl: result.student.linkedin_url || '',
        githubUrl: result.student.github_url || ''
      });
    } catch (error) {
      // Profile might not exist yet - that's okay
    }
  }

  async loadCVs() {
    try {
      const userId = this.user()?.id;
      if (!userId) return;

      const result = await this.studentService.getCVs(userId);
      this.cvs.set(result.documents);
    } catch (error) {
    }
  }

  addSkill(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.skills.update((skills) => [...skills, value]);
    }
    event.chipInput.clear();
  }

  removeSkill(skill: string): void {
    this.skills.update((skills) => skills.filter((s) => s !== skill));
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
      const result = await this.studentService.createOrUpdateProfile({
        userId,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        linkedinUrl: values.linkedinUrl,
        githubUrl: values.githubUrl,
        skills: this.skills()
      });

      this.studentProfile.set(result.student);
      this.skills.set([...(result.student.skills || [])]);
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

  async uploadCV(fileInput: HTMLInputElement): Promise<void> {
    const files = fileInput.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const userId = this.user()?.id;
      if (!userId) throw new Error('User not found');

      // For now, we'll use the filename as storage key
      // In a real app, you'd upload to a storage service first
      const result = await this.studentService.uploadCV({
        userId,
        fileName: file.name,
        storageKey: file.name,
        mimeType: file.type,
        sizeBytes: file.size
      });

      this.successMessage.set(result.message);
      await this.loadCVs();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Erreur lors de l\'upload');
    } finally {
      this.loading.set(false);
      fileInput.value = '';
    }
  }

  async deleteCV(documentId: string): Promise<void> {
    if (this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const userId = this.user()?.id;
      if (!userId) throw new Error('User not found');

      const result = await this.studentService.deleteCV(userId, documentId);
      this.successMessage.set(result.message);
      await this.loadCVs();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    } finally {
      this.loading.set(false);
    }
  }

  goBack(): void {
    this.router.navigateByUrl('/dashboard');
  }
}
