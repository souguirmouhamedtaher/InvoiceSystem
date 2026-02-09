import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { CompanySwitcherService } from './company-switcher.service';

export const companyRequiredGuard: CanActivateFn = () => {
  const companySwitcher = inject(CompanySwitcherService);
  const router = inject(Router);

  companySwitcher.restoreSelectedCompany();

  return companySwitcher.getUserMemberships().pipe(
    map((response) => {
      const memberships = response?.memberships ?? [];
      const currentId = companySwitcher.currentCompanyId();
      const isValid = currentId && memberships.some(m => m.companyId._id === currentId);

      if (isValid) {
        return true;
      }

      if (memberships.length > 0) {
        companySwitcher.selectCompany(memberships[0].companyId._id);
        return true;
      }

      return router.createUrlTree(['/company-selector']);
    })
  );
};
