import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Company, CompanyListResponse } from './company.model';
import { CompanyService } from './company.service';

@Component({
  selector: 'app-my-company-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './my-company-list.component.html',
  styleUrl: './my-company-list.component.scss',
})
export class MyCompanyListComponent {
  protected readonly companies = signal<Company[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly limit = 10;
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  protected readonly form = this.fb.group({
    search: [''],
    region: [''],
    country: [''],
  });

  constructor(private companyService: CompanyService) {
    this.loadCompanies(1);

    this.form.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadCompanies(1));
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / this.limit));
  }

  nextPage(): void {
    if (this.page() < this.totalPages) {
      this.loadCompanies(this.page() + 1);
    }
  }

  previousPage(): void {
    if (this.page() > 1) {
      this.loadCompanies(this.page() - 1);
    }
  }

  resetFilters(): void {
    this.form.reset({
      search: '',
      region: '',
      country: '',
    });
  }

  private loadCompanies(page: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const filters = this.buildFilters();

    this.companyService
      .getCompanies({ page, limit: this.limit, ...filters })
      .subscribe({
        next: (response: CompanyListResponse) => {
          this.companies.set(response.companies);
          this.total.set(response.totalCompanies);
          this.page.set(page);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          const message = err?.error?.message || 'Impossible de charger les societes.';
          this.errorMessage.set(message);
        },
      });
  }

  private buildFilters(): Record<string, string> {
    const filters: Record<string, string> = {};
    const search = (this.form.value.search || '').trim();
    const region = (this.form.value.region || '').trim();
    const country = (this.form.value.country || '').trim();

    if (search.length) {
      filters['search'] = search;
    }

    if (region.length) {
      filters['region'] = region;
    }

    if (country.length) {
      filters['country'] = country;
    }

    return filters;
  }
}
