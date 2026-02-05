import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CnssService } from './cnss.service';
import { CreateCnssPaymentPayload } from './cnss.model';
import { Employee, EmployeeListResponse } from '../employees/employee.model';
import { EmployeeService } from '../employees/employee.service';

@Component({
  selector: 'app-cnss-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cnss-create.component.html',
  styleUrl: './cnss-create.component.scss',
})
export class CnssCreateComponent {
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly employees = signal<Employee[]>([]);

  private fb = inject(FormBuilder);

  protected readonly form = this.fb.group({
    employeeId: ['', [Validators.required]],
    month: ['', [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0)]],
    paymentDate: ['', [Validators.required]],
    notes: [''],
  });

  constructor(
    private cnssService: CnssService,
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

    const payload: CreateCnssPaymentPayload = {
      employeeId: this.form.value.employeeId || '',
      month: this.form.value.month || '',
      amount: Number(this.form.value.amount || 0),
      paymentDate: this.form.value.paymentDate || '',
      notes: this.cleanOptional(this.form.value.notes),
    };

    this.saving.set(true);
    this.cnssService.createPayment(payload).subscribe({
      next: (payment) => {
        this.saving.set(false);
        this.router.navigate(['/cnss', payment._id]);
      },
      error: (err) => {
        this.saving.set(false);
        const message = err?.error?.message || 'Impossible d\'enregistrer le paiement CNSS.';
        this.errorMessage.set(message);
      },
    });
  }

  private loadEmployees(): void {
    this.employeeService.getEmployees({ page: 1, limit: 200 }).subscribe({
      next: (response: EmployeeListResponse) =>
        this.employees.set(response.employees.filter((employee) => employee.cnssApplicable)),
      error: () => this.employees.set([]),
    });
  }

  private cleanOptional(value?: string | null): string | undefined {
    const trimmed = (value || '').trim();
    return trimmed.length ? trimmed : undefined;
  }
}
