import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DashboardService } from './dashboard.service';
import { CashDashboardResponse } from './dashboard.model';
import { CompanySwitcherService } from '../core/company-switcher.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  protected readonly data = signal<CashDashboardResponse | null>(null);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private companySwitcher = inject(CompanySwitcherService);

  protected readonly form = this.fb.group({
    year: [''],
    month: [''],
  });

  protected readonly maxMagnitude = computed(() => {
    const entries = this.data()?.monthlyBreakdown ?? [];
    if (!entries.length) return 1;
    const maxValue = Math.max(...entries.map((entry) => Math.abs(entry.cashBalance)));
    return maxValue > 0 ? maxValue : 1;
  });

  constructor(private dashboardService: DashboardService) {
    this.loadData();

    this.form.valueChanges
      .pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadData());

    effect(() => {
      this.companySwitcher.currentCompanyId();
      this.loadData();
    });
  }

  resetFilters(): void {
    this.form.reset({ year: '', month: '' });
  }

  getBarWidth(value: number): number {
    const maxValue = this.maxMagnitude();
    return Math.min(100, (Math.abs(value) / maxValue) * 100);
  }

  private loadData(): void {
    const year = this.form.value.year ? Number(this.form.value.year) : undefined;
    const month = this.form.value.month ? Number(this.form.value.month) : undefined;
    const companyId = this.companySwitcher.currentCompanyId() || undefined;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.dashboardService.getCashDashboard(year, month, companyId).subscribe({
      next: (response) => {
        this.data.set(response);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const message = err?.error?.message || 'Impossible de charger le dashboard.';
        this.errorMessage.set(message);
      },
    });
  }
}
