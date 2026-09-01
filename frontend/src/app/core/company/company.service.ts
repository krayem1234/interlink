import { Injectable } from '@angular/core';
import { CompanyProfile, CreateOrUpdateCompanyProfilePayload } from './company.models';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  async createOrUpdateProfile(
    payload: CreateOrUpdateCompanyProfilePayload
  ): Promise<{ company: CompanyProfile; message: string }> {
    return this.request('/api/companies/profile', payload);
  }

  async getProfile(userId: string): Promise<{ company: CompanyProfile }> {
    return this.request(`/api/companies/profile/${userId}`, undefined, 'GET');
  }

  async getProfileById(companyId: string): Promise<{ company: CompanyProfile }> {
    return this.request(`/api/companies/${companyId}`, undefined, 'GET');
  }

  async deleteProfile(userId: string): Promise<{ message: string }> {
    return this.request(`/api/companies/profile/${userId}`, undefined, 'DELETE');
  }

  // Admin methods
  async getAllCompanies(): Promise<{ companies: CompanyProfile[] }> {
    return this.request('/api/companies/admin/companies', undefined, 'GET');
  }

  async validateCompany(companyId: string, validated: boolean): Promise<{ company: CompanyProfile; message: string }> {
    return this.request(`/api/companies/admin/companies/${companyId}/validate`, { validated }, 'PUT');
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
