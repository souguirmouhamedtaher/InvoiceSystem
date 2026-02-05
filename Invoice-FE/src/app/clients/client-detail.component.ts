import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientService } from './client.service';
import { Client } from './client.model';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client-detail.component.html',
  styleUrl: './client-detail.component.scss',
})
export class ClientDetailComponent {
  protected readonly client = signal<Client | null>(null);
  protected readonly clientId = signal<string>('');
  protected readonly errorMessage = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private clientService: ClientService,
    private router: Router
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.clientId.set(id);
      this.clientService.getClientById(id).subscribe({
        next: (data) => this.client.set(data),
        error: (err) => {
          const message = err?.error?.message || 'Impossible de charger le client.';
          this.errorMessage.set(message);
        },
      });
    } else {
      this.errorMessage.set('Client introuvable.');
    }
  }

  deleteClient(): void {
    const id = this.clientId();
    if (!id) {
      this.errorMessage.set('Client introuvable.');
      return;
    }

    if (!confirm('Supprimer ce client ?')) {
      return;
    }

    this.clientService.deleteClient(id).subscribe({
      next: () => this.router.navigate(['/clients']),
      error: (err) => {
        const message = err?.error?.message || 'Impossible de supprimer le client.';
        this.errorMessage.set(message);
      },
    });
  }
}
