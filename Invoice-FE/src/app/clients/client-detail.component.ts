import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
  protected readonly errorMessage = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private clientService: ClientService
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
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
}
