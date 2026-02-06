import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TvaPaymentsService } from './tva-payments.service';
import { TvaPayment } from './tva-payments.model';

@Component({
  selector: 'app-tva-payments-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './tva-payments-detail.component.html',
  styleUrl: './tva-payments-detail.component.scss',
})
export class TvaPaymentsDetailComponent {
  protected readonly payment = signal<TvaPayment | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private paymentsService: TvaPaymentsService,
    private router: Router
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.paymentsService.getPaymentById(id).subscribe({
        next: (data) => this.payment.set(data),
        error: (err) => {
          const message = err?.error?.message || 'Impossible de charger le paiement TVA.';
          this.errorMessage.set(message);
        },
      });
    } else {
      this.errorMessage.set('Paiement introuvable.');
    }
  }

  deletePayment(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Paiement introuvable.');
      return;
    }

    if (!confirm('Supprimer ce paiement TVA ?')) {
      return;
    }

    this.paymentsService.deletePayment(id).subscribe({
      next: () => this.router.navigate(['/tva-payments']),
      error: (err) => {
        const message = err?.error?.message || 'Impossible de supprimer le paiement.';
        this.errorMessage.set(message);
      },
    });
  }
}
