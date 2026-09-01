import { Injectable } from '@angular/core';
import { Offer, CreateOfferPayload, UpdateOfferPayload } from './offer.models';

@Injectable({ providedIn: 'root' })
export class OfferService {
  async createOffer(payload: CreateOfferPayload): Promise<{ offer: Offer; message: string }> {
    return this.request('/api/offers', payload);
  }

  async updateOffer(offerId: string, payload: UpdateOfferPayload): Promise<{ offer: Offer; message: string }> {
    return this.request(`/api/offers/${offerId}`, payload, 'PUT');
  }

  async getOffersByCompany(companyId: string): Promise<{ offers: Offer[] }> {
    return this.request(`/api/offers/company/${companyId}`, undefined, 'GET');
  }

  async getOfferById(offerId: string): Promise<{ offer: Offer }> {
    return this.request(`/api/offers/${offerId}`, undefined, 'GET');
  }

  async getAllOffers(): Promise<{ offers: Offer[] }> {
    return this.request('/api/offers', undefined, 'GET');
  }

  async deleteOffer(offerId: string, companyId: string): Promise<{ message: string }> {
    return this.request(`/api/offers/${offerId}`, { companyId }, 'DELETE');
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
