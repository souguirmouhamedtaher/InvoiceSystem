import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
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
import { LibelleService } from '../libelles/libelle.service';
import { TaxSettingsService } from '../tax-settings/tax-settings.service';
import { TaxSetting } from '../tax-settings/tax-settings.model';
import { InvoiceService } from './invoice.service';
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
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly totals = signal<InvoiceTotals | null>(null);

  protected readonly clients = signal<Client[]>([]);
  protected readonly suppliers = signal<Client[]>([]);
  protected readonly myCompanies = signal<Client[]>([]);
  protected readonly taxes = signal<TaxSetting[]>([]);

  private fb = inject(FormBuilder);

  protected readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(2)]],
    dateInvoice: [this.today(), [Validators.required]],
    applicationName: [''],
    clientType: ['national'],
    invoiceType: ['selling'],
    clientId: [''],
    supplierId: [''],
    mycompanyId: ['', [Validators.required]],
    taxSettingsId: ['', [Validators.required]],
    timbre: [1],
    notes: [''],
    lines: this.fb.array<FormGroup>([]),
  });

  constructor(
    private clientService: ClientService,
    private libelleService: LibelleService,
    private taxSettingsService: TaxSettingsService,
    private invoiceService: InvoiceService,
    private router: Router
  ) {
    this.addLine();
    this.loadReferenceData();
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

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const invoiceType = (this.form.value.invoiceType || 'selling') as InvoiceType;
    if (invoiceType === 'selling' && !this.form.value.clientId) {
      this.errorMessage.set('Selectionnez un client pour la facture de vente.');
      return;
    }
    if (invoiceType === 'buying' && !this.form.value.supplierId) {
      this.errorMessage.set('Selectionnez un fournisseur pour la facture d\'achat.');
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

    const clients$ = this.clientService.getClients({ page: 1, limit: 100, companyType: 'client' });
    const suppliers$ = this.clientService.getClients({ page: 1, limit: 100, companyType: 'supplier' });
    const companies$ = this.clientService.getClients({ page: 1, limit: 100, companyType: 'mycompany' });
    const taxes$ = this.taxSettingsService.getActiveTaxSettings();

    forkJoin([clients$, suppliers$, companies$, taxes$]).subscribe({
      next: ([clients, suppliers, companies, taxes]) => {
        this.clients.set(clients.companies);
        this.suppliers.set(suppliers.companies);
        this.myCompanies.set(companies.companies);
        this.taxes.set(taxes);
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
      notes: value.notes || undefined,
      clientId: invoiceType === 'selling' ? value.clientId || undefined : undefined,
      supplierId: invoiceType === 'buying' ? value.supplierId || undefined : undefined,
      mycompanyId: value.mycompanyId || undefined,
    };
  }

  private today(): string {
    const date = new Date();
    return date.toISOString().split('T')[0];
  }
}
