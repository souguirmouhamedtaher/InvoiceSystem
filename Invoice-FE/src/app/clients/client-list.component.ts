import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
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
  private companySwitcher = inject(CompanySwitcherService);

  protected readonly form = this.fb.group({
    search: [''],
  });

  constructor(private clientService: ClientService) {
    this.loadClients(1);

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
    });
  }

  private loadClients(page: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const filters = this.buildFilters();
    const companyId = this.companySwitcher.currentCompanyId();
    if (!companyId) {
      this.clients.set([]);
      this.total.set(0);
      this.page.set(1);
      this.loading.set(false);
      this.errorMessage.set('Selectionnez une societe pour afficher les clients.');
      return;
    }

    this.clientService.getClients({ companyId, page, limit: this.limit, ...filters }).subscribe({
      next: (response: ClientListResponse) => {
        this.clients.set(response.clients);
        this.total.set(response.totalClients);
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

    if (search.length) {
      filters['search'] = search;
    }

    return filters;
  }
}
