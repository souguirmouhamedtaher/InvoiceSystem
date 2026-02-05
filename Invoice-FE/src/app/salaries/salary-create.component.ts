import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SalaryService } from './salary.service';
import { CreateSalaryPayload } from './salary.model';
import { Employee, EmployeeListResponse } from '../employees/employee.model';
import { EmployeeService } from '../employees/employee.service';

@Component({
  selector: 'app-salary-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './salary-create.component.html',
  styleUrl: './salary-create.component.scss',
})
export class SalaryCreateComponent {
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly employees = signal<Employee[]>([]);

  private fb = inject(FormBuilder);

  protected readonly form = this.fb.group({
    employeeId: ['', [Validators.required]],
    month: ['', [Validators.required]],
    netAmount: [0, [Validators.required, Validators.min(0)]],
    paidDate: [''],
    notes: [''],
  });

  constructor(
    private salaryService: SalaryService,
    private employeeService: EmployeeService,
    private router: Router
  ) {
    this.loadEmployees();
  }

  submit(): void {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CreateSalaryPayload = {
      employeeId: this.form.value.employeeId || '',
      month: this.form.value.month || '',
      netAmount: Number(this.form.value.netAmount || 0),
      paidDate: this.cleanOptional(this.form.value.paidDate),
      notes: this.cleanOptional(this.form.value.notes),
    };

    this.saving.set(true);
    this.salaryService.createSalary(payload).subscribe({
      next: (salary) => {
        this.saving.set(false);
        this.router.navigate(['/salaries', salary._id]);
      },
      error: (err) => {
        this.saving.set(false);
        const message = err?.error?.message || 'Impossible de creer le salaire.';
        this.errorMessage.set(message);
      },
    });
  }

  private loadEmployees(): void {
    this.employeeService.getEmployees({ page: 1, limit: 200 }).subscribe({
      next: (response: EmployeeListResponse) => this.employees.set(response.employees),
      error: () => this.employees.set([]),
    });
  }

  private cleanOptional(value?: string | null): string | undefined {
    const trimmed = (value || '').trim();
    return trimmed.length ? trimmed : undefined;
  }
}
