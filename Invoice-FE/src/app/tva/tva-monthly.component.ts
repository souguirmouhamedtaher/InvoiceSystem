import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TvaService } from './tva.service';
import { VatTotalsResponse } from './tva.model';

@Component({
  selector: 'app-tva-monthly',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tva-monthly.component.html',
  styleUrl: './tva-monthly.component.scss',
})
export class TvaMonthlyComponent {
  protected readonly data = signal<VatTotalsResponse | null>(null);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  protected readonly form = this.fb.group({
    year: [''],
    month: [''],
  });

  constructor(private tvaService: TvaService) {
    this.loadData();

    this.form.valueChanges
      .pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadData());
  }

  resetFilters(): void {
    this.form.reset({ year: '', month: '' });
  }

  private loadData(): void {
    const year = this.form.value.year ? Number(this.form.value.year) : undefined;
    const month = this.form.value.month ? Number(this.form.value.month) : undefined;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.tvaService.getMonthlyVat(year, month).subscribe({
      next: (response) => {
        this.data.set(response);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const message = err?.error?.message || 'Impossible de charger la TVA mensuelle.';
        this.errorMessage.set(message);
      },
    });
  }
}
