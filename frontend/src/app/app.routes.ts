import { Routes } from '@angular/router';
import { authGuard, guestGuard, securitySetupGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/home.page').then((m) => m.HomePage)
  },
  {
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/signup.page').then((m) => m.SignupPage)
  },
  {
    path: 'signin',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/signin.page').then((m) => m.SigninPage)
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/forgot-password.page').then((m) => m.ForgotPasswordPage)
  },
  {
    path: 'security-setup',
    canActivate: [securitySetupGuard],
    loadComponent: () => import('./pages/security-setup.page').then((m) => m.SecuritySetupPage)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard.page').then((m) => m.DashboardPage)
  },
  {
    path: 'student/profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/student-profile.page').then((m) => m.StudentProfilePage)
  },
  {
    path: 'messages/:applicationId',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/conversation.page').then((m) => m.ConversationPage)
  },
  {
    path: 'week7',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/week7.page').then((m) => m.Week7Page)
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/notifications.page').then((m) => m.NotificationsPage)
  },
  {
    path: 'my-applications',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/my-applications.page').then((m) => m.MyApplicationsPage)
  },
  {
    path: 'company/profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/company-profile.page').then((m) => m.CompanyProfilePage)
  },
  {
    path: 'admin/dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/admin-dashboard.page').then((m) => m.AdminDashboardPage)
  },
  {
    path: 'offers',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/offer-list.page').then((m) => m.OfferListPage)
  },
  {
    path: 'offers/create',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/offer-create.page').then((m) => m.OfferCreatePage)
  },
  {
    path: 'offers/:offerId',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/offer-detail.page').then((m) => m.OfferDetailPage)
  },
  {
    path: 'offers/:offerId/applications',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/offer-applications.page').then((m) => m.OfferApplicationsPage)
  },
  {
    path: '**',
    redirectTo: ''
  }
];



