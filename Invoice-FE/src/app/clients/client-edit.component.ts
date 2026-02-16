import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientService } from './client.service';
import { UpdateClientPayload } from './client.model';

@Component({
  selector: 'app-client-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './client-edit.component.html',
  styleUrl: './client-edit.component.scss',
})
export class ClientEditComponent {
  protected readonly saving = signal(false);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    address: ['', [Validators.required, Validators.minLength(6)]],
    phone: ['', [Validators.required, Validators.pattern(/^[+\d\s().-]+$/)]],
    taxId: [''],
    notes: [''],
  });

  readonly clientId = this.route.snapshot.paramMap.get('id') || '';

  constructor(
    private clientService: ClientService,
    private router: Router
  ) {
    if (this.clientId) {
      this.clientService.getClientById(this.clientId).subscribe({
        next: (client) => {
          this.form.patchValue({
            name: client.name,
            email: client.email,
            address: client.address,
            phone: client.phone,
            taxId: client.taxId || '',
            notes: client.notes || '',
          });
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          const message = err?.error?.message || 'Impossible de charger le client.';
          this.errorMessage.set(message);
        },
      });
    } else {
      this.loading.set(false);
      this.errorMessage.set('Client introuvable.');
    }
  }

  submit(): void {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: UpdateClientPayload = {
      name: (this.form.value.name || '').trim(),
      email: (this.form.value.email || '').trim(),
      address: (this.form.value.address || '').trim(),
      phone: (this.form.value.phone || '').trim(),
      taxId: this.cleanOptional(this.form.value.taxId),
      notes: this.cleanOptional(this.form.value.notes),
    };

    if (!confirm('Modifier ce client ?')) {
      return;
    }

    this.saving.set(true);
    this.clientService.updateClient(this.clientId, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/clients', this.clientId]);
      },
      error: (err) => {
        this.saving.set(false);
        const message = this.humanizeError(err?.error?.message);
        this.errorMessage.set(message);
      },
    });
  }

  private cleanOptional(value?: string | null): string | undefined {
    const trimmed = (value || '').trim();
    return trimmed.length ? trimmed : undefined;
  }

  private humanizeError(message?: string): string {
    if (!message) {
      return 'Une erreur est survenue. Veuillez reessayer.';
    }

    if (message.includes('name already exists')) {
      return 'Ce client existe deja.';
    }

    if (message.includes('email already exists')) {
      return 'Cet email est deja utilise.';
    }

    return message;
  }
}
