import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientService } from '../clients/client.service';
import { CreateClientPayload } from '../clients/client.model';

@Component({
  selector: 'app-my-company-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './my-company-create.component.html',
  styleUrl: './my-company-create.component.scss',
})
export class MyCompanyCreateComponent {
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private fb = inject(FormBuilder);

  protected readonly form = this.fb.group({
    companyname: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    address: ['', [Validators.required, Validators.minLength(6)]],
    phonesRaw: ['', [Validators.required, Validators.pattern(/^[+\d\s,.-]+$/)]],
    city: [''],
    country: [''],
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

    const phones = this.parsePhones(this.form.value.phonesRaw || '');
    if (!phones.length) {
      this.errorMessage.set('Ajoutez au moins un numero de telephone valide.');
      return;
    }

    const payload: CreateClientPayload = {
      companyname: (this.form.value.companyname || '').trim(),
      companyType: 'mycompany',
      email: (this.form.value.email || '').trim(),
      address: (this.form.value.address || '').trim(),
      phones,
      city: this.cleanOptional(this.form.value.city),
      country: this.cleanOptional(this.form.value.country),
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

  private parsePhones(value: string): string[] {
    return value
      .split(',')
      .map((phone) => phone.trim())
      .filter((phone) => phone.length > 0);
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
      return 'Cette societe existe deja.';
    }

    if (message.includes('email already exists')) {
      return 'Cet email est deja utilise.';
    }

    return message;
  }
}
