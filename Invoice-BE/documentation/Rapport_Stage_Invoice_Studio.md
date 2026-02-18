# Rapport de stage — Système de gestion des factures et de la paie

---

## Introduction générale

La digitalisation de la comptabilité et de la facturation représente un enjeu majeur pour les entreprises : un seul outil bien conçu peut remplacer tableurs, logiciels disparates et risques d’erreur humaine, tant pour la conformité réglementaire (facturation électronique, déclarations TVA, CNSS) que pour la productivité au quotidien. Ce rapport présente le travail réalisé dans le cadre d’un stage au sein de **Celestial Wave Digital** sur le projet **Invoice Studio** : une application de gestion des factures, de la paie, des déclarations TVA et CNSS, conçue en architecture propre (Clean Architecture) avec un backend NestJS et un frontend Angular.

L’objectif du stage était de participer à la conception et à la réalisation d’une solution complète — de l’idée jusqu’au déploiement en production, depuis l’analyse de l’existant et le cahier des charges jusqu’à la modélisation (cas d’utilisation, classes, base de données) et la réalisation technique. Le système intègre notamment les spécifications techniques **Elfatoora / Tunisie TradeNet** (format TEIF 1.8.8) pour la facturation électronique, tout en offrant une interface moderne pour les comptables, gestionnaires et administrateurs.

---

## Chapitre 1 : Cadre du stage

### I. Présentation de la société

**Celestial Wave Digital** est une agence digitale qui conçoit et déploie des applications métier (web et mobile). Le projet **Invoice Studio** vise à proposer une solution de gestion de la facturation et de la paie adaptée aux besoins des PME, avec une attention particulière portée à la conformité réglementaire (Tunisie / Maroc) et à l’expérience utilisateur. Le backend est hébergé en production (ex. `invoice.celestialwavedigital.com`) avec déploiement automatisé via GitHub Actions, Docker et nerdctl.

### II. Étude de l’existant

#### II.1 Description de l’existant

Avant le projet, la gestion des factures, des employés, des salaires et des déclarations (TVA, CNSS) pouvait reposer sur des outils dispersés : tableurs, logiciels locaux, ou solutions peu adaptées au contexte réglementaire local. Les besoins identifiés couvrent notamment :

- **Facturation** : émission de factures (vente/achat), suivi des statuts (brouillon, en attente, payée, en retard), génération de PDF, et alignement avec les normes de facturation électronique (TEIF 1.8.8, Tunisie TradeNet).
- **Tiers** : gestion des sociétés « mes sociétés », clients et fournisseurs, avec informations bancaires et de contact.
- **Paie et social** : gestion des employés, salaires, applicabilité CNSS, paiements CNSS et déclarations TVA (mensuelles, cumulatives, paiements).
- **Administration** : rôles (Super Admin, Manager, Comptable, User), affectation des utilisateurs aux sociétés, journaux d’audit et paramètres fiscaux (taux de TVA, libellés).

La documentation technique disponible dans `Invoice-BE/documentation` comprend les **spécifications techniques Elfatoora** : schémas XSD des factures (avec et sans signature) et un exemple de facture signée au format XML, structuré en `InvoiceHeader`, `InvoiceBody`, partenaires, lignes de facture, montants et taxes.

#### II.2 Critique de l’existant

Les points faibles d’un « existant » type (sans outil unifié) peuvent être résumés ainsi :

- **Manque de traçabilité** : pas de journal d’audit centralisé, risque d’erreurs et de perte d’information.
- **Conformité** : difficulté à produire des factures électroniques conformes aux schémas officiels (TEIF).
- **Duplication des données** : saisie répétée entre facturation, paie et déclarations.
- **Contrôle d’accès** : peu de granularité (qui fait quoi, sur quelle société).

Ces constats ont motivé la conception d’une application unique, sécurisée et alignée sur les normes en vigueur.

#### II.3 Solution proposée

La solution **Invoice Studio** se présente comme une application web full-stack :

- **Backend (Invoice-BE)** : API REST NestJS en **Clean Architecture** (couches Domain, Application, Infrastructure, Presentation), base **MongoDB**, stockage de fichiers (MinIO en dev, DigitalOcean Spaces en prod), authentification JWT (access, refresh, reset password), et génération de factures (PDF, alignement possible avec le format TEIF).
- **Frontend (Invoice-FE)** : application **Angular 21** avec routes pour tableau de bord, clients, fournisseurs, « mes sociétés », factures (vente/achat, scan), employés, salaires, CNSS, TVA (mensuelle, cumulative, paiements), paramètres fiscaux et modules d’administration (membres, journaux d’audit).

La solution propose un modèle multi-sociétés avec rôles (Super Admin, Manager, Comptable, User) et une séparation claire des responsabilités, tout en préparant l’intégration avec les formats de facturation électronique (documentation et schémas déjà présents dans le projet).

### III. Cahier des charges

Le cahier des charges fonctionnel et technique peut être résumé ainsi :

| Domaine | Exigences principales |
|--------|------------------------|
| **Facturation** | Création, édition, suivi des factures (vente/achat) ; statuts ; PDF ; référence aux clients/fournisseurs/sociétés ; paiements partiels (montant, date, type, preuve). |
| **Tiers** | Gestion des sociétés (mes sociétés, clients, fournisseurs) : nom, type, adresse, contacts, banque (RIB, IBAN, BIC), patente, TVA, etc. |
| **Paie** | Employés (rattachés à une société), salaire net, applicabilité CNSS, taux CNSS ; enregistrement des salaires par mois ; paiements CNSS. |
| **TVA** | Paramètres de TVA (taux, libellés) ; déclarations mensuelles/cumulatives ; enregistrement des paiements TVA. |
| **Sécurité** | Authentification (login, signup, mot de passe oublié, reset) ; JWT ; garde par rôle ; accès limité par société pour Manager/Comptable. |
| **Administration** | Super Admin : gestion des affectations société–utilisateur ; consultation des journaux d’audit. |
| **Technique** | API documentée (Swagger) ; déploiement Docker ; health check ; stockage des fichiers (S3-compatible). |

Les spécifications techniques Elfatoora (dans `Invoice-BE/documentation/Specifications_techniques_Elfatoora`) servent de référence pour l’évolution future de la facturation électronique (génération/validation de flux TEIF).

#### Vérification des fonctionnalités (cahier des charges vs. réalisation)

Le tableau ci-dessous confronte les exigences du cahier des charges aux implémentations présentes dans le code (backend Invoice-BE). Chaque ligne indique si la fonctionnalité est **couverte** et où la trouver.

| Domaine | Exigence | Statut | Implémentation (backend) |
|--------|----------|--------|---------------------------|
| **Facturation** | Création / édition / suivi factures | ✅ | `invoice.controller` : `POST /`, `PATCH :id`, `GET /`, `GET :id`, `DELETE :id` ; filtres (statut, société, plage de dates). |
| | Statuts (brouillon, envoyée, payée, en retard, annulée) | ✅ | Enum `invoiceStatus` : draft, sent, paid, overdue, cancelled (`domain/enums/invoice.enums.ts`). |
| | Génération PDF | ✅ | `GET invoice/:id/pdf` (invoice.controller). |
| | Référence clients / fournisseurs / société | ✅ | Entité `Invoice` : `clientId`, `supplierId`, `mycompanyId` (références Company). |
| | Paiements partiels (montant, date, type, preuve) | ✅ | `POST invoice/:id/payments` ; DTO `AddInvoicePaymentDto` (amount, date, paymentType, proofUrl, notes) ; types : cash, creditCard, bankTransfer, paypal, check, cheque. |
| | Factures d’achat | ✅ | `purchaseInvoice.controller` : CRUD ; entité `PurchaseInvoice`. |
| | Export XML (TEIF) | ✅ | `GET invoice/:id/xml` ; use case `xmlGenerator.useCase.ts` (alignement format Elfatoora). |
| | Calcul des montants | ✅ | `POST invoice/calculate` ; `POST libelle/calculate`. |
| **Tiers** | Gestion sociétés (CRUD, type, adresse, banque, patente, TVA…) | ✅ | `company.controller` : `POST /`, `GET /`, `GET :id`, `PATCH :id`, `DELETE :id` ; entité `Company` (companyType, bankName, IBAN, RIB, BIC, Patente, vatIncluded, etc.). |
| **Paie** | Employés (rattachés à une société, salaire, CNSS) | ✅ | `employee.controller` : CRUD ; `Employee` (companyId, monthlyNetSalary, cnssApplicable, cnssRatePercent). |
| | Salaires par mois | ✅ | `salary.controller` : CRUD ; génération mensuelle : `POST employee/generate-monthly`. |
| | Paiements CNSS | ✅ | `cnssPayment.controller` : CRUD. |
| | Import / export CSV (employés, paie) | ✅ | `POST employee/import-csv`, `GET employee/export-csv` ; résumé paie : `GET employee/payroll/summary`. |
| **TVA** | Paramètres TVA (taux, libellés) | ✅ | `taxSettings.controller` : CRUD, `GET active` ; `libelle.controller` : CRUD (libellés de lignes). |
| | Déclarations mensuelles / cumulatives | ✅ | `analysis.controller` : `GET vat-cumulative` ; frontend : routes `tva-monthly`, `tva-cumulative`. |
| | Paiements TVA | ✅ | `tvaPayment.controller` : CRUD. |
| **Sécurité** | Login / signup / logout | ✅ | `auth.controller` : `POST login`, `POST SignUp`, `POST logout`. |
| | Mot de passe oublié / reset | ✅ | `POST forgotPassword`, `POST resetPassword` (query token + body) ; variantes mobile (OTP). |
| | JWT (access, refresh) | ✅ | `POST refresh` (RefreshTokenGuard) ; `GET loadme` (AccessTokenGuard). |
| | Garde par rôle | ✅ | `RolesGuard` + décorateur `@Roles(Role.SUPERADMIN)` sur `sadmin.controller` ; rôles utilisateur : SUPERADMIN, USER, etc. |
| | Accès limité par société (Manager/Comptable) | ✅ | Use cases (invoice, employee, company, etc.) : `assertCompanyMembership(userId, companyId, [CompanyRole.MANAGER | ACCOUNTANT])` ; CompanyRole dans companyMembership. |
| **Administration** | Affectations société–utilisateur | ✅ | `sadmin.controller` : `POST company-users`, `GET company-memberships`, `DELETE company-memberships/:id`. |
| | Journaux d’audit | ✅ | `GET sadmin/audit-logs` (filtres possibles). |
| | Gestion utilisateurs (Super Admin) | ✅ | `sadmin.controller` : CRUD utilisateurs (`GET /`, `GET :id`, `Post()`, `Patch :id`, `Delete :id`). |
| **Technique** | API documentée (Swagger) | ✅ | Swagger configuré dans `main.ts` ; exposé à `/api/docs` ; DTOs documentés avec `@ApiProperty`. |
| | Déploiement Docker | ✅ | `docker-compose-dev.yaml`, Dockerfile, DEPLOYMENT.md (nerdctl, GitHub Actions). |
| | Health check | ✅ | Vérification via disponibilité de `/api/docs` (cf. DEPLOYMENT.md). |
| | Stockage fichiers (S3-compatible) | ✅ | `files.controller` : upload, `GET :type/:userid`, `DELETE` ; AWS SDK / DigitalOcean Spaces (env). |

**Synthèse :** Les fonctionnalités listées dans le cahier des charges sont **implémentées** dans le backend. Les contrôleurs, use cases et entités correspondent aux exigences (facturation, tiers, paie, TVA, sécurité, administration, technique). Des analyses métier supplémentaires (trésorerie, tableau de bord) sont exposées via `analysis.controller` (treasury, vat-cumulative, cash-dashboard).

---

## Chapitre 2 : Modélisation comportementale de l’application

### I. Identification des acteurs

Les acteurs du système sont les suivants :

| Acteur | Description |
|--------|-------------|
| **Utilisateur non authentifié** | Visiteur pouvant accéder à la page de connexion, d’inscription et de réinitialisation du mot de passe. |
| **Utilisateur authentifié (User)** | Propriétaire ou utilisateur de base ; accès aux sociétés auxquelles il est rattaché (mes sociétés, clients, fournisseurs, factures, etc.). |
| **Comptable (Accountant)** | Utilisateur avec droits de consultation/édition sur la partie facturation, TVA, et données financières de la ou les sociétés qui lui sont assignées. |
| **Manager** | Gestion des employés, salaires, CNSS et opérations de paie pour la ou les sociétés assignées ; peut importer/exporter des données (ex. CSV). |
| **Super Admin** | Administration globale : gestion des affectations (company memberships), consultation des journaux d’audit, accès à l’ensemble des données. |
| **Système** | Envoi d’e-mails (réinitialisation mot de passe, notifications), génération de PDF, stockage des fichiers, planification éventuelle de tâches (ex. rappels). |

### II. Présentation du diagramme de cas d’utilisation

Le diagramme de cas d’utilisation (à formaliser dans un outil type Draw.io, conforme au README dans `docs/diagrams`) regroupe les cas d’utilisation par acteur, par exemple :

- **Authentification** : S’authentifier, S’inscrire, Réinitialiser le mot de passe (inclut demande par e-mail et saisie du nouveau mot de passe).
- **Sociétés** : Gérer « mes sociétés », créer/éditer une société, sélectionner la société courante (company selector).
- **Clients / Fournisseurs** : Lister, créer, modifier, consulter clients et fournisseurs (sociétés de type client/fournisseur).
- **Factures** : Créer une facture (vente/achat), consulter une facture, lister les factures (filtres), générer le PDF, enregistrer les paiements ; option « scan » pour les achats.
- **Employés** : Créer, modifier, lister les employés d’une société.
- **Paie** : Gérer les salaires (création, liste, détail par mois), générer la paie.
- **CNSS** : Saisir et consulter les paiements CNSS.
- **TVA** : Consulter les déclarations mensuelles/cumulatives, enregistrer les paiements TVA, gérer les paramètres de TVA (taux, libellés).
- **Administration** : Gérer les affectations société–utilisateur (Super Admin), consulter les journaux d’audit.

Les relations d’inclusion/extension (ex. « Générer PDF » inclus dans « Consulter facture ») peuvent être précisées sur le diagramme.

### III. Analyse des cas d’utilisation

Quelques cas d’utilisation sont détaillés ci-dessous.

- **S’authentifier**  
  Acteur : tout visiteur. Préconditions : aucun. Scénario nominal : saisie de l’e-mail et du mot de passe → validation → émission d’un JWT et (optionnel) refresh token → redirection vers le tableau de bord ou le sélecteur de société. Scénarios d’erreur : identifiants invalides, compte désactivé.

- **Créer une facture**  
  Acteur : User ou Comptable. Préconditions : utilisateur authentifié, société sélectionnée, au moins un paramètre de TVA si nécessaire. Scénario nominal : saisie des informations (client/fournisseur, lignes avec libellés, montants HT/TTC, TVA, remises), enregistrement en brouillon ou soumission → statut mis à jour, numérotation. Extensions : ajout de paiements partiels, génération de PDF, export futur au format TEIF.

- **Gérer les salaires (paie)**  
  Acteur : Manager. Préconditions : société avec employés, paramètres CNSS cohérents. Scénario nominal : choix du mois → calcul ou saisie des salaires (net, CNSS si applicable) → enregistrement ; possibilité d’export/import CSV. Le système peut refuser de créer un doublon pour le même mois/employé.

- **Gérer les affectations (company memberships)**  
  Acteur : Super Admin. Préconditions : utilisateur connecté avec rôle Super Admin. Scénario nominal : liste des sociétés et des utilisateurs → affectation ou retrait d’un rôle (Manager, Comptable, etc.) à un utilisateur pour une société → enregistrement et traçabilité dans les journaux d’audit.

Cette analyse peut être complétée pour chaque cas listé au paragraphe II (liste détaillée des préconditions, postconditions et variantes).

---

## Chapitre 3 : Modélisation structurelle de l’application

### I. Diagramme de classes

#### I.1 Descriptif du diagramme

Le modèle du domaine (backend) est organisé autour d’une **entité de base** `Base` (identifiant `_id`, indicateur de suppression logique `isDeleted`, dates `createdAt`, `updatedAt`, `deletedAt`). Les principales entités sont :

- **User** : prénom, nom, e-mail, mot de passe, date de naissance, téléphone, numéro d’identité, rôles (liste), refresh token, avatar, OTP (réinitialisation).
- **Company** : type (mes sociétés, client, fournisseur), nom, logo, patente, coordonnées bancaires (nom de banque, IBAN, RIB, BIC), adresse, e-mail, téléphones, responsable (nom, e-mail, téléphone), secteur/sous-secteur, options (TVA incluse, type fournisseur, e-mail comptabilité), pays, ville, notes.
- **CompanyMembership** : lien entre un utilisateur et une société avec un rôle (Manager, Comptable, etc.).
- **Invoice** : numéro, date, statut, type (vente/achat), type client, lignes (libellés, montants HT/TTC, TVA, remises), totaux (HT, TTC, taxe, remise), liens optionnels vers `client`, `supplier`, `mycompany` (références Company), paramètres de TVA additionnels, paiements (montant, date, type, preuve), montant payé / restant, timbre, fichier PDF, etc.
- **Employee** : lien `userId`, `companyId`, prénom, nom, e-mail, téléphone, applicabilité CNSS, salaire net mensuel, taux CNSS, notes.
- **Salary** : enregistrement d’un salaire pour un employé sur une période (mois).
- **CnssPayment** : paiement CNSS associé à une société / période.
- **TvaPayment** : paiement de TVA.
- **TaxesSettings** : paramètres de taux de TVA (ex. 20 %, 10 %).
- **Libelle** : libellés utilisés dans les factures (lignes de facture).
- **PurchaseInvoice** : factures d’achat (modèle dédié).
- **Files** : métadonnées des fichiers stockés (ex. preuves de paiement, pièces jointes).
- **AuditLog** : traces des actions sensibles (affectations, imports, etc.).

Les associations principales : Company « possède » des Invoices (client/supplier/mycompany), des Employees, des Salary/CnssPayment/TvaPayment ; User est lié à Company via CompanyMembership ; Invoice référence TaxSettings et Libelle (lignes).

#### I.2 Représentation du diagramme

La représentation graphique du diagramme de classes peut être réalisée dans **Draw.io** (voir `docs/diagrams/README.md` pour l’extension VSCode). On y fera figurer les classes listées ci-dessus, les attributs principaux, les relations (1–1, 1–n, n–n) et l’héritage depuis `Base`. Les contrôleurs (presentation) et use cases (application) ne font pas partie du diagramme de classes du domaine mais peuvent être représentés dans des vues « logicielles » séparées si besoin.

### II. Modélisation de la base de données

La persistance est assurée par **MongoDB**. Chaque entité du domaine est mappée à une collection via des schémas Mongoose (dans `src/infrastructure/database/mongo/models/`) : `user.model`, `company.model`, `companyMembership.model`, `invoice.model`, `employee.model`, `salary.model`, `cnssPayment.model`, `tvaPayment.model`, `taxesSettings.model`, `libelle.model`, `purchaseInvoice.model`, `files.model`, `auditLog.model`. Les relations sont gérées par des références (ObjectId) et, si besoin, par des agrégations ou des lookups pour les requêtes complexes. Les champs `isDeleted`, `createdAt`, `updatedAt` permettent la suppression logique et l’audit temporel.

### III. Diagramme de déploiement

Le déploiement type est le suivant :

- **Client navigateur** : exécution de l’application Angular (buildée en fichiers statiques).
- **Serveur web / Reverse proxy** : Nginx (ou équivalent) en frontal, gérant le TLS (ex. Let’s Encrypt) et la réécriture vers le backend et, le cas échéant, vers le serveur de fichiers statiques du frontend.
- **Serveur d’applications** : conteneur Docker exécutant le backend NestJS (Node.js), exposé sur un port (ex. 3000). Variables d’environnement pour JWT, URL de base, connexion MongoDB, SMTP, clés S3.
- **Base de données** : MongoDB (sur le même serveur ou distant), accédée par le backend via une chaîne de connexion.
- **Stockage objet** : espace S3-compatible (DigitalOcean Spaces en production, MinIO en développement) pour les fichiers (PDF, preuves de paiement, etc.).

Le pipeline CI/CD (GitHub Actions) assure le build de l’image Docker, le push vers Docker Hub et le déploiement sur le serveur (nerdctl), avec health check sur l’endpoint Swagger (ex. `/api/docs`). Le diagramme de déploiement peut représenter ces nœuds et les artéfacts (conteneurs, bases, stockage) avec les protocoles (HTTPS, MongoDB, S3).

---

## Chapitre 4 : Réalisation

### I. Environnement de développement

- **Backend** : Node.js, NestJS 10, Mongoose, JWT (Passport), Swagger, class-validator/class-transformer, Handlebars (templates), AWS SDK (S3), bcrypt, Helmet. Lancement en local : `docker compose up -d` (MongoDB + MinIO) puis `npm run start:dev`.
- **Frontend** : Angular 21 (CLI 21.1.2), Vitest pour les tests unitaires. Commande : `ng serve` (port 4200).
- **Outils** : Git, GitHub Actions (build, Trivy, déploiement), Docker / nerdctl, Nginx, Certbot. Documentation : `DEPLOYMENT.md`, `DOCKER-SETUP.md`, `NGINX-SETUP.md`, `TEST-DATA-README.md` (données de test et comptes de démonstration).

### II. Principales interfaces graphiques

Les écrans principaux de l’application Angular sont accessibles via les routes définies dans `app.routes.ts` :

| Module | Routes | Description |
|--------|--------|-------------|
| **Authentification** | `/login`, `/signup`, `/forgot-password`, `/reset-password` | Connexion, inscription, demande et réinitialisation du mot de passe. |
| **Tableau de bord** | `/dashboard` | Vue d’ensemble (indicateurs, statistiques factures, etc.). |
| **Sélecteur de société** | `/company-selector` | Choix de la société courante pour les utilisateurs multi-sociétés. |
| **Mes sociétés** | `/my-companies`, `/my-companies/new` | Liste et création des sociétés « mes sociétés ». |
| **Clients** | `/clients`, `/clients/new`, `/clients/:id`, `/clients/:id/edit` | Liste, création, fiche et édition des clients. |
| **Fournisseurs** | `/suppliers`, `/suppliers/new`, `/suppliers/:id` | Liste, création et fiche des fournisseurs. |
| **Factures** | `/invoices`, `/invoices/new`, `/invoices/:id`, `/invoices/scan`, `/invoices/buying` | Liste, création, détail, scan d’achats et factures d’achat. |
| **Employés** | `/employees`, `/employees/new`, `/employees/:id` | Liste, création et fiche des employés. |
| **Salaires** | `/salaries`, `/salaries/new`, `/salaries/:id` | Liste, création et détail des enregistrements de paie. |
| **CNSS** | `/cnss`, `/cnss/new`, `/cnss/:id` | Paiements CNSS. |
| **TVA** | `/tva-monthly`, `/tva-cumulative`, `/tva-payments`, `/tva-payments/new`, `/tva-payments/:id` | Déclarations TVA mensuelles/cumulatives et paiements. |
| **Paramètres fiscaux** | `/tax-settings/new` | Création des paramètres de TVA (taux, libellés). |
| **Administration** | `/admin/company-memberships`, `/admin/audit-logs` | Affectations société–utilisateur et consultation des journaux d’audit. |

Les interfaces s’appuient sur des composants Angular dédiés (ex. `dashboard.component`, `invoice-list.component`, `invoice-create.component`, `employee-list.component`, `salary-create.component`, etc.) et communiquent avec l’API backend via des services HTTP et des guards pour la protection des routes selon le rôle et la société.

---

## Conclusion générale

Le stage a permis de participer à la conception et à la réalisation d’une application complète de **gestion des factures et de la paie** (Invoice Studio), depuis la modélisation (cas d’utilisation, classes, base de données, déploiement) jusqu’à l’implémentation en Clean Architecture (NestJS) et en Angular. L’intégration des **spécifications techniques Elfatoora** (TEIF 1.8.8) dans la documentation du projet pose les bases pour une évolution vers la facturation électronique conforme. Les choix techniques (MongoDB, JWT, rôles multi-sociétés, stockage S3, déploiement conteneurisé et CI/CD) offrent une base maintenable et évolutive pour les PME et les comptables. Les prochaines étapes peuvent porter sur le renforcement des exports TEIF, l’enrichissement des tableaux de bord et des rapports, et l’élargissement des intégrations (comptabilité, banque).

---

## Nétographie

- Documentation NestJS : https://docs.nestjs.com  
- Angular : https://angular.dev  
- Spécifications Tunisie TradeNet / facturation électronique (référence normative officielle)  
- MongoDB : https://www.mongodb.com/docs  
- Docker : https://docs.docker.com  
- DigitalOcean Spaces (S3-compatible) : https://docs.digitalocean.com/products/spaces  
- GitHub Actions : https://docs.github.com/en/actions  

---

## Annexe

- **A.** Extrait de la structure des entités du domaine (fichiers dans `Invoice-BE/src/domain/entities/`).
- **B.** Liste des contrôleurs API (auth, company, invoice, employee, salary, cnss, tva-payments, tax-settings, purchase-invoice, libelle, files, sadmin, analysis).
- **C.** Référence aux schémas XSD et à l’exemple de facture Elfatoora : `Invoice-BE/documentation/Specifications_techniques_Elfatoora/elfatooraSpecTech/` (`facture_INVOIC_V1.8.8_withoutSig.xsd`, `facture_INVOIC_V1.8.8_withSig.xsd`, `exemple_signe_elfatoora.xml`).
- **D.** Instructions de déploiement et de test : `Invoice-BE/DEPLOYMENT.md`, `Invoice-BE/TEST-DATA-README.md`, `Invoice-BE/README.md` (architecture des couches).

---

*Rapport rédigé dans le cadre du stage sur le projet Invoice Studio — Celestial Wave Digital.*
