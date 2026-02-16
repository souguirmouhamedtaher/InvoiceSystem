import { CommonModule } from '@angular/common';
import { Component, inject, signal, effect } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, map, switchMap } from 'rxjs';
import { ClientService } from '../clients/client.service';
import { Client } from '../clients/client.model';
import { Supplier } from '../suppliers/supplier.model';
import { CompanySwitcherService } from '../core/company-switcher.service';
import { LibelleService } from '../libelles/libelle.service';
import { TaxSettingsService } from '../tax-settings/tax-settings.service';
import { TaxSetting } from '../tax-settings/tax-settings.model';
import { InvoiceService } from './invoice.service';
import { SupplierService } from '../suppliers/supplier.service';
import {
  ClientType,
  CreateInvoicePayload,
  InvoiceTotals,
  InvoiceType,
} from './invoice.model';

@Component({
  selector: 'app-invoice-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './invoice-create.component.html',
  styleUrl: './invoice-create.component.scss',
})
export class InvoiceCreateComponent {
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly totals = signal<InvoiceTotals | null>(null);

  protected readonly clients = signal<Client[]>([]);
  protected readonly suppliers = signal<Supplier[]>([]);
  protected readonly taxes = signal<TaxSetting[]>([]);

  private fb = inject(FormBuilder);
  private companySwitcher = inject(CompanySwitcherService);

  protected readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(2)]],
    dateInvoice: [this.today(), [Validators.required]],
    applicationName: [''],
    clientType: ['national'],
    invoiceType: ['selling'],
    clientId: [''],
    supplierId: [''],
    companyId: ['', [Validators.required]],
    taxSettingsId: ['', [Validators.required]],
    timbre: [1],
    fileUrl: [''],
    notes: [''],
    lines: this.fb.array<FormGroup>([]),
  });

  constructor(
    private clientService: ClientService,
    private supplierService: SupplierService,
    private libelleService: LibelleService,
    private taxSettingsService: TaxSettingsService,
    private invoiceService: InvoiceService,
    private router: Router
  ) {
    this.addLine();
    this.loadReferenceData();
    effect(() => {
      const companyId = this.companySwitcher.currentCompanyId();
      if (companyId && this.form.get('companyId')) {
        this.form.patchValue({ companyId }, { emitEvent: false });
      }
    });
  }

  /** Clients excluding current company (so "my company" never appears in Customers). */
  protected clientsForSelect(): Client[] {
    return this.clients();
  }

  protected clientRequiredError(): boolean {
    return (
      this.submitted() &&
      (this.form.value.invoiceType || 'selling') === 'selling' &&
      !this.form.value.clientId
    );
  }

  protected supplierRequiredError(): boolean {
    return (
      this.submitted() &&
      this.form.value.invoiceType === 'buying' &&
      !this.form.value.supplierId
    );
  }

  protected lineInvalid(index: number): boolean {
    const line = this.lines.at(index);
    return !!(line?.get('name')?.invalid && line.get('name')?.touched) ||
      !!(line?.get('qte')?.invalid && line.get('qte')?.touched) ||
      !!(line?.get('prixHT')?.invalid && line.get('prixHT')?.touched);
  }

  protected lineErrors(): number[] {
    const errs: number[] = [];
    this.lines.controls.forEach((line, i) => {
      if (line.get('name')?.invalid && line.get('name')?.touched) errs.push(i + 1);
      else if (line.get('qte')?.invalid && line.get('qte')?.touched) errs.push(i + 1);
      else if (line.get('prixHT')?.invalid && line.get('prixHT')?.touched) errs.push(i + 1);
    });
    return errs;
  }

  get lines(): FormArray<FormGroup> {
    return this.form.get('lines') as FormArray<FormGroup>;
  }

  addLine(): void {
    const line = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      qte: [1, [Validators.required, Validators.min(1)]],
      prixHT: ['', [Validators.required]],
      productType: ['service'],
      unity: ['article'],
      description: [''],
    });

    this.lines.push(line);
  }

  removeLine(index: number): void {
    if (this.lines.length > 1) {
      this.lines.removeAt(index);
    }
  }

  calculateTotals(): void {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.calculateTotalsFromLines().subscribe({
      next: (totals) => this.totals.set(totals),
      error: (err) => {
        const message = err?.error?.message || 'Impossible de calculer la facture.';
        this.errorMessage.set(message);
      },
    });
  }

  submit(): void {
    this.errorMessage.set(null);
    this.submitted.set(true);

    this.form.markAllAsTouched();
    this.lines.controls.forEach((c) => c.markAllAsTouched());

    const invoiceType = (this.form.value.invoiceType || 'selling') as InvoiceType;
    if (invoiceType === 'selling' && !this.form.value.clientId) {
      this.errorMessage.set('Sélectionnez un client pour la facture de vente.');
      return;
    }
    if (invoiceType === 'buying' && !this.form.value.supplierId) {
      this.errorMessage.set('Sélectionnez un fournisseur pour la facture d\'achat.');
      return;
    }
    if (this.form.invalid) {
      this.errorMessage.set('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    this.saving.set(true);

    this.createLibelles()
      .pipe(
        switchMap((libelleIds) => {
          const payload = this.buildInvoicePayload(libelleIds);
          return this.invoiceService.createInvoice(payload);
        })
      )
      .subscribe({
        next: (invoice) => {
          this.saving.set(false);
          this.router.navigate(['/invoices', invoice._id]);
        },
        error: (err) => {
          this.saving.set(false);
          const message = err?.error?.message || 'Impossible de creer la facture.';
          this.errorMessage.set(message);
        },
      });
  }

  private loadReferenceData(): void {
    this.loading.set(true);

    const currentCompanyId = this.companySwitcher.currentCompanyId();
    if (!currentCompanyId) {
      this.loading.set(false);
      this.errorMessage.set('Selectionnez une societe pour creer une facture.');
      return;
    }

    this.form.patchValue({ companyId: currentCompanyId }, { emitEvent: false });

    const clients$ = this.clientService.getClients({ companyId: currentCompanyId, page: 1, limit: 100 });
    const suppliers$ = this.supplierService.getSuppliers({ companyId: currentCompanyId, page: 1, limit: 100 });
    const taxes$ = this.taxSettingsService.getActiveTaxSettings(currentCompanyId);

    forkJoin([clients$, suppliers$, taxes$]).subscribe({
      next: ([clients, suppliers, taxes]) => {
        this.clients.set(clients.clients ?? []);
        this.suppliers.set(suppliers.suppliers ?? []);
        this.taxes.set(taxes);
        if (currentCompanyId) {
          this.form.patchValue({ companyId: currentCompanyId }, { emitEvent: false });
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const message = err?.error?.message || 'Impossible de charger les donnees.';
        this.errorMessage.set(message);
      },
    });
  }

  private createLibelles() {
    const linePayloads = this.lines.controls.map((line) => {
      const value = line.value;
      return this.libelleService.createLibelle({
        name: value.name,
        description: value.description || undefined,
        qte: Number(value.qte),
        productType: value.productType,
        unity: value.unity,
        prixHT: String(value.prixHT),
        companyId: this.form.value.companyId || '',
        TexSettingsId: this.form.value.taxSettingsId || '',
      });
    });

    return forkJoin(linePayloads).pipe(map((libelles) => libelles.map((libelle) => libelle._id)));
  }

  private calculateTotalsFromLines() {
    const linePayloads = this.lines.controls.map((line) => {
      const value = line.value;
      return this.libelleService.calculateLibelle({
        name: value.name,
        description: value.description || undefined,
        qte: Number(value.qte),
        productType: value.productType,
        unity: value.unity,
        prixHT: String(value.prixHT),
        companyId: this.form.value.companyId || '',
        TexSettingsId: this.form.value.taxSettingsId || '',
      });
    });

    return forkJoin(linePayloads).pipe(
      map((lineTotals) => {
        const totalHT = lineTotals.reduce((sum, line) => sum + parseFloat(line.finalprixHT), 0);
        const totalTTC = lineTotals.reduce((sum, line) => sum + parseFloat(line.finalprixTTC), 0);
        const totalTax = lineTotals.reduce((sum, line) => {
          const taxAmount = line.tax?.taxAmount
            ? parseFloat(line.tax.taxAmount)
            : parseFloat(line.finalprixTTC) - parseFloat(line.finalprixHT);
          return sum + taxAmount;
        }, 0);

        const totalDiscount = lineTotals.reduce((sum, line, index) => {
          const lineControl = this.lines.at(index);
          const prixHT = Number(lineControl?.value?.prixHT || 0);
          const qte = Number(lineControl?.value?.qte || 0);
          const totalBeforeDiscount = prixHT * qte;
          const discountAmount = totalBeforeDiscount - parseFloat(line.finalprixHT);
          return sum + Math.max(0, discountAmount);
        }, 0);

        const retenue = 0;
        const totalTTC_apres_retenue = totalTTC - retenue;
        const timbre = Number(this.form.value.timbre ?? 1);
        const totalTTC_final = totalTTC_apres_retenue + timbre;

        return {
          totalHT: totalHT.toFixed(2),
          totalTTC: totalTTC.toFixed(2),
          totalTax: totalTax.toFixed(2),
          totalDiscount: totalDiscount.toFixed(2),
          retenue: retenue.toFixed(2),
          totalTTC_apres_retenue: totalTTC_apres_retenue.toFixed(2),
          timbre: timbre.toFixed(2),
          totalTTC_final: totalTTC_final.toFixed(2),
        } as InvoiceTotals;
      })
    );
  }

  private buildInvoicePayload(libelleIds: string[]): CreateInvoicePayload {
    const value = this.form.value;
    const invoiceType = (value.invoiceType || 'selling') as InvoiceType;

    return {
      username: value.username || '',
      dateInvoice: value.dateInvoice || '',
      applicationName: value.applicationName || undefined,
      clientType: value.clientType as ClientType,
      invoiceType,
      invoiceStatus: 'draft',
      AdditionalTaxSettings: [],
      Libelle: libelleIds,
      timbre: value.timbre ?? 1,
      fileUrl: value.fileUrl || undefined,
      notes: value.notes || undefined,
      clientId: invoiceType === 'selling' ? value.clientId || undefined : undefined,
      supplierId: invoiceType === 'buying' ? value.supplierId || undefined : undefined,
      companyId: value.companyId || undefined,
    };
  }

  private today(): string {
    const date = new Date();
    return date.toISOString().split('T')[0];
  }
}
