# App Workflows and Verification

## Quick Context
- Frontend: Angular (Invoice-FE) running with `npm start` (ng serve) at http://localhost:4200
- Backend: NestJS (Invoice-BE) running with `npm run start:dev`
- API base URL (FE): http://localhost:3001 (see Invoice-FE/src/environments/environment.ts)
- Sample backend env template: Invoice-BE/environments/.env.sample

## Environment Details (from repo)
Backend (Invoice-BE) uses these env variables (sample):
- MONGO_CONNECTION_STRING (built from MONGO_* parts)
- MAILER_HOST/PORT/USER/PASSWORD/SENDER
- SPACE_ENDPOINT/REGION/ACCESS_KEY/SECRET_KEY/BUCKET
- JWT_* secrets and expirations
- BASE_URL, FRONT_END_URL

Frontend (Invoice-FE) uses:
- apiBaseUrl: http://localhost:3001

## Roles and Access
- Owner (creator): creates companies and manages company memberships.
- Manager and Accountant: have scoped access to their company data based on membership.
- Company switching: users select the active company via the switcher; most lists/actions are scoped to that company.

## Workflows

### 1) Authentication
1. User logs in from `/login`.
2. Access token is stored client-side, and the UI unlocks navigation.
3. The company switcher loads memberships and selects the first company by default.

### 2) Company Selection and Context
1. Open `/company-selector` to view available memberships.
2. Select a company to set the active company context.
3. The selection is persisted in local storage and used to scope data.

### 3) Create Company (Owner)
1. Navigate to `/my-companies/new`.
2. Fill the company profile (companyname, email, address, phones, region, country, notes).
3. Submit to create a new company.
4. The company is added to the switcher list and selected.

### 4) Company Memberships (Owner)
1. Navigate to `/admin/company-memberships`.
2. Select a company (if needed).
3. Add a member by email and role (manager/accountant).
4. Remove a member when required.

### 5) Clients (Company scoped)
1. Navigate to `/clients`.
2. Uses the active company to load clients.
3. Create a client (`/clients/new`) with name, email, address, phone, taxId, notes.
4. Edit/view a client from list.

### 6) Suppliers (Company scoped)
1. Navigate to `/suppliers`.
2. Uses the active company to load suppliers.
3. Create a supplier (`/suppliers/new`) with name, email, address, phone, taxId, notes.
4. View supplier details and delete if needed.

### 7) Tax Settings (Company scoped)
1. Navigate to `/tax-settings/new`.
2. Create a tax setting (name, type TVA/RE, tax price, active flag, notes).
3. Tax settings are scoped by companyId.

### 8) Libelles (Invoice line items)
1. Libelles are created via invoice creation (line items).
2. Calculation endpoint can preview totals before saving.
3. Libelles require companyId and optional tax settings id.

### 9) Invoices (Selling and Buying)
1. Navigate to `/invoices/new`.
2. Select invoice type: selling or buying.
3. Choose a client (selling) or supplier (buying).
4. Add line items (libelles) with quantity and price.
5. Select tax setting.
6. Submit to create invoice.
7. Download PDF or XML from invoice detail.

### 10) Invoice Payments
1. Open invoice details (`/invoices/:id`).
2. Add payments (amount, date, method, optional proof).
3. Totals update based on payments.

### 11) Employees
1. Navigate to `/employees`.
2. Employees are scoped to the active company.
3. Create/update employees with salary and CNSS fields.
4. Import/export CSV for employees.

### 12) VAT (TVA) Views
1. Monthly VAT summary at `/tva-monthly`.
2. Cumulative VAT at `/tva-cumulative`.
3. VAT payments list and create at `/tva-payments` and `/tva-payments/new`.

### 13) Audit Logs
1. Navigate to `/admin/audit-logs`.
2. Select a company to view logs.
3. Filter by action.

## Verification Checklist (Manual Smoke)

### Backend
- Start API: `npm run start:dev` (Invoice-BE)
- Health: open http://localhost:3000/api/docs or the configured port
- Verify login endpoint returns tokens

### Frontend
- Start FE: `npm start` (Invoice-FE)
- App loads at http://localhost:4200
- Login, company selector, and company switcher are visible

### Core Flows
- Create company (owner)
- Add company member (manager/accountant)
- Create client and supplier
- Create tax settings
- Create invoice (selling and buying)
- Download invoice PDF and XML
- Add invoice payment
- Add employee and run payroll summary
- View audit logs

## Notes on Tests
- FE tests: `npm -C Invoice-FE test -- --watch=false`
- BE tests: currently no test files found by Jest

## Known Requirements for Full Smoke Test
- Valid DB connection string
- Valid auth credentials
- Mailer and storage config optional unless email or file uploads are tested
