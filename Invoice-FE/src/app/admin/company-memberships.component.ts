import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService, CompanyMembership, CreateCompanyUserPayload } from './admin.service';
import { ClientService } from '../clients/client.service';
import { Client } from '../clients/client.model';
import { CompanySwitcherService } from '../core/company-switcher.service';

@Component({
  selector: 'app-company-memberships',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Gestion des membres de la societe</h1>
        <button class="btn btn-primary" (click)="showAddForm.set(!showAddForm())">
          {{ showAddForm() ? 'Annuler' : '+ Ajouter membre' }}
        </button>
      </div>

      <div class="add-form-card" *ngIf="showAddForm()">
        <h2>Ajouter un nouveau membre</h2>
        <form [formGroup]="addMemberForm" (ngSubmit)="addMember()">
          <div class="form-grid">
            <div class="form-group">
              <label for="companyId">Societe *</label>
              <select id="companyId" formControlName="companyId" required>
                <option value="">Selectionnez une societe</option>
                <option *ngFor="let company of companies()" [value]="company._id">
                  {{ company.companyname }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="role">Role *</label>
              <select id="role" formControlName="role" required>
                <option value="">Selectionnez un role</option>
                <option value="MANAGER">Manager</option>
                <option value="ACCOUNTANT">Comptable</option>
              </select>
            </div>

            <div class="form-group">
              <label for="email">Email *</label>
              <input type="email" id="email" formControlName="email" placeholder="utilisateur@example.com" required>
            </div>

            <div class="form-group">
              <label for="firstName">Prenom</label>
              <input type="text" id="firstName" formControlName="firstName" placeholder="Prenom (pour nouveaux utilisateurs)">
            </div>

            <div class="form-group">
              <label for="lastName">Nom</label>
              <input type="text" id="lastName" formControlName="lastName" placeholder="Nom (pour nouveaux utilisateurs)">
            </div>

            <div class="form-group">
              <label for="phone">Telephone</label>
              <input type="tel" id="phone" formControlName="phone" placeholder="+212...">
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="addMemberForm.invalid || saving()">
              {{ saving() ? 'Enregistrement...' : 'Ajouter' }}
            </button>
            <button type="button" class="btn btn-secondary" (click)="showAddForm.set(false)">Annuler</button>
          </div>

          <div class="alert alert-success" *ngIf="successMessage()">{{ successMessage() }}</div>
          <div class="alert alert-error" *ngIf="errorMessage()">{{ errorMessage() }}</div>
        </form>
      </div>

      <div class="filters-card">
        <form [formGroup]="filterForm" class="filters-form">
          <div class="form-group">
            <label for="filterCompany">Filtrer par societe</label>
            <select id="filterCompany" formControlName="companyId">
              <option value="">Toutes les societes</option>
              <option *ngFor="let company of companies()" [value]="company._id">
                {{ company.companyname }}
              </option>
            </select>
          </div>
        </form>
      </div>

      <div class="memberships-card">
        <div class="loading" *ngIf="loading()">Chargement...</div>
        <div class="alert alert-error" *ngIf="!loading() && errorMessage()">{{ errorMessage() }}</div>
        
        <table class="data-table" *ngIf="!loading() && memberships().length > 0">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Email</th>
              <th>Societe</th>
              <th>Role</th>
              <th>Date d'ajout</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let membership of memberships()">
              <td>{{ membership.userId.firstName }} {{ membership.userId.lastName }}</td>
              <td>{{ membership.userId.email }}</td>
              <td>{{ membership.companyId.companyname }}</td>
              <td><span class="badge" [class.badge-manager]="membership.role === 'MANAGER'" [class.badge-accountant]="membership.role === 'ACCOUNTANT'">{{ membership.role }}</span></td>
              <td>{{ membership.createdAt | date:'short' }}</td>
              <td>
                <button class="btn btn-danger btn-sm" (click)="deleteMembership(membership._id)">Supprimer</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="empty-state" *ngIf="!loading() && memberships().length === 0">
          Aucun membre trouve
        </div>
      </div>
    </div>
  `,
  styleUrl: './admin-dashboard.component.scss'
})
export class CompanyMembershipsComponent implements OnInit {
  private adminService = inject(AdminService);
  private clientService = inject(ClientService);
  private fb = inject(FormBuilder);
  private companySwitcher = inject(CompanySwitcherService);

  protected memberships = signal<CompanyMembership[]>([]);
  protected companies = signal<Client[]>([]);
  protected loading = signal(false);
  protected saving = signal(false);
  protected showAddForm = signal(false);
  protected successMessage = signal<string | null>(null);
  protected errorMessage = signal<string | null>(null);

  protected addMemberForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    firstName: [''],
    lastName: [''],
    phone: [''],
    companyId: ['', Validators.required],
    role: ['', Validators.required],
  });

  protected filterForm = this.fb.group({
    companyId: [''],
  });

  constructor() {
    effect(() => {
      const companyId = this.companySwitcher.currentCompanyId();
      if (companyId) {
        this.loadMemberships();
      }
    });
  }

  ngOnInit(): void {
    this.loadCompanies();
    this.loadMemberships();

    this.filterForm.valueChanges.subscribe(() => {
      this.loadMemberships();
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

  loadMemberships(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    const companyId = this.companySwitcher.currentCompanyId() || this.filterForm.value.companyId || undefined;

    this.adminService.getCompanyMemberships(companyId).subscribe({
      next: (response) => {
        const memberships = response?.memberships ?? [];
        this.memberships.set(memberships);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load memberships:', err);
        this.errorMessage.set('Impossible de charger les membres.');
        this.memberships.set([]);
        this.loading.set(false);
      },
    });
  }

  addMember(): void {
    if (this.addMemberForm.invalid) return;

    this.saving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const payload: CreateCompanyUserPayload = this.addMemberForm.value as CreateCompanyUserPayload;

    this.adminService.addCompanyUser(payload).subscribe({
      next: () => {
        this.successMessage.set('Membre ajoute avec succes!');
        this.saving.set(false);
        this.addMemberForm.reset();
        this.loadMemberships();
        setTimeout(() => {
          this.showAddForm.set(false);
          this.successMessage.set(null);
        }, 2000);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Erreur lors de l\'ajout du membre');
        this.saving.set(false);
      },
    });
  }

  deleteMembership(membershipId: string): void {
    if (!confirm('Etes-vous sur de vouloir supprimer ce membre?')) return;

    this.adminService.deleteCompanyMembership(membershipId).subscribe({
      next: () => {
        this.loadMemberships();
      },
      error: (err) => {
        alert('Erreur lors de la suppression: ' + (err.error?.message || 'Erreur inconnue'));
      },
    });
  }
}
