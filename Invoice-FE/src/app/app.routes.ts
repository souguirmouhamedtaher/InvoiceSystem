import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { companyRequiredGuard } from './core/company-required.guard';

export const routes: Routes = [
	{
		path: 'company-selector',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./companies/company-selector.component').then((m) => m.CompanySelectorComponent),
	},
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'company-selector',
	},
	{
		path: 'dashboard',
		canActivate: [authGuard, companyRequiredGuard],
		loadComponent: () =>
			import('./dashboard').then((m) => m.DashboardComponent),
	},
	{
		path: 'clients',
		canActivate: [authGuard, companyRequiredGuard],
		loadComponent: () =>
			import('./clients/client-list.component').then((m) => m.ClientListComponent),
	},
	{
		path: 'login',
		loadComponent: () => import('./auth').then((m) => m.LoginComponent),
	},
	{
		path: 'signup',
		loadComponent: () => import('./auth').then((m) => m.SignupComponent),
	},
	{
		path: 'forgot-password',
		loadComponent: () => import('./auth').then((m) => m.ForgotPasswordComponent),
	},
	{
		path: 'reset-password',
		loadComponent: () => import('./auth').then((m) => m.ResetPasswordComponent),
	},
	{
		path: 'clients/new',
		canActivate: [authGuard, companyRequiredGuard],
		loadComponent: () =>
			import('./clients/client-create.component').then((m) => m.ClientCreateComponent),
	},
	{
		path: 'clients/:id',
		canActivate: [authGuard, companyRequiredGuard],
		loadComponent: () =>
			import('./clients/client-detail.component').then((m) => m.ClientDetailComponent),
	},
	{
		path: 'clients/:id/edit',
		canActivate: [authGuard, companyRequiredGuard],
		loadComponent: () =>
			import('./clients/client-edit.component').then((m) => m.ClientEditComponent),
	},
	{
		path: 'my-companies',
		canActivate: [authGuard, companyRequiredGuard],
		loadComponent: () =>
			import('./companies/my-company-list.component').then((m) => m.MyCompanyListComponent),
	},
	{
		path: 'my-companies/new',
		canActivate: [authGuard, companyRequiredGuard],
		loadComponent: () =>
			import('./companies/my-company-create.component').then((m) => m.MyCompanyCreateComponent),
	},
	{
		path: 'tax-settings/new',
		canActivate: [authGuard, companyRequiredGuard],
		loadComponent: () =>
			import('./tax-settings/tax-settings-create.component').then(
				(m) => m.TaxSettingsCreateComponent
			),
	},
	{
		path: 'tva-monthly',
		canActivate: [authGuard, companyRequiredGuard],
		loadComponent: () =>
			import('./tva/tva-monthly.component').then((m) => m.TvaMonthlyComponent),
	},
	{
		path: 'tva-payments',
		canActivate: [authGuard, companyRequiredGuard],
		loadComponent: () =>
			import('./tva').then((m) => m.TvaPaymentsListComponent),
	},
	{
		path: 'tva-payments/new',
		canActivate: [authGuard, companyRequiredGuard],
		loadComponent: () =>
			import('./tva').then((m) => m.TvaPaymentsCreateComponent),
	},
	{
		path: 'tva-payments/:id',
		canActivate: [authGuard, companyRequiredGuard],
		loadComponent: () =>
			import('./tva').then((m) => m.TvaPaymentsDetailComponent),
	},
	{
		path: 'tva-cumulative',
		canActivate: [authGuard, companyRequiredGuard],
		loadComponent: () =>
			import('./tva/tva-cumulative.component').then((m) => m.TvaCumulativeComponent),
	},
	{
		path: 'suppliers',
		canActivate: [authGuard, companyRequiredGuard],
		loadComponent: () => import('./suppliers').then((m) => m.SupplierListComponent),
	},
	{
		path: 'suppliers/new',
		canActivate: [authGuard, companyRequiredGuard],
		loadComponent: () =>
			import('./suppliers').then((m) => m.SupplierCreateComponent),
	},
	{
		path: 'suppliers/:id',
		canActivate: [authGuard, companyRequiredGuard],
		loadComponent: () => import('./suppliers').then((m) => m.SupplierDetailComponent),
	},
	{
		path: 'employees',
		canActivate: [authGuard, companyRequiredGuard],
		loadComponent: () =>
			import('./employees').then((m) => m.EmployeeListComponent),
	},
	{
		path: 'admin/company-memberships',
		canActivate: [authGuard, companyRequiredGuard],
		loadComponent: () =>
			import('./admin/company-memberships.component').then((m) => m.CompanyMembershipsComponent),
	},
	{
		path: 'admin/audit-logs',
		canActivate: [authGuard, companyRequiredGuard],
		loadComponent: () =>
			import('./admin/audit-logs.component').then((m) => m.AuditLogsComponent),
	},
	{
		path: 'employees/new',
		redirectTo: 'employees',
	},
	{
		path: 'employees/:id',
		redirectTo: 'employees',
	},
	{
		path: 'salaries',
		redirectTo: 'employees',
	},
	{
		path: 'salaries/new',
		redirectTo: 'employees',
	},
	{
		path: 'salaries/:id',
		redirectTo: 'employees',
	},
	{
		path: 'cnss',
		redirectTo: 'employees',
	},
	{
		path: 'cnss/new',
		redirectTo: 'employees',
	},
	{
		path: 'cnss/:id',
		redirectTo: 'employees',
	},
	{
		path: 'invoices',
		canActivate: [authGuard, companyRequiredGuard],
		loadComponent: () =>
			import('./invoices/invoice-list.component').then((m) => m.InvoiceListComponent),
	},
	{
		path: 'invoices/scan',
		canActivate: [authGuard, companyRequiredGuard],
		loadComponent: () =>
			import('./invoices/invoice-scan.component').then((m) => m.InvoiceScanComponent),
	},
	{
		path: 'invoices/buying',
		canActivate: [authGuard, companyRequiredGuard],
		data: { invoiceType: 'buying' },
		loadComponent: () =>
			import('./invoices/invoice-list.component').then((m) => m.InvoiceListComponent),
	},
	{
		path: 'invoices/new',
		canActivate: [authGuard, companyRequiredGuard],
		loadComponent: () =>
			import('./invoices/invoice-create.component').then((m) => m.InvoiceCreateComponent),
	},
	{
		path: 'invoices/:id',
		canActivate: [authGuard, companyRequiredGuard],
		loadComponent: () =>
			import('./invoices/invoice-detail.component').then((m) => m.InvoiceDetailComponent),
	},
	{
		path: '**',
		redirectTo: 'dashboard',
	},
];
