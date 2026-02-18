# Elfatoora — Workflow, avec/sans signature, et ce qui manque

Ce document explique **comment fonctionne** la facturation électronique Elfatoora (Tunisie TradeNet), la différence entre **XML avec et sans signature électronique**, ce qui est **déjà fait** dans le projet et **ce qui manque** pour que ce soit opérationnel de bout en bout.

---

## 1. Workflow global (comment ça marche)

En résumé, le flux est le suivant :

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────────┐
│  Invoice Studio  │     │  XML TEIF        │     │  Tunisie TradeNet (TTN) │
│  (votre app)     │────▶│  (avec ou sans   │────▶│  Plateforme officielle   │
│                  │     │   signature)     │     │  validation / archivage │
└─────────────────┘     └──────────────────┘     └─────────────────────────┘
        │                          │                              │
        │ 1. Créer facture         │ 2. Envoyer XML                │ 3. TTN valide
        │    + lignes, TVA, etc.     │    (upload portail ou API)    │    → RefTtnVal
        │                          │                              │    → CEV (code)
        │                          │ 4. Réponse TTN                │    → (optionnel)
        │◀─────────────────────────┼──────────────────────────────┘    SigTTN
        │ 5. Stocker RefTtnVal / CEV
        │    (optionnel)
```

1. **Dans votre app** : l’utilisateur crée une facture (client, lignes, TVA, timbre, etc.).
2. **Génération du XML** : l’app produit un fichier XML au format TEIF 1.8.8 (voir spécifications Elfatoora). Ce XML peut être :
   - **Sans signature** : structure métier uniquement (InvoiceHeader + InvoiceBody).
   - **Avec signature électronique** : même structure + une (ou deux) signature(s) XML (voir section 2).
3. **Envoi vers TTN** : vous envoyez ce XML à Tunisie TradeNet, soit :
   - par **upload manuel** sur le portail TTN,  
   - soit par **API** si TTN en fournit une (à vérifier sur la doc officielle).
4. **Côté TTN** : la plateforme valide le XML (schéma XSD, règles métier, et si exigé la signature). Si tout est OK, TTN :
   - enregistre la facture,
   - génère une **référence TTN** (**RefTtnVal** : numéro, date, et souvent un **CEV** = code à barres / QR),
   - peut **signer** le document (**SigTTN**) pour attestation officielle.
5. **Retour** : TTN peut renvoyer le XML complété (RefTtnVal + éventuellement SigTTN) ou un accusé avec référence/CEV. Votre app peut alors **stocker** cette référence et le CEV sur la facture pour traçabilité et impression.

En pratique, **sans signature** : vous générez un XML conforme au schéma *withoutSig*, vous l’envoyez à TTN ; TTN peut accepter ou exiger la signature selon la réglementation. **Avec signature** : vous signez d’abord le XML (signature de l’émetteur = SigFrs), puis vous l’envoyez ; TTN valide la signature et ajoute RefTtnVal + éventuellement SigTTN.

---

## 2. XML sans signature vs avec signature électronique

### 2.1 Sans signature (structure métier uniquement)

- **Schéma** : `facture_INVOIC_V1.8.8_withoutSig.xsd`
- **Contenu** :  
  `TEIF` → `InvoiceHeader` → `InvoiceBody` → (optionnel) `AdditionnalDocuments` → (optionnel) `RefTtnVal`
- **Usage** :  
  - Génération simple par l’app.  
  - Envoi à TTN pour validation et obtention de la référence / CEV.  
  - Certains flux ou environnements (test, interne) peuvent accepter ce format sans signature.
- **Dans votre projet** : c’est **ce que vous faites déjà** : `XmlGeneratorUseCases.buildXmlObject()` produit exactement cette structure (Header + Body, pas de `RefTtnVal` ni `ds:Signature`).

### 2.2 Avec signature électronique

- **Schéma** : `facture_INVOIC_V1.8.8_withSig.xsd`
- **Contenu** : même chose que ci-dessus, **plus** après `RefTtnVal` (ou à la place si pas encore rempli) : un ou plusieurs éléments **`ds:Signature`** (XML Signature).
- **Rôles des signatures** (d’après l’exemple fourni) :
  - **SigFrs (signature du fournisseur / émetteur)** :  
    L’entreprise qui émet la facture signe le contenu (tout le TEIF sauf les blocs `ds:Signature` et `RefTtnVal`).  
    - Certificat qualifié (ex. Tn Trust Qualified Gov CA).  
    - Politique de signature tunisienne : OID `urn:2.16.788.1.2.1` + SPURI vers le PDF de la politique.  
    - Algorithme : RSA-SHA256, digest SHA-256, canonicalisation exc-c14n.  
    - Format : XAdES (SignedProperties : SigningTime, certificat, politique, rôle du signataire).
  - **SigTTN (signature TTN)** :  
    Ajoutée **par la plateforme** après validation. Elle atteste que TTN a reçu et validé la facture. Souvent, **RefTtnVal** (référence + CEV) est rempli par TTN en même temps.
- **Workflow typique avec signature** :
  1. L’app génère le XML TEIF **sans** `RefTtnVal` et **sans** `ds:Signature`.
  2. L’app (ou un service dédié) **signe** ce XML avec le certificat de l’émetteur → on obtient un XML avec **SigFrs** (et éventuellement un premier `RefTtnVal` vide ou absent).
  3. Envoi de ce XML signé à TTN.
  4. TTN vérifie la signature et les règles métier, puis ajoute **RefTtnVal** (référence + CEV) et **SigTTN**. La “facture finale” officielle est ce XML avec les deux signatures + RefTtnVal.

En résumé : **sans signature** = XML métier seul, utile pour génération et envoi simple. **Avec signature** = XML métier + au moins la signature de l’émetteur (SigFrs) ; RefTtnVal et SigTTN sont en général ajoutés par TTN après envoi.

---

## 3. Ce qui est déjà implémenté dans le projet

| Élément | Statut | Détail |
|--------|--------|--------|
| Génération XML TEIF 1.8.8 | ✅ | `XmlGeneratorUseCases.buildXmlObject()` + `generateInvoiceXml()` |
| Structure de base | ✅ | `TEIF` (version 1.8.8, controlingAgency TTN), `InvoiceHeader`, `InvoiceBody` |
| Header | ✅ | MessageSenderIdentifier / MessageRecieverIdentifier (type I-01), valeur = `Patente` société |
| Bgm | ✅ | DocumentIdentifier = numéro de facture, DocumentType I-11 Facture |
| Dtm | ✅ | Une date (format ddMMyy, functionCode I-31) |
| PartnerSection | ✅ | Vendeur (I-62) et acheteur (I-64), NAD, adresse, RffSection (RIB, I-81), CtaSection (téléphone I-101, email I-104) |
| PytSection | ✅ | Si RIB présent : conditions I-114, PytFii I-141 (compte, banque) |
| LinSection | ✅ | Lignes avec ItemIdentifier, LinImd (code, description), LinQty (UNIT), LinTax (I-1602 TVA), LinMoa (I-183, I-171) |
| InvoiceMoa | ✅ | I-180 (TTC + libellé en lettres), I-176 (HT), I-181 (TVA) |
| InvoiceTax | ✅ | TVA par taux + droit de timbre (I-1601) si `invoice.timbre` > 0 |
| Téléchargement | ✅ | `GET /invoice/:id/xml` retourne le XML en téléchargement |
| Données facture / sociétés | ✅ | Invoice chargé avec `mycompanyId`, `clientId`, `supplierId`, `Libelle` (populate) |

Donc : **génération d’un XML TEIF sans signature et téléchargement** = déjà en place.

---

## 4. Ce qui manque pour que “ça marche” de bout en bout

### 4.1 Pour le XML “sans signature” uniquement (usage actuel)

| Manque | Priorité | Action suggérée |
|--------|----------|------------------|
| **Matricule fiscale (Patente) au format MF tunisien** | Haute | Pour type I-01, le XSD impose 13 caractères et le motif `[0-9]{7}[A-Z...][ABDNP][CMNP][0]{3}`. Vérifier que le champ `Patente` des sociétés (vendeur / acheteur) est saisi et validé à ce format ; sinon le XML peut être rejeté par TTN. |
| **Validation XSD avant envoi** | Moyenne | Avant d’envoyer le XML à TTN (ou en dev), valider le flux généré contre `facture_INVOIC_V1.8.8_withoutSig.xsd` pour détecter les erreurs de structure ou de types. |
| **Population de Libelle.TaxSettingsId** | Moyenne | Lors du `invoice.get(id)` pour le XML, les `Libelle` sont chargés mais `TaxSettingsId` n’est pas populé (nested). Du coup `libelle.TaxSettingsId?.taxprice` peut être undefined et le générateur utilise '19'. Mieux : populate `Libelle.TaxSettingsId` quand on charge la facture pour le XML, ou lire le taux depuis les données déjà en base (ex. via AdditionalTaxSettings ou libelle.finalprixHT/TTC). |
| **Envoi effectif vers TTN** | Haute | Aujourd’hui le XML est seulement **téléchargé**. Il faut définir comment l’envoyer à TTN : portail (upload manuel) ou API (si disponible). Si API : implémenter un client (HTTP) qui envoie le XML et gère la réponse (référence, CEV, erreurs). |
| **Stocker RefTtnVal / CEV** | Moyenne | Si TTN renvoie une référence et un CEV (code à barres), il faut des champs en base (ex. sur Invoice ou table dédiée) et une logique pour enregistrer cette réponse (et idéalement ré-afficher le XML “final” avec RefTtnVal si TTN le renvoie). |

### 4.2 Pour le XML “avec signature” (conformité maximale)

| Manque | Priorité | Action suggérée |
|--------|----------|------------------|
| **Signature XML de l’émetteur (SigFrs)** | Haute | Implémenter la signature XML (xmldsig + XAdES) côté backend : après génération du TEIF “nu”, signer avec le certificat (et clé privée) de l’entreprise. Bibliothèques possibles : `xml-crypto`, `node-xmldsig`, ou équivalent Node. Respecter la politique tunisienne (OID, SPURI, algorithmes). |
| **Gestion des certificats** | Haute | Stockage sécurisé du certificat (et clé privée) par société ou par tenant : config ou vault, jamais en clair en base. Parfois le certificat est sur un HSM ou un service dédié (signing service). |
| **RefTtnVal et SigTTN** | Faible (côté TTN) | RefTtnVal et SigTTN sont en principe **ajoutés par TTN** après envoi. Votre app n’a pas à les générer ; il faut seulement pouvoir **recevoir** le XML ou la réponse TTN et stocker référence + CEV (et afficher le PDF/XML final si besoin). |

### 4.3 Récap “pour que ça marche”

- **Pour “sans signature”** :  
  - Corriger / valider **Patente** (format MF).  
  - (Recommandé) Valider le XML au XSD.  
  - Mettre en place **l’envoi vers TTN** (portail ou API) et **l’enregistrement de la réponse** (RefTtnVal, CEV).
- **Pour “avec signature”** :  
  - En plus : **signer le XML** avec le certificat émetteur (SigFrs) et **gérer les certificats** de façon sécurisée.  
  - Envoi et stockage de la réponse TTN comme ci-dessus.

---

## 5. Ordre de mise en œuvre suggéré

1. **Court terme (XML sans signature utilisable)**  
   - Valider / normaliser le champ **Patente** (format MF 13 caractères) à la saisie des sociétés.  
   - S’assurer que les **taux de TVA** des lignes sont corrects (populate TaxSettingsId ou source de vérité claire).  
   - (Optionnel) Ajouter une **validation XSD** du XML généré (étape de build ou endpoint de test).  
   - Documenter pour l’utilisateur : “Télécharger le XML puis l’envoyer sur le portail TTN” (si pas d’API).  
   - Si TTN fournit une API : développer le **client d’envoi** et **sauvegarder** RefTtnVal / CEV sur la facture.

2. **Moyen terme (avec signature)**  
   - Intégrer une **bibliothèque de signature XML** (XAdES) et signer le TEIF avec le certificat de l’émetteur (SigFrs).  
   - Configurer la **politique de signature** (OID, SPURI) et le **stockage des certificats** (par société / environnement).  
   - Tester avec TTN (environnement de test si disponible) : envoi du XML signé, vérification de la réponse (RefTtnVal, SigTTN).

3. **Optionnel**  
   - Générer un **PDF** ou une vue “facture officielle” incluant le **CEV** (QR / code à barres) une fois RefTtnVal reçu.  
   - Exposer un endpoint ou un job pour **relancer / synchroniser** le statut avec TTN si une API le permet.

---

## 6. Fichiers utiles dans le projet

- **Génération XML** : `src/application/useCases/xmlGenerator.useCase.ts`  
- **Endpoint XML** : `GET /invoice/:id/xml` dans `src/presentation/controllers/invoice.controller.ts`  
- **Schémas et exemple** : `documentation/Specifications_techniques_Elfatoora/elfatooraSpecTech/`  
  - `facture_INVOIC_V1.8.8_withoutSig.xsd` — validation “sans signature”  
  - `facture_INVOIC_V1.8.8_withSig.xsd` — validation “avec signature”  
  - `exemple_signe_elfatoora.xml` — exemple complet signé (SigFrs + RefTtnVal + SigTTN)  
- **Rapport specs** : `documentation/Rapport_Specifications_Elfatoora.md`

---

En résumé : **sans signature** = XML métier déjà généré et téléchargé ; il reste à sécuriser les données (Patente, TVA), valider au XSD, et surtout **envoyer le XML à TTN** et **stocker la réponse**. **Avec signature** = en plus, **signer le XML** (SigFrs) avec un certificat qualifié et gérer les certificats ; **RefTtnVal et SigTTN** restent du ressort de TTN après envoi.
