import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InvoiceService } from './invoice.service';
import { Invoice } from './invoice.model';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './invoice-detail.component.html',
  styleUrl: './invoice-detail.component.scss',
})
export class InvoiceDetailComponent {
  protected readonly invoice = signal<Invoice | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly paymentError = signal<string | null>(null);
  protected readonly savingPayment = signal(false);
  protected readonly pdfError = signal<string | null>(null);
  protected readonly downloadingPdf = signal(false);

  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  protected readonly paymentForm = this.fb.group({
    amount: [null, [Validators.required, Validators.min(0.01)]],
    date: ['', [Validators.required]],
    paymentType: ['cash', [Validators.required]],
    proofUrl: [''],
    notes: [''],
  });

  constructor(private invoiceService: InvoiceService) {
    this.loadInvoice();

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadInvoice());
  }

  private loadInvoice(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.invoiceService.getInvoiceById(id).subscribe({
        next: (data) => this.invoice.set(data),
        error: (err) => {
          const message = err?.error?.message || 'Impossible de charger la facture.';
          this.errorMessage.set(message);
        },
      });
    } else {
      this.errorMessage.set('Facture introuvable.');
    }
  }

  submitPayment(): void {
    this.paymentError.set(null);
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.paymentError.set('Facture introuvable.');
      return;
    }

    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const value = this.paymentForm.value;
    this.savingPayment.set(true);

    this.invoiceService
      .addInvoicePayment(id, {
        amount: Number(value.amount || 0),
        date: value.date || '',
        paymentType: (value.paymentType || 'cash') as any,
        proofUrl: value.proofUrl || undefined,
        notes: value.notes || undefined,
      })
      .subscribe({
        next: (updated) => {
          this.invoice.set(updated);
          this.paymentForm.reset({
            amount: null,
            date: '',
            paymentType: 'cash',
            proofUrl: '',
            notes: '',
          });
          this.savingPayment.set(false);
        },
        error: (err) => {
          this.savingPayment.set(false);
          const message = err?.error?.message || 'Impossible d\'ajouter le paiement.';
          this.paymentError.set(message);
        },
      });
  }

  downloadPdf(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.pdfError.set('Facture introuvable.');
      return;
    }

    this.pdfError.set(null);
    this.downloadingPdf.set(true);

    this.invoiceService.downloadInvoicePdf(id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `facture-${id}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        this.downloadingPdf.set(false);
      },
      error: (err) => {
        this.downloadingPdf.set(false);
        const message = err?.error?.message || 'Impossible de telecharger le PDF.';
        this.pdfError.set(message);
      },
    });
  }
}
