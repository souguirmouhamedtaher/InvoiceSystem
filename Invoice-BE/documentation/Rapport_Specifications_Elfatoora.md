# Rapport sur les spécifications techniques Elfatoora (facturation électronique Tunisie)

Ce document décrit les spécifications techniques Elfatoora / Tunisie TradeNet pour la facturation électronique, telles que définies par les schémas XSD et l’exemple fournis dans `Invoice-BE/documentation/Specifications_techniques_Elfatoora/elfatooraSpecTech/`.

---

## 1. Contexte et objectif

La facturation électronique en Tunisie est encadrée par la plateforme **Tunisie TradeNet (TTN)** et le format **TEIF** (TradeNet Electronic Invoice Format). Les spécifications **Elfatoora** définissent la structure XML des factures électroniques conformes à ce format. La version documentée ici est **1.8.8**, avec notamment l’ajout du contrôle de la matricule fiscale (MF) et la **suppression de la virgule dans le format des montants** (utilisation du point décimal uniquement).

**Fichiers de référence dans le projet :**

| Fichier | Rôle |
|--------|------|
| `facture_INVOIC_V1.8.8_withoutSig.xsd` | Schéma de la facture sans signature (structure métier uniquement). |
| `facture_INVOIC_V1.8.8_withSig.xsd` | Schéma incluant les signatures XML (import de `xmldsig-core-schema.xsd`). |
| `exemple_signe_elfatoora.xml` | Exemple complet de facture signée (émetteur, acheteur, lignes, montants, taxes, signatures). |

---

## 2. Structure globale du document TEIF

L’élément racine est **`TEIF`**. Il porte deux attributs obligatoires :

- **`version`** : valeurs autorisées de `1.8.1` à `1.8.8`.
- **`controlingAgency`** : `"TTN"` ou `"Tunisie TradeNet"`.

Structure des enfants de `TEIF` (dans l’ordre) :

1. **InvoiceHeader** (obligatoire) — Identifiants de l’émetteur et du destinataire du message.
2. **InvoiceBody** (obligatoire) — Corps de la facture (document, dates, partenaires, lignes, montants, taxes).
3. **AdditionnalDocuments** (optionnel) — Références à des documents annexes.
4. **RefTtnVal** (optionnel) — Référence TTN de validation (numéro, date, CEV, etc.).
5. **Signature(s)** (uniquement dans le schéma *withSig*) — Une ou plusieurs signatures XML (ex. signature de l’émetteur, signature TTN).

---

## 3. En-tête de la facture (InvoiceHeader)

- **MessageSenderIdentifier**  
  Identifiant de l’émetteur du message (vendeur). Type : `PartnerIdentifierTestType` avec attribut **`type`** obligatoire.  
  Types autorisés : **I-01** (matricule fiscale tunisienne), **I-02** (CIN), **I-03** (carte de séjour), **I-04** (autre).  
  Des **assertions XSD** imposent le format selon le type :
  - **I-01** : longueur 13, motif `[0-9]{7}[ABCDEFGHJKLMNPQRSTVWXYZ][ABDNP][CMNP][0]{3}` (matricule fiscale TN).
  - **I-02** : longueur 8, motif `[0-9]{8}` (CIN).
  - **I-03** : longueur 9, motif `[0-9]{9}` (carte de séjour).
  - **I-04** : pas de contrainte de motif.

- **MessageRecieverIdentifier**  
  Identifiant du destinataire (acheteur). Même liste de types **I-01** à **I-04**, valeur sur 35 caractères max.

---

## 4. Corps de la facture (InvoiceBody)

Le corps est une séquence ordonnée des blocs suivants.

### 4.1 Bgm (identifiant et type de document)

- **DocumentIdentifier** : identifiant du document (max 70 caractères), non vide.
- **DocumentType** : type avec attribut **`code`** parmi **I-11** à **I-16** (ex. I-11 = Facture), et texte libre (ex. « Facture »).
- **DocumentReferences** (optionnel) : références à d’autres documents.

### 4.2 Dtm (dates)

Une ou plusieurs **DateText** avec :

- **format** obligatoire : `ddMMyy`, `ddMMyyHHmm`, ou `ddMMyy-ddMMyy` (plage).
- **functionCode** obligatoire : **I-31** à **I-38** (ex. date d’émission, date d’échéance, période concernée).

Exemple : `070612` en format `ddMMyy` et functionCode `I-31`.

### 4.3 PartnerSection (partenaires)

Liste de **PartnerDetails**, chacun avec un **functionCode** parmi **I-61** à **I-68** (ex. I-62 = vendeur, I-64 = acheteur). Chaque partenaire contient :

- **Nad** (Name and Address) :
  - **PartnerIdentifier** (type I-01 à I-04, même logique que l’en-tête pour I-01/I-02/I-03).
  - **PartnerName** (optionnel), attribut **nameType** : `Physical` ou `Qualification`.
  - **PartnerAdresses** (optionnel, répétable) : `AdressDescription`, `Street`, `CityName`, `PostalCode`, `Country` (codeList `ISO_3166-1`), attribut **lang** (fr, en, ar, or).
- **Loc** (optionnel) : lieux, functionCode I-51 à I-59.
- **RffSection** (optionnel) : références (refID I-81 à I-89, I-80, I-811 à I-817), ex. numéro fiscal, matricule, etc.
- **CtaSection** (optionnel) : contact (**ContactIdentifier**, **ContactName**, functionCode I-91 à I-94) et **Communication** (**ComMeansType** I-101 à I-104 : téléphone, fax, e-mail, URL ; **ComAdress**).

### 4.4 LocSection (optionnel)

Détails de lieux (LocType, functionCode I-51 à I-59).

### 4.5 PytSection (conditions de paiement, optionnel)

Une ou plusieurs **PytSectionDetails** (**PytSegType**), chacune pouvant contenir :

- **Pyt** : **PaymentTearmsTypeCode** (code type, ex. I-114, I-115), **PaymentTearmsDescription** (texte libre).
- **PytDtm** : dates.
- **PytMoa** : montants.
- **PytPai** : conditions et moyens de paiement (PaiConditionCode, PaiMeansCode).
- **PytFii** : informations financières (functionCode I-141 à I-143) : **AccountHolder** (AccountNumber, OwnerIdentifier), **InstitutionIdentification** (nameCode, BranchIdentifier, InstitutionName), **Country** (optionnel).

### 4.6 Ftx (texte libre, optionnel)

**FreeTextDetail** avec **subjectCode** I-41 à I-48 et **FreeTexts** (chaînes jusqu’à 500 caractères).

### 4.7 SpecialConditions (optionnel)

Liste de **SpecialCondition** (chaînes jusqu’à 200 caractères).

### 4.8 LinSection (lignes de facture)

Une ou plusieurs **Lin** (ligne). Chaque **Lin** contient notamment :

- **ItemIdentifier** : identifiant de la ligne (max 35 caractères).
- **LinImd** : désignation — **ItemCode**, **ItemDescription** (lang optionnel).
- **LinApi** (optionnel) : codes et descriptions additionnels (ApiCode, ApiDescription).
- **LinQty** : **Quantity** avec **measurementUnit** (ex. `UNIT`).
- **LinDtm** (optionnel) : dates.
- **LinTax** : taxe de la ligne — **TaxTypeName** (code I-161 à I-169, I-160, I-1601 à I-1603), **TaxCategory** (optionnel), **TaxDetails** (TaxRate, TaxRateBasis optionnel).
- **LinAlc** (optionnel) : remises / avantages (AlcType, Pcd, Ftx) ; **allowanceCode** I-151 à I-155.
- **LinMoa** : montants de la ligne (**MoaDetails**), chaque **Moa** avec **amountTypeCode** (I-171 à I-188), **currencyCodeList** `ISO_4217`, **Amount** (attribut **currencyIdentifier**, ex. TND), **AmountDescription** (optionnel).
- **LinFtx** (optionnel) : texte libre.
- **SubLin** (optionnel) : sous-lignes (récurrence de LinType).

### 4.9 InvoiceMoa (montants globaux de la facture)

Liste de **AmountDetails**, chaque détail contenant un **Moa** (même structure que ci-dessus) : **amountTypeCode** (I-171 à I-188), **currencyCodeList** `ISO_4217`, **Amount** (currencyIdentifier), **AmountDescription** (optionnel).  
Exemples de codes : I-176 (total HT ?), I-179, I-180 (montant TTC avec libellé en lettres), I-181 (TVA), I-182 (total TTC), I-178 (montant de taxe), etc.

### 4.10 InvoiceTax (taxes au niveau facture)

Liste de **InvoiceTaxDetails** : un **Tax** (TaxTypeName, TaxCategory, TaxDetails) et des **AmountDetails** (Moa) pour les montants associés (assiette, montant de taxe, etc.).

### 4.11 InvoiceAlc (avantages / remises au niveau facture, optionnel)

Liste de **AllowanceDetails** : **Alc**, **Moa**, **Ftx** (optionnel), **TaxAlc** (optionnel).

---

## 5. Documents additionnels et référence TTN

- **AdditionnalDocuments** (AdRefType) : **AdditionnalDocumentIdentifier**, **AdditionnalDocumentName**, **AdditionnalDocumentDate** (DtmType).
- **RefTtnVal** (RefTtnType) : **ReferenceTTN** (refID I-81 à I-89, I-80), **ReferenceCEV** (chaîne jusqu’à 4000 caractères, ex. code-barres ou image encodée), **ReferenceDate** (DtmType).

---

## 6. Règles sur les identifiants (Matricule fiscale, CIN, Carte de séjour)

Le schéma définit des types dédiés pour la Tunisie :

- **TNMF (Matricule fiscale)** : motif `[0-9]{7}[ABCDEFGHJKLMNPQRSTVWXYZ][ABDNP][CMNPE][0-9]{3}` (13 caractères).
- **CINTN (Carte d’identité nationale)** : `[0-9]{8}`.
- **CSTN (Carte de séjour)** : `[0-9]{9}`.

Les assertions sur **PartnerIdentifierTestType** et **SenderIdentifierTestType** appliquent ces règles selon l’attribut **type** (I-01, I-02, I-03, I-04).

---

## 7. Types de données communs

- **Montants** : type **monetaryAmountType** — motif `-?[0-9]{1,15}([.][0-9]{1,5})?` (point décimal, **pas de virgule** ; version 1.8.8).
- **Langues** : **LangEnumType** — `fr`, `en`, `ar`, `or`.
- Chaînes de longueur bornée : DataStringType / NotNullDataStringType avec suffixes _4, _5, _6, _8, _9, _11, _12, _15, _17, _20, _35, _50, _70, _100, _200, _500, _4000 selon les champs.

---

## 8. Signatures (schéma withSig et exemple)

Dans le schéma **withSig**, **TEIF** peut contenir après **RefTtnVal** un ou plusieurs éléments **ds:Signature** (namespace XML Signature).

Dans l’**exemple fourni** (`exemple_signe_elfatoora.xml`) :

- **Signature émetteur (SigFrs)** : signe le contenu de la facture (à l’exclusion des blocs `ds:Signature` et `RefTtnVal`).  
  - Algorithmes : Canonicalization (exc-c14n), SignatureMethod RSA-SHA256, DigestMethod SHA-256.  
  - **XAdES** : SignedProperties (SigningTime, SigningCertificateV2, SignaturePolicyIdentifier, SignerRoleV2).  
  - Politique de signature : `urn:2.16.788.1.2.1` — « Politique de signature de la facture electronique », avec SPURI vers un PDF sur tradenet.com.tn.  
  - Rôle déclaré : CEO.  
  - Certificat X509 et chaîne (Tn Trust Qualified Gov CA, Tunisia Gov CA, Tunisia National Root CA).

- **RefTtnVal** : contient **ReferenceTTN** (refID I-88), **ReferenceDate** (format ddMMyyHHmm), **ReferenceCEV** (chaîne base64, ex. image du code de validation).

- **Signature TTN (SigTTN)** : seconde signature (ex. par la plateforme Tunisie TradeNet), même mécanisme XAdES, rôle déclaré KERNEL.

Les deux signatures utilisent la même politique OID et le même SPURI.

---

## 9. Résumé de l’exemple fourni

L’exemple `exemple_signe_elfatoora.xml` illustre :

- **TEIF** version 1.8.8, controlingAgency TTN.
- **InvoiceHeader** : émetteur et destinataire avec type I-01 (matricule fiscale), ex. 0736202XAM000 et 0914089JAM000.
- **Bgm** : DocumentIdentifier 12016_2012, DocumentType I-11 Facture.
- **Dtm** : dates en ddMMyy et plage ddMMyy-ddMMyy (I-31, I-36, I-32).
- **PartnerSection** : vendeur (I-62) Tunisie TradeNet avec adresse, RFF (I-815, I-816), contacts (téléphone I-101, I-102, site I-104) ; acheteur (I-64) STE FRERE ET MOSAIQUE avec références (I-81, I-811 SMTP, I-813, I-812, I-814).
- **PytSection** : conditions de paiement (I-114 RIB, I-115 bureaux postaux) avec PytFii (I-141) — compte, identifiant établissement (0760 La poste).
- **LinSection** : une ligne (ItemIdentifier 1, Dossier DDM, quantité 1.0 UNIT, TVA 12 %, montants en TND : I-183, I-171).
- **InvoiceMoa** : montants globaux (I-179, I-180 avec libellé en lettres, I-176, I-182, I-181).
- **InvoiceTax** : droit de timbre (I-1601), TVA (I-1602) avec taux 12 % et montants (I-177, I-178).
- **RefTtnVal** + **ds:Signature** (SigFrs puis SigTTN) avec XAdES et certificats Tunisie.

---

## 10. Points d’attention pour l’implémentation

1. **Version et agence** : toujours renseigner `version="1.8.8"` et `controlingAgency="TTN"` (ou « Tunisie TradeNet »).
2. **Identifiants** : respecter les motifs MF/CIN/Carte de séjour selon le type I-01 / I-02 / I-03 ; I-04 pour les autres cas.
3. **Montants** : utiliser le **point** comme séparateur décimal, pas de virgule ; motif `-?[0-9]{1,15}([.][0-9]{1,5})?`.
4. **Ordre des éléments** : respecter l’ordre imposé par le schéma (Header → Body → AdditionnalDocuments → RefTtnVal → Signatures).
5. **Codes fixes** : utiliser les codeLists et functionCodes définis dans le XSD (I-xx) pour éviter les rejets de validation.
6. **Signatures** : pour une facture signée, produire au moins la signature émetteur (SigFrs) et respecter la politique de signature tunisienne (OID + SPURI) ; la signature TTN (SigTTN) et le bloc RefTtnVal sont en général ajoutés par la plateforme après validation.

---

## 11. Référence des fichiers du projet

- `Invoice-BE/documentation/Specifications_techniques_Elfatoora/elfatooraSpecTech/facture_INVOIC_V1.8.8_withoutSig.xsd`
- `Invoice-BE/documentation/Specifications_techniques_Elfatoora/elfatooraSpecTech/facture_INVOIC_V1.8.8_withSig.xsd`
- `Invoice-BE/documentation/Specifications_techniques_Elfatoora/elfatooraSpecTech/exemple_signe_elfatoora.xml`

Le backend Invoice-BE expose un endpoint **GET invoice/:id/xml** et un use case **xmlGenerator** pour générer des flux XML conformes à ces spécifications ; la documentation ci-dessus peut servir de base pour valider et étendre cette génération (notamment champs obligatoires, codes et signatures).
