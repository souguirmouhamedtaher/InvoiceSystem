import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { CompanySwitcherService } from './company-switcher.service';

export const companyRequiredGuard: CanActivateFn = () => {
  const companySwitcher = inject(CompanySwitcherService);
  const router = inject(Router);

  companySwitcher.restoreSelectedCompany();

  return companySwitcher.getUserMemberships().pipe(
    map((response) => {
      const fromApi = response?.memberships ?? [];
      const currentId = companySwitcher.currentCompanyId();
      const list = companySwitcher.availableMemberships();
      const isValid = currentId && list.some((m) => companySwitcher.idOf(m) === currentId);

      if (isValid) return true;

      if (list.length > 0) {
        companySwitcher.selectCompany(companySwitcher.idOf(list[0]));
        return true;
      }

      return router.createUrlTree(['/company-selector']);
    }),
    catchError(() => {
      const currentId = companySwitcher.currentCompanyId();
      const hasAny = companySwitcher.availableMemberships().length > 0;
      if (currentId && hasAny) return of(true);
      if (currentId && localStorage.getItem('selectedCompanyId')) return of(true);
      return of(router.createUrlTree(['/company-selector']));
    })
  );
};
