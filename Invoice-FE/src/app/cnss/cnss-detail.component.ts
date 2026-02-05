import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CnssService } from './cnss.service';
import { CnssPayment } from './cnss.model';

@Component({
  selector: 'app-cnss-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cnss-detail.component.html',
  styleUrl: './cnss-detail.component.scss',
})
export class CnssDetailComponent {
  protected readonly payment = signal<CnssPayment | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private cnssService: CnssService,
    private router: Router
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cnssService.getPaymentById(id).subscribe({
        next: (data) => this.payment.set(data),
        error: (err) => {
          const message = err?.error?.message || 'Impossible de charger le paiement CNSS.';
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

    if (!confirm('Supprimer ce paiement CNSS ?')) {
      return;
    }

    this.cnssService.deletePayment(id).subscribe({
      next: () => this.router.navigate(['/cnss']),
      error: (err) => {
        const message = err?.error?.message || 'Impossible de supprimer le paiement.';
        this.errorMessage.set(message);
      },
    });
  }
}
