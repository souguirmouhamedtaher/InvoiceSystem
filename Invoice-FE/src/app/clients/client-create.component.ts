import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientService } from './client.service';
import { CreateClientPayload } from './client.model';
import { CompanySwitcherService } from '../core/company-switcher.service';

@Component({
  selector: 'app-client-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './client-create.component.html',
  styleUrl: './client-create.component.scss',
})
export class ClientCreateComponent {
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private fb = inject(FormBuilder);
  private companySwitcher = inject(CompanySwitcherService);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    address: ['', [Validators.required, Validators.minLength(6)]],
    phone: ['', [Validators.required, Validators.pattern(/^[+\d\s().-]+$/)]],
    taxId: [''],
    notes: [''],
  });

  constructor(
    private clientService: ClientService,
    private router: Router
  ) {}

  submit(): void {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const companyId = this.companySwitcher.currentCompanyId();
    if (!companyId) {
      this.errorMessage.set('Selectionnez une societe avant de creer un client.');
      return;
    }

    const payload: CreateClientPayload = {
      companyId,
      name: (this.form.value.name || '').trim(),
      email: (this.form.value.email || '').trim(),
      address: (this.form.value.address || '').trim(),
      phone: (this.form.value.phone || '').trim(),
      taxId: this.cleanOptional(this.form.value.taxId),
      notes: this.cleanOptional(this.form.value.notes),
    };

    this.saving.set(true);
    this.clientService.createClient(payload).subscribe({
      next: (client) => {
        this.saving.set(false);
        this.router.navigate(['/clients', client._id]);
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
