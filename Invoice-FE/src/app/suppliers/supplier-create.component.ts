import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupplierService } from './supplier.service';
import { CreateSupplierPayload } from './supplier.model';
import { CompanySwitcherService } from '../core/company-switcher.service';

@Component({
  selector: 'app-supplier-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './supplier-create.component.html',
  styleUrl: './supplier-create.component.scss',
})
export class SupplierCreateComponent {
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private fb = inject(FormBuilder);
  private companySwitcher = inject(CompanySwitcherService);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    address: ['', [Validators.required, Validators.minLength(6)]],
    phone: ['', [Validators.required, Validators.pattern(/^[+\d\s().-]+$/)]],
    taxId: [''],
    notes: [''],
  });

  constructor(
    private supplierService: SupplierService,
    private router: Router
  ) {}

  submit(): void {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const companyId = this.companySwitcher.currentCompanyId();
    if (!companyId) {
      this.errorMessage.set('Selectionnez une societe avant de creer un fournisseur.');
      return;
    }

    const payload: CreateSupplierPayload = {
      companyId,
      name: (this.form.value.name || '').trim(),
      email: (this.form.value.email || '').trim(),
      address: (this.form.value.address || '').trim(),
      phone: (this.form.value.phone || '').trim(),
      taxId: this.cleanOptional(this.form.value.taxId),
      notes: this.cleanOptional(this.form.value.notes),
    };

    this.saving.set(true);
    this.supplierService.createSupplier(payload).subscribe({
      next: (supplier) => {
        this.saving.set(false);
        this.router.navigate(['/suppliers', supplier._id]);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(this.humanizeError(err));
      },
    });
  }

  private cleanOptional(value?: string | null): string | undefined {
    const trimmed = (value || '').trim();
    return trimmed.length ? trimmed : undefined;
  }

  private humanizeError(err: any): string {
    const msg = err?.error?.message;
    const errors = err?.error?.errors;
    if (Array.isArray(errors) && errors.length) {
      const parts = errors.map((e: any) => e?.message || `${e?.property}: ${e?.constraints ? Object.values(e.constraints).join(', ') : 'invalide'}`);
      return parts.join('. ');
    }
    if (Array.isArray(msg) && msg.length) {
      return msg.join('. ');
    }
    const message = typeof msg === 'string' ? msg : '';
    if (!message) {
      return 'Une erreur est survenue. Veuillez reessayer.';
    }
    if (message.includes('name already exists')) {
      return 'Ce fournisseur existe deja.';
    }
    if (message.includes('email already exists')) {
      return 'Cet email est deja utilise.';
    }
    return message;
  }
}
