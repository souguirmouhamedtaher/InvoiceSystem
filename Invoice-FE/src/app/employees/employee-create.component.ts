import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EmployeeService } from './employee.service';
import { CreateEmployeePayload } from './employee.model';

@Component({
  selector: 'app-employee-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-create.component.html',
  styleUrl: './employee-create.component.scss',
})
export class EmployeeCreateComponent {
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private fb = inject(FormBuilder);

  protected readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.email]],
    phone: [''],
    cnssApplicable: [false, [Validators.required]],
    notes: [''],
  });

  constructor(
    private employeeService: EmployeeService,
    private router: Router
  ) {}

  submit(): void {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CreateEmployeePayload = {
      firstName: (this.form.value.firstName || '').trim(),
      lastName: (this.form.value.lastName || '').trim(),
      email: this.cleanOptional(this.form.value.email),
      phone: this.cleanOptional(this.form.value.phone),
      cnssApplicable: Boolean(this.form.value.cnssApplicable),
      notes: this.cleanOptional(this.form.value.notes),
    };

    this.saving.set(true);
    this.employeeService.createEmployee(payload).subscribe({
      next: (employee) => {
        this.saving.set(false);
        this.router.navigate(['/employees', employee._id]);
      },
      error: (err) => {
        this.saving.set(false);
        const message = err?.error?.message || 'Impossible de creer l\'employe.';
        this.errorMessage.set(message);
      },
    });
  }

  private cleanOptional(value?: string | null): string | undefined {
    const trimmed = (value || '').trim();
    return trimmed.length ? trimmed : undefined;
  }
}
