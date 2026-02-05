import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CnssPayment, CnssListResponse } from './cnss.model';
import { CnssService } from './cnss.service';
import { Employee, EmployeeListResponse } from '../employees/employee.model';
import { EmployeeService } from '../employees/employee.service';

@Component({
  selector: 'app-cnss-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './cnss-list.component.html',
  styleUrl: './cnss-list.component.scss',
})
export class CnssListComponent {
  protected readonly payments = signal<CnssPayment[]>([]);
  protected readonly employees = signal<Employee[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly limit = 10;
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  protected readonly form = this.fb.group({
    employeeId: [''],
    month: [''],
  });

  constructor(
    private cnssService: CnssService,
    private employeeService: EmployeeService
  ) {
    this.loadEmployees();
    this.loadPayments(1);

    this.form.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadPayments(1));
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
    this.form.reset({ employeeId: '', month: '' });
  }

  private loadEmployees(): void {
    this.employeeService.getEmployees({ page: 1, limit: 200 }).subscribe({
      next: (response: EmployeeListResponse) =>
        this.employees.set(response.employees.filter((employee) => employee.cnssApplicable)),
      error: () => this.employees.set([]),
    });
  }

  private loadPayments(page: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const employeeId = this.form.value.employeeId || undefined;
    const month = this.form.value.month || undefined;

    this.cnssService.getPayments({ page, limit: this.limit, employeeId, month }).subscribe({
      next: (response: CnssListResponse) => {
        this.payments.set(response.payments);
        this.total.set(response.totalPayments);
        this.page.set(page);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const message = err?.error?.message || 'Impossible de charger les paiements CNSS.';
        this.errorMessage.set(message);
      },
    });
  }
}
