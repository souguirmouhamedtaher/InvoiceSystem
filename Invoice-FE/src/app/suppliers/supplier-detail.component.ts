import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClientService } from '../clients/client.service';
import { Client } from '../clients/client.model';

@Component({
  selector: 'app-supplier-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './supplier-detail.component.html',
  styleUrl: './supplier-detail.component.scss',
})
export class SupplierDetailComponent {
  protected readonly supplier = signal<Client | null>(null);
  protected readonly supplierId = signal<string>('');
  protected readonly errorMessage = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private clientService: ClientService
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.supplierId.set(id);
      this.clientService.getClientById(id).subscribe({
        next: (data) => this.supplier.set(data),
        error: (err) => {
          const message = err?.error?.message || 'Impossible de charger le fournisseur.';
          this.errorMessage.set(message);
        },
      });
    } else {
      this.errorMessage.set('Fournisseur introuvable.');
    }
  }
}
