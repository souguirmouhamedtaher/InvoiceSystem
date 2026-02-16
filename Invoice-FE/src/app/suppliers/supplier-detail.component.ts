import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupplierService } from './supplier.service';
import { Supplier } from './supplier.model';

@Component({
  selector: 'app-supplier-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './supplier-detail.component.html',
  styleUrl: './supplier-detail.component.scss',
})
export class SupplierDetailComponent {
  protected readonly supplier = signal<Supplier | null>(null);
  protected readonly supplierId = signal<string>('');
  protected readonly errorMessage = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private supplierService: SupplierService,
    private router: Router
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.supplierId.set(id);
      this.supplierService.getSupplierById(id).subscribe({
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

  deleteSupplier(): void {
    const id = this.supplierId();
    if (!id) {
      this.errorMessage.set('Fournisseur introuvable.');
      return;
    }

    if (!confirm('Supprimer ce fournisseur ?')) {
      return;
    }

    this.supplierService.deleteSupplier(id).subscribe({
      next: () => this.router.navigate(['/suppliers']),
      error: (err) => {
        const message = err?.error?.message || 'Impossible de supprimer le fournisseur.';
        this.errorMessage.set(message);
      },
    });
  }
}
