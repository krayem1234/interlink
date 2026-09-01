import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/signin']);
  }

  if (auth.needsSecuritySetup()) {
    return router.createUrlTree(['/security-setup']);
  }

  return true;
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  if (auth.needsSecuritySetup()) {
    return router.createUrlTree(['/security-setup']);
  }

  return router.createUrlTree(['/dashboard']);
};

export const securitySetupGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/signin']);
  }

  if (!auth.needsSecuritySetup()) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
