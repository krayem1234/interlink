import { Injectable, computed, signal } from '@angular/core';
import {
  AdminUser,
  AuthSession,
  AuthUser,
  ChangePasswordPayload,
  LoginPayload,
  PasswordChangeRequest,
  RegisterPayload,
  RequestPasswordChangePayload,
  TokenPair,
  UserRole
} from './auth.models';

const STORAGE_KEY = 'internlink.auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sessionSignal = signal<AuthSession | null>(this.readStoredSession());

  readonly session = this.sessionSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.sessionSignal()?.accessToken);
  readonly user = computed(() => this.sessionSignal()?.user ?? null);
  readonly isAdmin = computed(() => this.sessionSignal()?.user?.role === 'ADMIN');
  readonly mustChangePassword = computed(() => !!this.sessionSignal()?.mustChangePassword);
  readonly securityQuestionsConfigured = computed(
    () => !!this.sessionSignal()?.securityQuestionsConfigured
  );
  readonly needsSecuritySetup = computed(
    () => this.isAuthenticated() && (this.mustChangePassword() || !this.securityQuestionsConfigured())
  );

  async register(payload: RegisterPayload): Promise<AuthSession> {
    await this.request('/api/auth/register', payload);
    return this.login({ email: payload.email, password: payload.password });
  }

  async login(payload: LoginPayload): Promise<AuthSession> {
    const tokens = await this.request<TokenPair>('/api/auth/login', payload);
    const session = this.buildSession(tokens);
    this.persist(session);
    this.sessionSignal.set(session);
    return session;
  }

  async googleLogin(credential: string): Promise<AuthSession> {
    const tokens = await this.request<TokenPair>('/api/auth/google', { credential });
    const session = this.buildSession(tokens);
    this.persist(session);
    this.sessionSignal.set(session);
    return session;
  }

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await this.request('/api/auth/change-password', payload);

    const current = this.sessionSignal();
    if (!current) {
      return;
    }

    const updated: AuthSession = {
      ...current,
      mustChangePassword: false,
      securityQuestionsConfigured: true
    };

    this.persist(updated);
    this.sessionSignal.set(updated);
  }

  async requestPasswordChange(payload: RequestPasswordChangePayload): Promise<void> {
    await this.request('/api/auth/request-password-change', payload);
  }

  async getSecurityQuestions(email: string): Promise<string[]> {
    const result = await this.request<{ questions?: string[] }>('/api/auth/security-questions', { email });
    return result.questions || [];
  }

  async requestPasswordOtp(email: string): Promise<{ devOtp?: string; message?: string }> {
    return this.request('/api/auth/forgot-password/request-otp', { email });
  }

  async resetPasswordWithOtp(email: string, otp: string, newPassword: string): Promise<void> {
    await this.request('/api/auth/forgot-password/reset', { email, otp, newPassword });
  }

  async resetPasswordWithQuestions(
    email: string,
    answers: string[],
    newPassword: string
  ): Promise<void> {
    await this.request('/api/auth/forgot-password/reset-with-questions', {
      email,
      answers,
      newPassword
    });
  }

  // --- Admin methods ---
  async getAllUsers(): Promise<AdminUser[]> {
    const result = await this.request<{ users: any[] }>('/api/auth/admin/users', undefined, 'GET');
    return result.users.map(u => ({
      ...u,
      id: u.id,
      email: u.email,
      role: u.role,
      isActive: u.is_active ?? u.isActive ?? true,
      isBlocked: u.is_blocked ?? u.isBlocked ?? false,
      createdAt: u.created_at ?? u.createdAt
    }));
  }

  async blockUser(userId: string): Promise<void> {
    await this.request(`/api/auth/admin/users/${userId}/block`, undefined, 'PUT');
  }

  async unblockUser(userId: string): Promise<void> {
    await this.request(`/api/auth/admin/users/${userId}/unblock`, undefined, 'PUT');
  }

  async getPendingPasswordChangeRequests(): Promise<PasswordChangeRequest[]> {
    const result = await this.request<{ requests: any[] }>(
      '/api/auth/admin/password-change-requests',
      undefined,
      'GET'
    );
    return result.requests.map(r => ({
      ...r,
      id: r.id,
      userId: r.user_id ?? r.userId,
      status: r.status,
      createdAt: r.created_at ?? r.createdAt,
      updatedAt: r.updated_at ?? r.updatedAt,
      email: r.email
    }));
  }

  async approvePasswordChangeRequest(requestId: string): Promise<void> {
    await this.request(`/api/auth/admin/password-change-requests/${requestId}/approve`, undefined, 'PUT');
  }

  async rejectPasswordChangeRequest(requestId: string): Promise<void> {
    await this.request(`/api/auth/admin/password-change-requests/${requestId}/reject`, undefined, 'PUT');
  }

  getPostLoginRoute(): string {
    return this.needsSecuritySetup() ? '/security-setup' : '/dashboard';
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.sessionSignal.set(null);
  }

  private buildSession(tokens: TokenPair): AuthSession {
    return {
      user: this.userFromAccessToken(tokens.accessToken),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      mustChangePassword: !!tokens.mustChangePassword,
      securityQuestionsConfigured: !!tokens.securityQuestionsConfigured
    };
  }

  private persist(session: AuthSession): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  private readStoredSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as AuthSession;
      if (!parsed?.accessToken || !parsed?.user?.email) {
        return null;
      }

      return {
        ...parsed,
        mustChangePassword: !!parsed.mustChangePassword,
        securityQuestionsConfigured: !!parsed.securityQuestionsConfigured
      };
    } catch {
      return null;
    }
  }

  private userFromAccessToken(accessToken: string): AuthUser {
    const payload = this.decodeJwt(accessToken);
    const role = (payload['role'] as UserRole) || 'STUDENT';

    return {
      id: String(payload['sub'] || ''),
      email: String(payload['email'] || ''),
      role
    };
  }

  private decodeJwt(token: string): Record<string, unknown> {
    const [, payload] = token.split('.');
    if (!payload) {
      throw new Error('Token invalide');
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '='));
    return JSON.parse(json) as Record<string, unknown>;
  }

  private async request<T>(
    path: string,
    body: unknown,
    method: 'GET' | 'POST' | 'PUT' = 'POST'
  ): Promise<T> {
    let response: Response;

    try {
      response = await fetch(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method === 'POST' || method === 'PUT' ? JSON.stringify(body) : undefined
      });
    } catch {
      throw new Error('Impossible de joindre le serveur. Vérifie que le gateway tourne.');
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

