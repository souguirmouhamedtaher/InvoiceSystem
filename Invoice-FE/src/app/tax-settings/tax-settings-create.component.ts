import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TaxSettingsService } from './tax-settings.service';

@Component({
  selector: 'app-tax-settings-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './tax-settings-create.component.html',
  styleUrl: './tax-settings-create.component.scss',
})
export class TaxSettingsCreateComponent {
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private fb = inject(FormBuilder);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    taxType: ['TVA', [Validators.required]],
    taxprice: [19, [Validators.required, Validators.min(0)]],
    isactive: [true],
    notes: [''],
  });

  constructor(
    private taxSettingsService: TaxSettingsService,
    private router: Router
  ) {}

  submit(): void {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;

    this.saving.set(true);
    this.taxSettingsService
      .createTaxSetting({
        name: value.name || '',
        taxType: (value.taxType || 'TVA') as 'TVA' | 'RE',
        taxprice: Number(value.taxprice),
        isactive: value.isactive ?? true,
        notes: value.notes || undefined,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/invoices/new']);
        },
        error: (err) => {
          this.saving.set(false);
          const message = err?.error?.message || 'Impossible de creer la taxe.';
          this.errorMessage.set(message);
        },
      });
  }
}
