import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Client, ClientListResponse } from './client.model';
import { ClientService } from './client.service';
import { CompanySwitcherService } from '../core/company-switcher.service';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './client-list.component.html',
  styleUrl: './client-list.component.scss',
})
export class ClientListComponent {
  protected readonly clients = signal<Client[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly limit = 10;
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  protected readonly form = this.fb.group({
    search: [''],
    companyType: ['all'],
    city: [''],
    country: [''],
  });

  constructor(
    private clientService: ClientService,
    private companySwitcher: CompanySwitcherService
  ) {
    this.loadClients(1);

    // Watch for company changes and reload clients
    effect(() => {
      const currentCompanyId = this.companySwitcher.currentCompanyId();
      if (currentCompanyId) {
        this.loadClients(1);
      }
    });

    this.form.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadClients(1));
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / this.limit));
  }

  nextPage(): void {
    if (this.page() < this.totalPages) {
      this.loadClients(this.page() + 1);
    }
  }

  previousPage(): void {
    if (this.page() > 1) {
      this.loadClients(this.page() - 1);
    }
  }

  resetFilters(): void {
    this.form.reset({
      search: '',
      companyType: 'all',
      city: '',
      country: '',
    });
  }

  private loadClients(page: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const filters = this.buildFilters();

    this.clientService.getClients({ page, limit: this.limit, ...filters }).subscribe({
      next: (response: ClientListResponse) => {
        this.clients.set(response.companies);
        this.total.set(response.totalCompanies);
        this.page.set(page);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const message = err?.error?.message || 'Impossible de charger les clients.';
        this.errorMessage.set(message);
      },
    });
  }

  private buildFilters(): Record<string, string> {
    const filters: Record<string, string> = {};
    const search = (this.form.value.search || '').trim();
    const companyType = this.form.value.companyType || 'all';
    const city = (this.form.value.city || '').trim();
    const country = (this.form.value.country || '').trim();
    const currentCompanyId = this.companySwitcher.currentCompanyId();

    if (search.length) {
      filters['search'] = search;
    }

    if (companyType !== 'all') {
      filters['companyType'] = companyType;
    }

    if (city.length) {
      filters['city'] = city;
    }

    if (country.length) {
      filters['country'] = country;
    }

    if (currentCompanyId) {
      filters['companyId'] = currentCompanyId;
    }

    return filters;
  }
}
