import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TvaPaymentsService } from './tva-payments.service';
import { CreateTvaPaymentPayload } from './tva-payments.model';
import { CompanySwitcherService } from '../core/company-switcher.service';

@Component({
  selector: 'app-tva-payments-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tva-payments-create.component.html',
  styleUrl: './tva-payments-create.component.scss',
})
export class TvaPaymentsCreateComponent {
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private fb = inject(FormBuilder);
  private companySwitcher = inject(CompanySwitcherService);

  protected readonly form = this.fb.group({
    month: ['', [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0)]],
    paymentDate: ['', [Validators.required]],
    paymentType: ['cash', [Validators.required]],
    proofUrl: [''],
    notes: [''],
  });

  constructor(private paymentsService: TvaPaymentsService, private router: Router) {}

  submit(): void {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CreateTvaPaymentPayload = {
      companyId: this.companySwitcher.currentCompanyId() || '',
      month: this.form.value.month || '',
      amount: Number(this.form.value.amount || 0),
      paymentDate: this.form.value.paymentDate || '',
      paymentType: (this.form.value.paymentType || 'cash') as CreateTvaPaymentPayload['paymentType'],
      proofUrl: this.cleanOptional(this.form.value.proofUrl),
      notes: this.cleanOptional(this.form.value.notes),
    };

    if (!payload.companyId) {
      this.errorMessage.set('Veuillez selectionner une entreprise.');
      return;
    }

    this.saving.set(true);
    this.paymentsService.createPayment(payload).subscribe({
      next: (payment) => {
        this.saving.set(false);
        this.router.navigate(['/tva-payments', payment._id]);
      },
      error: (err) => {
        this.saving.set(false);
        const message = err?.error?.message || 'Impossible d\'enregistrer le paiement TVA.';
        this.errorMessage.set(message);
      },
    });
  }

  private cleanOptional(value?: string | null): string | undefined {
    const trimmed = (value || '').trim();
    return trimmed.length ? trimmed : undefined;
  }
}
