import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from './core/auth/auth.service';
import { NotificationService } from './core/notification.service';
import { Subscription, interval, filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatButtonModule, MatToolbarModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="app-shell">
      <header class="topbar">
        <div class="container">
          <a class="brand" routerLink="/">
            <img src="/assets/mockups/interlink.jpg" alt="Logo InternLink" class="brand-logo">
            <div class="brand-text">
              <strong>InternLink</strong>
              <small>Your Internship Journey Starts Here</small>
            </div>
          </a>

          <nav class="nav-links" aria-label="Navigation principale">
            <button class="theme-toggle" type="button" (click)="toggleTheme()" [attr.aria-label]="darkMode() ? 'Activer le thème clair' : 'Activer le thème sombre'">{{ darkMode() ? '☀️' : '🌙' }}</button>
            @if (auth.isAuthenticated()) {
              @if (!auth.needsSecuritySetup()) {
                <a class="nav-link" routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
                @if (auth.user()?.role === 'STUDENT') {
                  <a class="nav-link" routerLink="/my-applications" routerLinkActive="active">Mes candidatures</a>
                  <a class="nav-link" routerLink="/notifications" routerLinkActive="active">
                    Notifications
                    @if (unreadCount() > 0) {
                      <span class="notification-badge">{{ unreadCount() }}</span>
                    }
                  </a>
                  <a class="nav-link" routerLink="/week7" routerLinkActive="active">IA & documents</a>
                }
              }
              @if (auth.user()?.role === 'COMPANY' || auth.user()?.role === 'ADMIN') {
                <a class="nav-link" routerLink="/week7" routerLinkActive="active">IA & documents</a>
              }
              <span class="user-email">{{ auth.user()?.email }}</span>
              <button class="btn btn-outline" type="button" (click)="logout()">Deconnexion</button>
            } @else {
              <a class="nav-link" routerLink="/signin" routerLinkActive="active">Connexion</a>
              <a class="btn btn-primary" routerLink="/signup">Inscription</a>
            }
          </nav>
        </div>
      </header>

      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  readonly unreadCount = signal(0);
  readonly darkMode = signal(true);
  private refreshSubscription?: Subscription;
  private routerSubscription?: Subscription;

  ngOnInit(): void {
    this.routerSubscription = this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      this.refreshUnreadCount();
    });
    window.addEventListener('focus', this.handleWindowFocus);
    this.refreshSubscription = interval(3000).subscribe(() => {
      this.refreshUnreadCount();
    });
    this.refreshUnreadCount();
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
  }

  private readonly handleNotificationsUpdated = () => this.refreshUnreadCount();
  private readonly handleWindowFocus = () => this.refreshUnreadCount();

  private async refreshUnreadCount(): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) {
      this.unreadCount.set(0);
      return;
    }
    try {
      const result = await this.notificationService.list(userId);
      const unread = result.notifications.filter(n => !n.is_read).length;
      this.unreadCount.set(unread);
    } catch {
      // Silently ignore errors
    }
  }

  toggleTheme(): void {
    this.darkMode.update(value => !value);
    localStorage.setItem('interlink-theme', this.darkMode() ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    document.body.classList.toggle('light-theme', !this.darkMode());
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/signin');
  }
}