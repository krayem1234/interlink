import { Injectable } from '@angular/core';
export interface NotificationItem { id: string; title: string; content: string; is_read: boolean; created_at: string; }
@Injectable({ providedIn: 'root' })
export class NotificationService {
  async list(userId: string): Promise<{ notifications: NotificationItem[] }> { return this.request(`/api/notifications/user/${userId}`); }
  async markRead(id: string, userId: string) { return this.request(`/api/notifications/${id}/read`, { userId }, 'PUT'); }
  async markAllRead(userId: string) { return this.request(`/api/notifications/user/${userId}/read-all`, undefined, 'PUT'); }
  private async request<T>(path: string, body?: unknown, method: 'GET' | 'PUT' = 'GET'): Promise<T> { const response = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: method === 'PUT' && body ? JSON.stringify(body) : undefined }); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error((payload as { message?: string }).message || `Erreur ${response.status}`); return payload as T; }
}
