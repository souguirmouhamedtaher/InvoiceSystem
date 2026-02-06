import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'dashboard',
	},
	{
		path: 'dashboard',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./dashboard').then((m) => m.DashboardComponent),
	},
	{
		path: 'clients',
		canActivate: [authGuard],
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
		canActivate: [authGuard],
		loadComponent: () =>
			import('./clients/client-create.component').then((m) => m.ClientCreateComponent),
	},
	{
		path: 'clients/:id',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./clients/client-detail.component').then((m) => m.ClientDetailComponent),
	},
	{
		path: 'clients/:id/edit',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./clients/client-edit.component').then((m) => m.ClientEditComponent),
	},
	{
		path: 'my-companies',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./companies/my-company-list.component').then((m) => m.MyCompanyListComponent),
	},
	{
		path: 'my-companies/new',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./companies/my-company-create.component').then((m) => m.MyCompanyCreateComponent),
	},
	{
		path: 'tax-settings/new',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./tax-settings/tax-settings-create.component').then(
				(m) => m.TaxSettingsCreateComponent
			),
	},
	{
		path: 'tva-monthly',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./tva/tva-monthly.component').then((m) => m.TvaMonthlyComponent),
	},
	{
		path: 'tva-payments',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./tva').then((m) => m.TvaPaymentsListComponent),
	},
	{
		path: 'tva-payments/new',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./tva').then((m) => m.TvaPaymentsCreateComponent),
	},
	{
		path: 'tva-payments/:id',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./tva').then((m) => m.TvaPaymentsDetailComponent),
	},
	{
		path: 'tva-cumulative',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./tva/tva-cumulative.component').then((m) => m.TvaCumulativeComponent),
	},
	{
		path: 'suppliers',
		canActivate: [authGuard],
		loadComponent: () => import('./suppliers').then((m) => m.SupplierListComponent),
	},
	{
		path: 'suppliers/new',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./suppliers').then((m) => m.SupplierCreateComponent),
	},
	{
		path: 'suppliers/:id',
		canActivate: [authGuard],
		loadComponent: () => import('./suppliers').then((m) => m.SupplierDetailComponent),
	},
	{
		path: 'employees',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./employees').then((m) => m.EmployeeListComponent),
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
		canActivate: [authGuard],
		loadComponent: () =>
			import('./invoices/invoice-list.component').then((m) => m.InvoiceListComponent),
	},
	{
		path: 'invoices/scan',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./invoices/invoice-scan.component').then((m) => m.InvoiceScanComponent),
	},
	{
		path: 'invoices/buying',
		canActivate: [authGuard],
		data: { invoiceType: 'buying' },
		loadComponent: () =>
			import('./invoices/invoice-list.component').then((m) => m.InvoiceListComponent),
	},
	{
		path: 'invoices/new',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./invoices/invoice-create.component').then((m) => m.InvoiceCreateComponent),
	},
	{
		path: 'invoices/:id',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./invoices/invoice-detail.component').then((m) => m.InvoiceDetailComponent),
	},
	{
		path: '**',
		redirectTo: 'dashboard',
	},
];
