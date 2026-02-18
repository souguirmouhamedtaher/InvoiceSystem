import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InvoiceService } from './invoice.service';
import { Invoice, TtnSimulation } from './invoice.model';

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
  protected readonly xmlError = signal<string | null>(null);
  protected readonly downloadingXml = signal(false);
  protected readonly ttnSubmitting = signal(false);
  protected readonly ttnError = signal<string | null>(null);
  protected readonly ttnResult = signal<TtnSimulation | null>(null);
  protected readonly ttnHistory = signal<TtnSimulation[]>([]);
  protected readonly showXmlPreview = signal(false);
  protected readonly previewXmlTitle = signal('');
  protected readonly previewXmlContent = signal('');

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
        next: (data) => {
          this.invoice.set(data);
          this.loadTtnHistory(id);
        },
        error: (err) => {
          const message = err?.error?.message || 'Impossible de charger la facture.';
          this.errorMessage.set(message);
        },
      });
    } else {
      this.errorMessage.set('Facture introuvable.');
    }
  }

  private loadTtnHistory(id: string): void {
    this.invoiceService.getTtnSimulationHistory(id).subscribe({
      next: (data) => this.ttnHistory.set(data.simulations || []),
      error: () => this.ttnHistory.set([]),
    });
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

  downloadXml(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.xmlError.set('Facture introuvable.');
      return;
    }

    this.xmlError.set(null);
    this.downloadingXml.set(true);

    this.invoiceService.downloadInvoiceXml(id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `facture-${id}.xml`;
        link.click();
        URL.revokeObjectURL(url);
        this.downloadingXml.set(false);
      },
      error: (err) => {
        this.downloadingXml.set(false);
        const message = err?.error?.message || 'Impossible de telecharger le XML.';
        this.xmlError.set(message);
      },
    });
  }

  submitTtnSimulation(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.ttnError.set('Facture introuvable.');
      return;
    }

    this.ttnError.set(null);
    this.ttnSubmitting.set(true);

    this.invoiceService.submitTtnSimulation(id).subscribe({
      next: (result) => {
        this.ttnResult.set(result);
        this.ttnSubmitting.set(false);
        this.loadTtnHistory(id);
      },
      error: (err) => {
        this.ttnSubmitting.set(false);
        const message = err?.error?.message || 'Impossible de soumettre a TTN.';
        this.ttnError.set(message);
      },
    });
  }

  downloadSimulationXml(kind: 'request' | 'response', sim: TtnSimulation): void {
    const xml = kind === 'request' ? sim.requestXml : sim.responseXml || '';
    if (!xml) {
      this.ttnError.set('XML indisponible pour cette simulation.');
      return;
    }

    const ref = sim.reference || 'ttn-sim';
    const suffix = kind === 'request' ? 'request' : 'response';
    this.downloadTextFile(`${ref}-${suffix}.xml`, xml);
  }

  openSimulationPreview(kind: 'request' | 'response', sim: TtnSimulation): void {
    const xml = kind === 'request' ? sim.requestXml : sim.responseXml || '';
    if (!xml) {
      this.ttnError.set('XML indisponible pour cette simulation.');
      return;
    }

    const label = kind === 'request' ? 'Requete' : 'Reponse';
    const ref = sim.reference || 'TTN-SIM';
    this.previewXmlTitle.set(`${label} TTN - ${ref}`);
    this.previewXmlContent.set(xml);
    this.showXmlPreview.set(true);
  }

  closeSimulationPreview(): void {
    this.showXmlPreview.set(false);
  }

  private downloadTextFile(filename: string, content: string): void {
    const blob = new Blob([content], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
