import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CompanyMembership, CompanySwitcherService } from '../core/company-switcher.service';

@Component({
  selector: 'app-company-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './company-selector.component.html',
  styleUrl: './company-selector.component.scss',
})
export class CompanySelectorComponent implements OnInit {
  private companySwitcher = inject(CompanySwitcherService);
  private router = inject(Router);

  protected companies = signal<CompanyMembership[]>([]);
  protected loading = signal(true);
  protected error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadCompanies();
  }

  private loadCompanies(): void {
    this.loading.set(true);
    this.error.set(null);

    this.companySwitcher.getUserMemberships().subscribe({
      next: (response) => {
        const memberships = response?.memberships ?? [];
        this.companies.set(memberships);
        this.loading.set(false);

        if (memberships.length === 0) {
          this.router.navigate(['/my-companies/new']);
        }
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Impossible de charger vos societes');
        this.loading.set(false);
      },
    });
  }

  selectCompany(companyId: string): void {
    this.companySwitcher.selectCompany(companyId);
    this.router.navigate(['/dashboard']);
  }

  createNewCompany(): void {
    this.router.navigate(['/my-companies/new']);
  }
}
