import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AdminService, AuditLog } from './admin.service';
import { ClientService } from '../clients/client.service';
import { Client } from '../clients/client.model';
import { CompanySwitcherService } from '../core/company-switcher.service';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Journal d'audit</h1>
      </div>

      <div class="filters-card">
        <form [formGroup]="filterForm" class="filters-form">
          <div class="form-group">
            <label for="filterCompany">Societe</label>
            <select id="filterCompany" formControlName="companyId">
              <option value="">Toutes les societes</option>
              <option *ngFor="let company of companies()" [value]="company._id">
                {{ company.companyname }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="filterAction">Action</label>
            <select id="filterAction" formControlName="action">
              <option value="">Toutes les actions</option>
              <option value="COMPANY_USER_ASSIGNED">Attribution utilisateur</option>
              <option value="COMPANY_USER_REMOVED">Retrait utilisateur</option>
              <option value="EMPLOYEE_CSV_IMPORT">Import CSV employes</option>
              <option value="EMPLOYEE_CSV_EXPORT">Export CSV employes</option>
            </select>
          </div>
        </form>
      </div>

      <div class="logs-card">
        <div class="loading" *ngIf="loading()">Chargement...</div>
        
        <table class="data-table" *ngIf="!loading() && logs().length > 0">
          <thead>
            <tr>
              <th>Date</th>
              <th>Action</th>
              <th>Type d'entite</th>
              <th>Utilisateur</th>
              <th>Societe</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let log of logs()">
              <td>{{ log.createdAt | date:'short' }}</td>
              <td><span class="badge badge-action">{{ log.action }}</span></td>
              <td>{{ log.entityType }}</td>
              <td>{{ log.userId }}</td>
              <td>{{ log.companyId }}</td>
              <td>
                <button class="btn btn-sm btn-secondary" (click)="toggleDetails(log._id)">
                  {{ expandedLogId() === log._id ? 'Masquer' : 'Afficher' }}
                </button>
                <div class="details" *ngIf="expandedLogId() === log._id">
                  <pre>{{ log.metadata | json }}</pre>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="empty-state" *ngIf="!loading() && logs().length === 0">
          Aucun journal d'audit trouve
        </div>

        <div class="pagination" *ngIf="logs().length > 0">
          <button class="btn btn-sm" (click)="previousPage()" [disabled]="page() === 1">Precedent</button>
          <span>Page {{ page() }}</span>
          <button class="btn btn-sm" (click)="nextPage()" [disabled]="logs().length < 50">Suivant</button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './admin-dashboard.component.scss'
})
export class AuditLogsComponent implements OnInit {
  private adminService = inject(AdminService);
  private clientService = inject(ClientService);
  private fb = inject(FormBuilder);
  private companySwitcher = inject(CompanySwitcherService);

  protected logs = signal<AuditLog[]>([]);
  protected companies = signal<Client[]>([]);
  protected loading = signal(false);
  protected page = signal(1);
  protected expandedLogId = signal<string | null>(null);

  protected filterForm = this.fb.group({
    companyId: [''],
    action: ['']
  });

  constructor() {
    effect(() => {
      const companyId = this.companySwitcher.currentCompanyId();
      if (companyId) {
        this.page.set(1);
        this.loadLogs();
      }
    });
  }

  ngOnInit(): void {
    this.loadCompanies();
    this.loadLogs();

    this.filterForm.valueChanges.subscribe(() => {
      this.page.set(1);
      this.loadLogs();
    });
  }

  loadCompanies(): void {
    this.clientService.getClients({ page: 1, limit: 1000, companyType: 'mycompany' }).subscribe({
      next: (response) => {
        this.companies.set(response.companies.filter((c: Client) => c.companyType === 'mycompany'));
      },
      error: (err) => console.error('Failed to load companies:', err),
    });
  }

  loadLogs(): void {
    this.loading.set(true);
    const filters = {
      companyId: this.companySwitcher.currentCompanyId() || this.filterForm.value.companyId || undefined,
      action: this.filterForm.value.action || undefined,
      page: this.page(),
      limit: 50,
    };

    this.adminService.getAuditLogs(filters).subscribe({
      next: (response) => {
        this.logs.set(response.logs);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load audit logs:', err);
        this.loading.set(false);
      },
    });
  }

  toggleDetails(logId: string): void {
    this.expandedLogId.set(this.expandedLogId() === logId ? null : logId);
  }

  previousPage(): void {
    if (this.page() > 1) {
      this.page.update(p => p - 1);
      this.loadLogs();
    }
  }

  nextPage(): void {
    this.page.update(p => p + 1);
    this.loadLogs();
  }
}
