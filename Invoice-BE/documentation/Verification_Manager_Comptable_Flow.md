# Vérification du flux Owner / Manager / Comptable

Ce document résume ce qui a été **vérifié** et **corrigé** pour que le flux suivant fonctionne comme prévu.

---

## Flux attendu

1. **Nouvel utilisateur (propriétaire)** : première connexion → doit créer au moins une société (« mes sociétés ») → peut en créer plusieurs → sélectionne une société dans une liste → toute l’app tourne dans le contexte de cette société (pas besoin de resélectionner pour ajouter employés, clients, fournisseurs).
2. **Propriétaire** : dans une section du type « Administration » / « Team Members », crée un compte Manager ou Comptable **assigné à la société actuellement sélectionnée**.
3. **Manager / Comptable** : se connecte → interface différente et limitée → ne voit/agit que pour la ou les sociétés auxquelles il est assigné.
4. **Audit** : les actions importantes sont enregistrées dans le journal d’audit (par société).

---

## Ce qui a été corrigé / ajouté

### 1. Company selector pour le propriétaire (OWNER)

- **Problème** : `GET /employee/my-memberships` ne renvoyait que les **CompanyMembership** (Manager/Comptable). Un propriétaire sans membership avait une liste vide et était toujours redirigé vers « créer une société ».
- **Correction** : `getUserMemberships` (backend) renvoie désormais :
  - les **memberships** existants (MANAGER / ACCOUNTANT) ;
  - les **sociétés dont l’utilisateur est propriétaire** (companies où `userId = current user` et `companyType = mycompany`) sous forme d’entrées avec **role: 'OWNER'**.
- Le sélecteur de société affiche donc « Mes sociétés » (OWNER) et/ou les sociétés assignées (MANAGER/ACCOUNTANT). Après création d’une société, le propriétaire revient sur le sélecteur et peut la choisir.

### 2. Création de Manager / Comptable par le propriétaire (pas seulement Super Admin)

- **Problème** : ajout de membres (manager/comptable) et liste des memberships n’étaient possibles que via **sadmin** (rôle SUPERADMIN).
- **Correction** :
  - **Backend** : endpoints **company-scoped** accessibles au **propriétaire de la société** ou au Super Admin :
    - `GET /company/:companyId/members` — lister les membres de la société
    - `POST /company/:companyId/members` — ajouter un Manager ou Comptable (body : email, role, firstName?, lastName?, phone?)
    - `DELETE /company/memberships/:membershipId` — retirer un membre
  - Le propriétaire peut ainsi, depuis l’écran « Team Members », ajouter des comptes Manager/Comptable **pour la société actuellement sélectionnée** sans être Super Admin.

### 3. Journal d’audit par société (owner / manager / comptable)

- **Problème** : les logs d’audit n’étaient accessibles que via **sadmin** (Super Admin).
- **Correction** :
  - **Backend** : `GET /company/:companyId/audit-logs` — autorisé si l’utilisateur est **propriétaire** de la société, ou **Manager/Comptable** assigné à cette société (ou Super Admin).
  - **Frontend** : la page « Audit Log » utilise ce endpoint avec la **société sélectionnée** (ou celle choisie dans le filtre). Plus besoin d’être Super Admin pour voir le journal de sa société.

### 4. Navigation selon le rôle (Owner vs Manager vs Comptable)

- **Problème** : tout le monde voyait « My Companies » et « Team Members », ce qui n’a de sens que pour le propriétaire (ou Super Admin).
- **Correction** :
  - **Frontend** : « My Companies » et « Team Members » sont affichés **uniquement** lorsque le rôle dans le **contexte de la société sélectionnée** est **OWNER** (via `companySwitcher.currentMembership()?.role === 'OWNER'`).
  - Manager et Comptable ne voient plus ces deux liens ; ils voient le reste (Invoices, Clients, Suppliers, Employees, TVA, **Audit Log**).

### 5. Redirection après création d’une société

- **Problème** : après création d’une « my company », la redirection allait vers `/clients/:id` (inadapté).
- **Correction** : redirection vers **`/company-selector`** pour que le propriétaire voie sa nouvelle société dans la liste et puisse la sélectionner.

### 6. Frontend : utilisation des bons endpoints

- **Team Members** : utilise désormais `getCompanyMembers(companyId)`, `addCompanyMember(companyId, payload)` et `deleteCompanyMembership(membershipId)` (endpoints **company**), avec la société **sélectionnée**.
- **Audit Log** : utilise `getCompanyAuditLogs(companyId, filters)` avec la société sélectionnée (ou celle du filtre).

---

## Récapitulatif des rôles et accès

| Contexte | My Companies | Team Members | Audit Log | Invoices, Clients, Employees, TVA, etc. |
|----------|--------------|--------------|-----------|----------------------------------------|
| **OWNER** (société sélectionnée = une de ses sociétés) | ✅ | ✅ (ajout Manager/Comptable pour cette société) | ✅ (cette société) | ✅ (ses sociétés) |
| **MANAGER** (société assignée) | ❌ | ❌ | ✅ (cette société) | ✅ limité à cette société (employés, paie, CNSS, etc.) |
| **ACCOUNTANT** (société assignée) | ❌ | ❌ | ✅ (cette société) | ✅ limité à cette société (factures, clients, fournisseurs, TVA) |
| **Super Admin** | (accès global) | (sadmin ou company-scoped) | (sadmin ou company-scoped) | (accès global) |

Le **backend** applique déjà les restrictions par société pour les use cases (invoice, employee, company, etc.) via `assertCompanyMembership` (Manager/Comptable) ou ownership (company.userId) pour les opérations « propriétaire ».

---

## Fichiers modifiés

- **Backend**  
  - `src/application/useCases/employee.useCase.ts` — `getUserMemberships` inclut les sociétés dont l’utilisateur est propriétaire (role OWNER).  
  - `src/application/useCases/company.useCase.ts` — `getCompanyMembers`, `addCompanyMember`, `removeCompanyMembership`, `getCompanyAuditLogs` + assertion ownership.  
  - `src/application/dtos/APPlogic/company/addCompanyMember.dto.ts` — nouveau DTO.  
  - `src/presentation/controllers/company.controller.ts` — routes company-scoped (members, audit-logs, memberships delete).

- **Frontend**  
  - `src/app/admin/admin.service.ts` — `getCompanyMembers`, `addCompanyMember`, `getCompanyAuditLogs` (company-scoped).  
  - `src/app/admin/company-memberships.component.ts` — utilise les endpoints company avec la société sélectionnée.  
  - `src/app/admin/audit-logs.component.ts` — utilise `getCompanyAuditLogs(companyId)`.  
  - `src/app/app.ts` / `app.html` — `isOwnerContext()` et masquage de « My Companies » / « Team Members » pour non-OWNER.  
  - `src/app/companies/my-company-create.component.ts` — redirection vers `/company-selector` après création.

---

## Audit log

Les actions déjà enregistrées dans l’audit (backend) sont notamment :

- `COMPANY_USER_ASSIGNED` — ajout d’un Manager/Comptable à une société (sadmin et company-scoped).
- `COMPANY_USER_REMOVED` — retrait d’un membre (sadmin et company-scoped).
- `EMPLOYEE_CSV_IMPORT` / `EMPLOYEE_CSV_EXPORT` — import/export CSV employés (employee use case).

Le modèle **AuditLog** contient `userId`, `companyId`, `action`, `entityType`, `entityId`, `metadata`, ce qui permet un journal **par société** et par utilisateur.

---

## Comment tester rapidement

1. **Propriétaire** : créer un compte (signup) → première visite → redirection vers « créer une société » → créer une société → redirection vers company-selector → sélectionner la société → voir « My Companies », « Team Members », « Audit Log » → dans Team Members, ajouter un membre (email + rôle Manager ou Comptable).
2. **Manager/Comptable** : se connecter avec le compte créé → company-selector ne montre que la société assignée → après sélection : pas de « My Companies » ni « Team Members », mais Audit Log, Employés, Factures, etc. selon les droits backend.
3. **Audit** : en tant qu’owner ou manager/comptable, ouvrir « Audit Log » avec une société sélectionnée → vérifier que les événements (assignation, retrait, import CSV, etc.) apparaissent pour cette société.
