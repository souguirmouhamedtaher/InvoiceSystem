import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Client, ClientListResponse } from '../clients/client.model';
import { ClientService } from '../clients/client.service';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './supplier-list.component.html',
  styleUrl: './supplier-list.component.scss',
})
export class SupplierListComponent {
  protected readonly suppliers = signal<Client[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly limit = 10;
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  protected readonly form = this.fb.group({
    search: [''],
    city: [''],
    country: [''],
  });

  constructor(private clientService: ClientService) {
    this.loadSuppliers(1);

    this.form.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadSuppliers(1));
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / this.limit));
  }

  nextPage(): void {
    if (this.page() < this.totalPages) {
      this.loadSuppliers(this.page() + 1);
    }
  }

  previousPage(): void {
    if (this.page() > 1) {
      this.loadSuppliers(this.page() - 1);
    }
  }

  resetFilters(): void {
    this.form.reset({
      search: '',
      city: '',
      country: '',
    });
  }

  private loadSuppliers(page: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const filters = this.buildFilters();

    this.clientService.getClients({
      page,
      limit: this.limit,
      companyType: 'supplier',
      ...filters,
    }).subscribe({
      next: (response: ClientListResponse) => {
        this.suppliers.set(response.companies);
        this.total.set(response.totalCompanies);
        this.page.set(page);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const message = err?.error?.message || 'Impossible de charger les fournisseurs.';
        this.errorMessage.set(message);
      },
    });
  }

  private buildFilters(): Record<string, string> {
    const filters: Record<string, string> = {};
    const search = (this.form.value.search || '').trim();
    const city = (this.form.value.city || '').trim();
    const country = (this.form.value.country || '').trim();

    if (search.length) {
      filters['search'] = search;
    }

    if (city.length) {
      filters['city'] = city;
    }

    if (country.length) {
      filters['country'] = country;
    }

    return filters;
  }
}
