import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { InvoiceService } from './invoice.service';
import { Invoice } from './invoice.model';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './invoice-detail.component.html',
  styleUrl: './invoice-detail.component.scss',
})
export class InvoiceDetailComponent {
  protected readonly invoice = signal<Invoice | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  private route = inject(ActivatedRoute);

  constructor(private invoiceService: InvoiceService) {
    this.loadInvoice();
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
}
