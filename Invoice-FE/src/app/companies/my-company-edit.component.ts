import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CompanyService } from './company.service';
import { Company, UpdateCompanyPayload } from './company.model';

@Component({
  selector: 'app-my-company-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './my-company-edit.component.html',
  styleUrl: './my-company-edit.component.scss',
})
export class MyCompanyEditComponent {
  protected readonly saving = signal(false);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  protected readonly form = this.fb.group({
    companyname: ['', [Validators.required, Validators.minLength(2)]],
    Patente: [''],
    email: ['', [Validators.required, Validators.email]],
    address: ['', [Validators.required, Validators.minLength(6)]],
    phonesRaw: ['', [Validators.required, Validators.pattern(/^[+\d\s,.-]+$/)]],
    region: [''],
    country: [''],
    notes: [''],
    bankName: [''],
    bankIBAN: [''],
    bankRib: [''],
    bankBIC: [''],
    bankAccountNumber: [''],
    bankOwnerIdentifier: [''],
    bankInstitutionCode: [''],
    bankInstitutionName: [''],
    bankBranchCode: [''],
    bankCountry: [''],
  });

  constructor(private companyService: CompanyService) {
    this.loadCompany();
  }

  protected loadCompany(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Societe introuvable.');
      this.loading.set(false);
      return;
    }

    this.companyService
      .getCompanyById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (company: Company) => {
          this.form.patchValue({
            companyname: company.companyname || '',
            Patente: company.Patente || '',
            email: company.email || '',
            address: company.address || '',
            phonesRaw: (company.phones || []).join(', '),
            region: company.region || '',
            country: company.country || '',
            notes: company.notes || '',
            bankName: company.bankName || '',
            bankIBAN: company.bankIBAN || '',
            bankRib: company.bankRib || '',
            bankBIC: company.bankBIC || '',
            bankAccountNumber: company.bankAccountNumber || '',
            bankOwnerIdentifier: company.bankOwnerIdentifier || '',
            bankInstitutionCode: company.bankInstitutionCode || '',
            bankInstitutionName: company.bankInstitutionName || '',
            bankBranchCode: company.bankBranchCode || '',
            bankCountry: company.bankCountry || '',
          });
          this.loading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message || 'Impossible de charger la societe.');
          this.loading.set(false);
        },
      });
  }

  protected reloadCompany(): void {
    this.loadCompany();
  }

  submit(): void {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Societe introuvable.');
      return;
    }

    const phones = this.parsePhones(this.form.value.phonesRaw || '');
    if (!phones.length) {
      this.errorMessage.set('Ajoutez au moins un numero de telephone valide.');
      return;
    }

    const payload: UpdateCompanyPayload = {
      companyname: (this.form.value.companyname || '').trim(),
      Patente: this.cleanOptional(this.form.value.Patente),
      email: (this.form.value.email || '').trim(),
      address: (this.form.value.address || '').trim(),
      phones,
      region: this.cleanOptional(this.form.value.region),
      country: this.cleanOptional(this.form.value.country),
      notes: this.cleanOptional(this.form.value.notes),
      bankName: this.cleanOptional(this.form.value.bankName),
      bankIBAN: this.cleanOptional(this.form.value.bankIBAN),
      bankRib: this.cleanOptional(this.form.value.bankRib),
      bankBIC: this.cleanOptional(this.form.value.bankBIC),
      bankAccountNumber: this.cleanOptional(this.form.value.bankAccountNumber),
      bankOwnerIdentifier: this.cleanOptional(this.form.value.bankOwnerIdentifier),
      bankInstitutionCode: this.cleanOptional(this.form.value.bankInstitutionCode),
      bankInstitutionName: this.cleanOptional(this.form.value.bankInstitutionName),
      bankBranchCode: this.cleanOptional(this.form.value.bankBranchCode),
      bankCountry: this.cleanOptional(this.form.value.bankCountry),
    };

    this.saving.set(true);
    this.companyService.updateCompany(id, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/my-companies']);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.message || 'Impossible de mettre a jour la societe.');
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
}
