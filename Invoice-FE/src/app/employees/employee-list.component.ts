import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Employee, EmployeeListResponse } from './employee.model';
import { EmployeeService } from './employee.service';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss',
})
export class EmployeeListComponent {
  protected readonly employees = signal<Employee[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly limit = 10;
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  protected readonly form = this.fb.group({
    search: [''],
  });

  constructor(private employeeService: EmployeeService) {
    this.loadEmployees(1);

    this.form.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadEmployees(1));
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / this.limit));
  }

  nextPage(): void {
    if (this.page() < this.totalPages) {
      this.loadEmployees(this.page() + 1);
    }
  }

  previousPage(): void {
    if (this.page() > 1) {
      this.loadEmployees(this.page() - 1);
    }
  }

  resetFilters(): void {
    this.form.reset({ search: '' });
  }

  private loadEmployees(page: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const search = (this.form.value.search || '').trim();

    this.employeeService.getEmployees({ page, limit: this.limit, search }).subscribe({
      next: (response: EmployeeListResponse) => {
        this.employees.set(response.employees);
        this.total.set(response.totalEmployees);
        this.page.set(page);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const message = err?.error?.message || 'Impossible de charger les employes.';
        this.errorMessage.set(message);
      },
    });
  }
}
