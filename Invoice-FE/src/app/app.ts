import { isPlatformBrowser, NgIf } from '@angular/common';
import { Component, DestroyRef, inject, PLATFORM_ID, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from './auth/auth.service';
import { CompanySwitcherComponent } from './core/company-switcher.component';
import { CompanySwitcherService } from './core/company-switcher.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf, CompanySwitcherComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly companySwitcher = inject(CompanySwitcherService);
  protected readonly isAuthRoute = signal(false);

  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);

  /** True when selected company context is owner (can manage team members). */
  protected isOwnerContext(): boolean {
    return this.companySwitcher.currentMembership()?.role === 'OWNER';
  }

  /** True when current user is super admin (can create companies). */
  protected isSuperAdmin(): boolean {
    return this.auth.isSuperAdmin();
  }

  constructor() {
    this.isAuthRoute.set(this.isAuthPath(this.router.url));

    if (isPlatformBrowser(this.platformId)) {
      this.decorateLabels();
    }

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        const url = (event as NavigationEnd).urlAfterRedirects;
        this.isAuthRoute.set(this.isAuthPath(url));
        if (isPlatformBrowser(this.platformId)) {
          this.decorateLabels();
        }
      });
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => this.navigateToLogin(),
      error: () => this.navigateToLogin(),
    });
  }

  private navigateToLogin(): void {
    this.companySwitcher.clearAll();
    this.router.navigate(['/login']);
  }

  private isAuthPath(url: string): boolean {
    return (
      url.startsWith('/login') ||
      url.startsWith('/signup') ||
      url.startsWith('/forgot-password') ||
      url.startsWith('/reset-password')
    );
  }

  private decorateLabels(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const labelHelp: Record<string, string> = {
      'iban': "Identifiant international de compte bancaire.",
      'rib': "Releve d'identite bancaire (numero de compte local).",
      'bic / swift': "Code SWIFT/BIC de la banque.",
      'bic/swift': "Code SWIFT/BIC de la banque.",
      'patente (identifiant fiscal)': "Identifiant fiscal de l'entreprise.",
      'identifiant fiscal (optionnel)': "Numero fiscal si disponible.",
      'taxe (tva)': "Selectionnez le taux de TVA applique.",
      'tva': "Taxe sur la valeur ajoutee.",
      'email': "Adresse email de contact.",
      'telephone(s)': "Numero(s) de telephone de contact.",
      'numero de telephone': "Numero de telephone de contact.",
      'adresse': "Adresse postale complete.",
      'pays': "Pays de l'entreprise.",
      'region': "Region ou gouvernorat.",
      'date': "Date de l'operation.",
      'date de paiement': "Date effective du paiement.",
      'montant': "Montant en dinars tunisiens.",
      'mois': "Mois au format YYYY-MM ou numero de mois.",
      'annee': "Annee sur 4 chiffres.",
      'client': "Selectionnez le client pour cette facture.",
      'fournisseur': "Selectionnez le fournisseur pour cette facture.",
      'contact': "Nom de la personne a contacter.",
      'type de facture': "Vente ou achat.",
      'type client': "Type de client (particulier ou entreprise).",
      'scan facture (url)': "Lien vers le scan de la facture.",
      'preuve (url)': "Lien vers la preuve de paiement.",
      'notes': "Informations complementaires.",
      'nom': "Nom affiche dans l'application.",
      'valeur (%)': "Pourcentage applique.",
      'actif': "Active ou desactive cette taxe.",
      'mot de passe actuel': "Votre mot de passe actuel.",
      'nouveau mot de passe': "Choisissez un nouveau mot de passe.",
      'confirmer le mot de passe': "Re-saisissez le nouveau mot de passe.",
      'raison sociale': "Nom legal de l'entreprise.",
      'nom de la banque': "Nom de la banque.",
      'numero de compte (xml)': "Numero de compte pour le XML Elfatoora.",
      'identifiant du titulaire (xml)': "Identifiant du titulaire pour le XML Elfatoora.",
      'code etablissement (xml)': "Code de l'etablissement bancaire (Elfatoora).",
      "nom de l'etablissement (xml)": "Nom de l'etablissement bancaire (Elfatoora).",
      "code de l'agence (xml)": "Code de l'agence bancaire (Elfatoora).",
      "code d'agence (xml)": "Code de l'agence bancaire (Elfatoora).",
      'branch code (xml)': "Code de l'agence bancaire (Elfatoora).",
      "pays de la banque (xml)": "Code pays de la banque (ISO 3166-1)."
    };

    const labels = document.querySelectorAll('label');
    labels.forEach((label) => {
      if (!label.classList.contains('field')) {
        label.classList.add('label-help-target');
      }
      const span = label.querySelector('span');
      const raw = span?.textContent ?? label.textContent ?? '';
      const text = raw.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
      if (!text) return;

      const key = text.toLowerCase();
      const existingHelp = label.getAttribute('data-help');
      const help = existingHelp || labelHelp[key] || `Saisissez ${text.toLowerCase()}.`;

      if (!existingHelp) {
        label.setAttribute('data-help', help);
      }

      const iconHost = span ?? label;
      if (!iconHost.querySelector('.label-help')) {
        const icon = document.createElement('span');
        icon.className = 'label-help';
        icon.textContent = 'i';
        icon.setAttribute('aria-hidden', 'true');
        iconHost.appendChild(icon);
      }
    });
  }
}
