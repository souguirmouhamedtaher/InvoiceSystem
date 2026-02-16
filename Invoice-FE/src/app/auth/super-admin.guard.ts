import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Restricts access to routes to super admin only (e.g. create company).
 * Redirects to company-selector if the user is not a super admin.
 */
export const superAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isSuperAdmin()) {
    return true;
  }

  return router.parseUrl('/company-selector');
};
