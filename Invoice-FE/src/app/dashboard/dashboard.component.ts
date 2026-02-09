import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="dashboard">
      <header class="page-header">
        <div>
          <h1>Tableau de bord</h1>
          <p class="subtitle">Bienvenue dans votre espace de gestion</p>
        </div>
      </header>

      <div class="summary-grid">
        <article class="summary-card">
          <p>Factures</p>
          <h3>-</h3>
          <span>Gestion des factures clients et fournisseurs</span>
        </article>
        <article class="summary-card">
          <p>Clients</p>
          <h3>-</h3>
          <span>Base de donnees clients</span>
        </article>
        <article class="summary-card">
          <p>Employes</p>
          <h3>-</h3>
          <span>Gestion des ressources humaines</span>
        </article>
        <article class="summary-card">
          <p>TVA</p>
          <h3>-</h3>
          <span>Declarations et paiements</span>
        </article>
      </div>

      <div class="info-section">
        <h2>Acces rapide</h2>
        <div class="quick-links">
          <a routerLink="/invoices/new" class="quick-link">
            <h3>Nouvelle facture</h3>
            <p>Creer une facture de vente</p>
          </a>
          <a routerLink="/clients/new" class="quick-link">
            <h3>Nouveau client</h3>
            <p>Ajouter un client</p>
          </a>
          <a routerLink="/employees" class="quick-link">
            <h3>Employes</h3>
            <p>Consulter la liste</p>
          </a>
        </div>
      </div>
    </section>
  `,
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {}
