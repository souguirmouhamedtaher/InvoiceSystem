import { Component, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompanySwitcherService } from '../core/company-switcher.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-company-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="company-switcher" *ngIf="auth.isLoggedIn() && companySwitcher.availableMemberships().length > 0">
      <label for="company-select" class="switcher-label">Societe:</label>
      <select 
        id="company-select"
        class="switcher-select"
        [value]="companySwitcher.currentCompanyId() || ''"
        (change)="onCompanyChange($event)"
      >
        <option *ngFor="let membership of companySwitcher.availableMemberships()" 
                [value]="membership.companyId._id">
          {{ membership.companyId.companyname }} ({{ membership.role }})
        </option>
      </select>
    </div>
  `,
  styles: [`
    .company-switcher {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      margin: 1rem 0;
    }

    .switcher-label {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
    }

    .switcher-select {
      flex: 1;
      padding: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      color: white;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .switcher-select:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .switcher-select:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
    }

    .switcher-select option {
      background: #1f2937;
      color: white;
    }
  `]
})
export class CompanySwitcherComponent implements OnInit {
  protected readonly companySwitcher = inject(CompanySwitcherService);
  protected readonly auth = inject(AuthService);

  constructor() {
    // Auto-refresh when membership changes
    effect(() => {
      const companyId = this.companySwitcher.currentCompanyId();
      if (companyId) {
        // Emit event or trigger refresh of employee/invoice lists
        window.dispatchEvent(new CustomEvent('companyChanged', { detail: { companyId } }));
      }
    });
  }

  ngOnInit(): void {
    // Load user memberships on init
    this.companySwitcher.getUserMemberships().subscribe();
    // Restore previously selected company from localStorage
    this.companySwitcher.restoreSelectedCompany();
  }

  onCompanyChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.companySwitcher.selectCompany(select.value);
  }
}
