import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CreateEmployeePayload, Employee, EmployeeListResponse, UpdateEmployeePayload } from './employee.model';
import { EmployeeService } from './employee.service';
import { Client, ClientListResponse } from '../clients/client.model';
import { ClientService } from '../clients/client.service';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss',
})
export class EmployeeListComponent {
  protected readonly employees = signal<Employee[]>([]);
  protected readonly companies = signal<Client[]>([]);
  protected readonly selectedEmployee = signal<Employee | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly limit = 10;
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly payrollResult = signal<{
    month: string;
    payrollDate: string;
    createdSalaries: number;
    skippedSalaries: number;
    createdCnss: number;
    skippedCnss: number;
    totalSalaryAmount: number;
    totalCnssAmount: number;
  } | null>(null);
  protected readonly payrollSummary = signal<{
    month: string;
    totalSalaryAmount: number;
    totalCnssAmount: number;
    salaryCount: number;
    cnssCount: number;
  } | null>(null);
  protected readonly summaryMonth = signal<string>('');
  protected readonly showEmployeeForm = signal(false);
  protected readonly showPayrollForm = signal(false);

  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  protected readonly form = this.fb.group({
    search: [''],
    companyId: [''],
  });

  protected readonly employeeForm = this.fb.group({
    companyId: ['', [Validators.required]],
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.email]],
    phone: [''],
    cnssApplicable: [false],
    monthlyNetSalary: [0, [Validators.required, Validators.min(0)]],
    cnssRatePercent: [0, [Validators.min(0), Validators.max(100)]],
    notes: [''],
  });

  protected readonly payrollForm = this.fb.group({
    month: ['', [Validators.required]],
    companyId: [''],
  });

  constructor(
    private employeeService: EmployeeService,
    private clientService: ClientService
  ) {
    this.loadCompanies();
    this.loadEmployees(1);
    this.loadPayrollSummary();

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
    this.form.reset({ search: '', companyId: '' });
  }

  resetEmployeeForm(): void {
    this.selectedEmployee.set(null);
    this.employeeForm.reset({
      companyId: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      cnssApplicable: false,
      monthlyNetSalary: 0,
      cnssRatePercent: 0,
      notes: '',
    });
    this.formError.set(null);
  }

  selectEmployee(employee: Employee): void {
    this.selectedEmployee.set(employee);
    const companyId = typeof employee.companyId === 'object' && employee.companyId?._id
      ? employee.companyId._id
      : typeof employee.companyId === 'string'
      ? employee.companyId
      : '';
    
    this.employeeForm.patchValue({
      companyId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email || '',
      phone: employee.phone || '',
      cnssApplicable: employee.cnssApplicable,
      monthlyNetSalary: employee.monthlyNetSalary || 0,
      cnssRatePercent: employee.cnssRatePercent || 0,
      notes: employee.notes || '',
    });
    this.formError.set(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  submitEmployee(): void {
    this.formError.set(null);

    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    const selected = this.selectedEmployee();
    if (selected && !confirm('Modifier cet employe ?')) {
      return;
    }

    const cnssApplicable = this.employeeForm.value.cnssApplicable === true;
    const cnssRatePercent = cnssApplicable
      ? Number(this.employeeForm.value.cnssRatePercent || 0)
      : 0;

    const payload: CreateEmployeePayload = {
      companyId: this.employeeForm.value.companyId || '',
      firstName: (this.employeeForm.value.firstName || '').trim(),
      lastName: (this.employeeForm.value.lastName || '').trim(),
      email: this.cleanOptional(this.employeeForm.value.email),
      phone: this.cleanOptional(this.employeeForm.value.phone),
      cnssApplicable,
      monthlyNetSalary: Number(this.employeeForm.value.monthlyNetSalary || 0),
      cnssRatePercent,
      notes: this.cleanOptional(this.employeeForm.value.notes),
    };

    this.saving.set(true);

    const request = selected
      ? this.employeeService.updateEmployee(selected._id, payload as UpdateEmployeePayload)
      : this.employeeService.createEmployee(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.resetEmployeeForm();
        this.loadEmployees(this.page());
      },
      error: (err) => {
        this.saving.set(false);
        const message = err?.error?.message || 'Impossible d\'enregistrer l\'employe.';
        this.formError.set(message);
      },
    });
  }

  deleteEmployee(employee: Employee): void {
    if (!confirm('Supprimer cet employe ?')) {
      return;
    }

    this.employeeService.deleteEmployee(employee._id).subscribe({
      next: () => this.loadEmployees(this.page()),
      error: (err) => {
        const message = err?.error?.message || 'Impossible de supprimer l\'employe.';
        this.errorMessage.set(message);
      },
    });
  }

  generateMonthlyPayroll(): void {
    this.payrollResult.set(null);
    if (this.payrollForm.invalid) {
      this.payrollForm.markAllAsTouched();
      return;
    }

    const month = this.payrollForm.value.month || '';
    const companyId = this.payrollForm.value.companyId || undefined;

    this.saving.set(true);
    this.employeeService.generateMonthlyPayroll({ month, companyId }).subscribe({
      next: (result) => {
        this.saving.set(false);
        this.payrollResult.set(result);
        this.loadPayrollSummary(); // Refresh summary after generation
      },
      error: (err) => {
        this.saving.set(false);
        const message = err?.error?.message || 'Impossible de generer la paie.';
        this.formError.set(message);
      },
    });
  }

  formatDate(value?: string | null): string {
    if (!value) return '';
    const parts = value.split('-');
    if (parts.length !== 3) return value;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  private loadEmployees(page: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const search = (this.form.value.search || '').trim();
    const companyId = this.form.value.companyId || undefined;

    this.employeeService.getEmployees({ page, limit: this.limit, search, companyId }).subscribe({
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

  private cleanOptional(value?: string | null): string | undefined {
    const trimmed = (value || '').trim();
    return trimmed.length ? trimmed : undefined;
  }

  private loadCompanies(): void {
    this.clientService.getClients({ page: 1, limit: 200, companyType: 'mycompany' }).subscribe({
      next: (response: ClientListResponse) => this.companies.set(response.companies),
      error: () => this.companies.set([]),
    });
  }

  loadPayrollSummary(): void {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.summaryMonth.set(month);

    this.employeeService.getPayrollSummary({ month }).subscribe({
      next: (summary) => this.payrollSummary.set(summary),
      error: () => this.payrollSummary.set(null),
    });
  }

  refreshSummary(): void {
    if (this.summaryMonth()) {
      this.employeeService.getPayrollSummary({ month: this.summaryMonth() }).subscribe({
        next: (summary) => this.payrollSummary.set(summary),
        error: () => this.payrollSummary.set(null),
      });
    }
  }
}
