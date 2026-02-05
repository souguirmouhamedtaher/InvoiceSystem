import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Invoice, InvoiceListResponse } from './invoice.model';
import { InvoiceService } from './invoice.service';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.scss',
})
export class InvoiceListComponent {
  protected readonly invoices = signal<Invoice[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly limit = 10;
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  protected readonly form = this.fb.group({
    search: [''],
    clientType: ['all'],
    invoiceType: ['all'],
    invoiceStatus: ['all'],
    dateFrom: [''],
    dateTo: [''],
  });

  constructor(private invoiceService: InvoiceService) {
    this.loadInvoices(1);

    this.form.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadInvoices(1));
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / this.limit));
  }

  nextPage(): void {
    if (this.page() < this.totalPages) {
      this.loadInvoices(this.page() + 1);
    }
  }

  previousPage(): void {
    if (this.page() > 1) {
      this.loadInvoices(this.page() - 1);
    }
  }

  resetFilters(): void {
    this.form.reset({
      search: '',
      clientType: 'all',
      invoiceType: 'all',
      invoiceStatus: 'all',
      dateFrom: '',
      dateTo: '',
    });
  }

  private loadInvoices(page: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const filters = this.buildFilters();

    this.invoiceService.getInvoices({ page, limit: this.limit, ...filters }).subscribe({
      next: (response: InvoiceListResponse) => {
        this.invoices.set(response.invoices);
        this.total.set(response.totalInvoices);
        this.page.set(page);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const message = err?.error?.message || 'Impossible de charger les factures.';
        this.errorMessage.set(message);
      },
    });
  }

  private buildFilters(): Record<string, string> {
    const filters: Record<string, string> = {};
    const search = (this.form.value.search || '').trim();
    const clientType = this.form.value.clientType || 'all';
    const invoiceType = this.form.value.invoiceType || 'all';
    const invoiceStatus = this.form.value.invoiceStatus || 'all';
    const dateFrom = (this.form.value.dateFrom || '').trim();
    const dateTo = (this.form.value.dateTo || '').trim();

    if (search.length) {
      filters['search'] = search;
    }

    if (clientType !== 'all') {
      filters['clientType'] = clientType;
    }

    if (invoiceType !== 'all') {
      filters['invoiceType'] = invoiceType;
    }


    if (invoiceStatus !== 'all') {
      filters['invoiceStatus'] = invoiceStatus;
    }

    if (dateFrom.length) {
      filters['dateFrom'] = dateFrom;
    }

    if (dateTo.length) {
      filters['dateTo'] = dateTo;
    }

    return filters;
  }
}
