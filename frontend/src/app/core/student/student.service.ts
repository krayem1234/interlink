import { Injectable } from '@angular/core';
import {
  CreateOrUpdateProfilePayload,
  StudentDocument,
  StudentProfile,
  UploadCVPayload
} from './student.models';

@Injectable({ providedIn: 'root' })
export class StudentService {
  async createOrUpdateProfile(payload: CreateOrUpdateProfilePayload): Promise<{ student: StudentProfile; message: string }> {
    return this.request('/api/students/profile', payload, 'POST');
  }

  async getProfile(userId: string): Promise<{ student: StudentProfile }> {
    return this.request(`/api/students/profile/${userId}`, undefined, 'GET');
  }

  async getProfileById(studentId: string): Promise<{ student: StudentProfile }> {
    return this.request(`/api/students/${studentId}`, undefined, 'GET');
  }

  async deleteProfile(userId: string): Promise<{ message: string }> {
    return this.request(`/api/students/profile/${userId}`, undefined, 'DELETE');
  }

  async uploadCV(payload: UploadCVPayload): Promise<{ document: StudentDocument; message: string }> {
    return this.request('/api/students/cv', payload, 'POST');
  }

  async getCVs(userId: string): Promise<{ documents: StudentDocument[] }> {
    return this.request(`/api/students/${userId}/cv`, undefined, 'GET');
  }

  async deleteCV(userId: string, documentId: string): Promise<{ message: string }> {
    return this.request(`/api/students/cv/${documentId}`, { userId }, 'DELETE');
  }

  // Admin methods
  async getAllStudents(): Promise<{ students: StudentProfile[] }> {
    return this.request('/api/students/admin/students', undefined, 'GET');
  }

  private async request<T>(
    path: string,
    body?: unknown,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST'
  ): Promise<T> {
    let response: Response;

    try {
      response = await fetch(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method !== 'GET' ? JSON.stringify(body || {}) : undefined
      });
    } catch {
      throw new Error('Impossible de joindre le serveur.');
    }

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        (payload as { message?: string | string[] }).message ||
        `Erreur ${response.status}`;
      throw new Error(Array.isArray(message) ? message.join(', ') : String(message));
    }

    return payload as T;
  }
}
