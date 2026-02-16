import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CompanyService } from './company.service';
import { CreateCompanyPayload } from './company.model';
import { CompanySwitcherService } from '../core/company-switcher.service';

@Component({
  selector: 'app-my-company-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './my-company-create.component.html',
  styleUrl: './my-company-create.component.scss',
})
export class MyCompanyCreateComponent {
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private fb = inject(FormBuilder);
  private companySwitcher = inject(CompanySwitcherService);

  protected readonly form = this.fb.group({
    companyname: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    address: ['', [Validators.required, Validators.minLength(6)]],
    phonesRaw: ['', [Validators.required, Validators.pattern(/^[+\d\s,.-]+$/)]],
    region: [''],
    country: [''],
    notes: [''],
  });

  constructor(
    private companyService: CompanyService,
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

    const payload: CreateCompanyPayload = {
      companyname: (this.form.value.companyname || '').trim(),
      email: (this.form.value.email || '').trim(),
      address: (this.form.value.address || '').trim(),
      phones,
      region: this.cleanOptional(this.form.value.region),
      country: this.cleanOptional(this.form.value.country),
      notes: this.cleanOptional(this.form.value.notes),
    };

    this.saving.set(true);
    this.companyService.createCompany(payload).subscribe({
      next: (company: any) => {
        this.saving.set(false);
        const c = company?.data ?? company;
        const id = c?._id ?? c?.id;
        if (id) {
          this.companySwitcher.setCreatedCompany({
            _id: String(id),
            companyname: c.companyname ?? '',
          });
        }
        this.router.navigate(['/dashboard']);
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
