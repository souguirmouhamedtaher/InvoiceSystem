import { Component, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompanySwitcherService } from '../core/company-switcher.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-company-switcher',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="company-switcher" *ngIf="auth.isLoggedIn() && companySwitcher.availableMemberships().length > 0">
      <label for="company-select" class="switcher-label">Société</label>
      <select 
        id="company-select"
        class="switcher-select"
        [ngModel]="companySwitcher.currentCompanyId() || ''"
        (ngModelChange)="onCompanyChange($event)"
      >
        <option *ngFor="let m of companySwitcher.availableMemberships()" 
                [value]="companySwitcher.idOf(m)">
          {{ m.companyId.companyname }}
        </option>
      </select>
    </div>
  `,
  styles: [`
    .company-switcher {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem 0;
    }

    .switcher-label {
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: rgba(148, 163, 184, 0.9);
    }

    .switcher-select {
      width: 100%;
      padding: 0.65rem 2.25rem 0.65rem 0.85rem;
      background: rgba(15, 23, 42, 0.4);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 10px;
      color: #f8fafc;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
    }

    .switcher-select:hover {
      background-color: rgba(15, 23, 42, 0.55);
      border-color: rgba(148, 163, 184, 0.35);
    }

    .switcher-select:focus {
      outline: none;
      border-color: #5eead4;
      box-shadow: 0 0 0 2px rgba(94, 234, 212, 0.25);
    }

    .switcher-select option {
      background: #1e293b;
      color: #f8fafc;
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

  onCompanyChange(companyId: string): void {
    if (companyId) this.companySwitcher.selectCompany(companyId);
  }
}
