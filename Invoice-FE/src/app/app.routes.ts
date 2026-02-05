import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'clients',
	},
		{
			path: 'clients',
			canActivate: [authGuard],
			loadComponent: () => import('./clients/client-list.component').then((m) => m.ClientListComponent),
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
		path: '**',
		redirectTo: 'clients',
	},
];
