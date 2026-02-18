import { CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TvaPayment, TvaPaymentListResponse } from './tva-payments.model';
import { TvaPaymentsService } from './tva-payments.service';
import { CompanySwitcherService } from '../core/company-switcher.service';

@Component({
  selector: 'app-tva-payments-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './tva-payments-list.component.html',
  styleUrl: './tva-payments-list.component.scss',
})
export class TvaPaymentsListComponent {
  protected readonly payments = signal<TvaPayment[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly limit = 10;
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private companySwitcher = inject(CompanySwitcherService);

  protected readonly form = this.fb.group({
    month: [''],
  });

  constructor(private paymentsService: TvaPaymentsService) {
    this.loadPayments(1);

    this.form.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadPayments(1));

    effect(() => {
      const companyId = this.companySwitcher.currentCompanyId();
      if (companyId) {
        this.loadPayments(1);
      }
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / this.limit));
  }

  nextPage(): void {
    if (this.page() < this.totalPages) {
      this.loadPayments(this.page() + 1);
    }
  }

  previousPage(): void {
    if (this.page() > 1) {
      this.loadPayments(this.page() - 1);
    }
  }

  resetFilters(): void {
    this.form.reset({ month: '' });
  }

  private loadPayments(page: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const month = this.form.value.month || undefined;
    const companyId = this.companySwitcher.currentCompanyId();

    if (!companyId) {
      this.loading.set(false);
      this.errorMessage.set('Veuillez selectionner une entreprise.');
      return;
    }

    this.paymentsService.getPayments({ page, limit: this.limit, month, companyId }).subscribe({
      next: (response: TvaPaymentListResponse) => {
        this.payments.set(response.payments);
        this.total.set(response.totalPayments);
        this.page.set(page);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const message = err?.error?.message || 'Impossible de charger les paiements TVA.';
        this.errorMessage.set(message);
      },
    });
  }
}
