import { Injectable } from '@angular/core';
import { Application, CreateApplicationPayload, UpdateApplicationStatusPayload, ApplicationStatus } from './application.models';

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  async createApplication(payload: CreateApplicationPayload): Promise<{ application: Application; message: string }> {
    return this.request('/api/applications', payload, 'POST');
  }

  async getApplicationsByStudent(studentId: string): Promise<{ applications: Application[] }> {
    return this.request(`/api/applications/student/${studentId}`, undefined, 'GET');
  }

  async getApplicationsByOffer(offerId: string, companyId: string): Promise<{ applications: Application[] }> {
    const url = new URL(`/api/applications/offer/${offerId}`, window.location.origin);
    url.searchParams.set('companyId', companyId);
    return this.request(url.pathname + url.search, undefined, 'GET');
  }

  async getApplicationsByCompany(companyId: string): Promise<{ applications: Application[] }> {
    return this.request(`/api/applications/company/${companyId}`, undefined, 'GET');
  }

  async updateApplicationStatus(
    applicationId: string,
    payload: UpdateApplicationStatusPayload
  ): Promise<{ application: Application; message: string }> {
    return this.request(`/api/applications/${applicationId}/status`, payload, 'PUT');
  }

  async getApplicationById(
    applicationId: string,
    studentId?: string,
    companyId?: string
  ): Promise<{ application: Application }> {
    const url = new URL(`/api/applications/${applicationId}`, window.location.origin);
    if (studentId) url.searchParams.set('studentId', studentId);
    if (companyId) url.searchParams.set('companyId', companyId);
    return this.request(url.pathname + url.search, undefined, 'GET');
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
