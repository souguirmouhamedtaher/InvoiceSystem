import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'login',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'signup',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'forgot-password',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'reset-password',
    renderMode: RenderMode.Server,
  },
  {
    path: 'clients/new',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'clients',
    renderMode: RenderMode.Server,
  },
  {
    path: 'clients/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'clients/:id/edit',
    renderMode: RenderMode.Server,
  },
  {
    path: 'my-companies',
    renderMode: RenderMode.Server,
  },
  {
    path: 'my-companies/new',
    renderMode: RenderMode.Server,
  },
  {
    path: 'tax-settings/new',
    renderMode: RenderMode.Server,
  },
  {
    path: 'tva-monthly',
    renderMode: RenderMode.Server,
  },
  {
    path: 'tva-cumulative',
    renderMode: RenderMode.Server,
  },
  {
    path: 'suppliers',
    renderMode: RenderMode.Server,
  },
  {
    path: 'suppliers/new',
    renderMode: RenderMode.Server,
  },
  {
    path: 'suppliers/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'employees',
    renderMode: RenderMode.Server,
  },
  {
    path: 'employees/new',
    renderMode: RenderMode.Server,
  },
  {
    path: 'employees/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'salaries',
    renderMode: RenderMode.Server,
  },
  {
    path: 'salaries/new',
    renderMode: RenderMode.Server,
  },
  {
    path: 'salaries/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'cnss',
    renderMode: RenderMode.Server,
  },
  {
    path: 'cnss/new',
    renderMode: RenderMode.Server,
  },
  {
    path: 'cnss/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'invoices',
    renderMode: RenderMode.Server,
  },
  {
    path: 'invoices/scan',
    renderMode: RenderMode.Server,
  },
  {
    path: 'invoices/buying',
    renderMode: RenderMode.Server,
  },
  {
    path: 'invoices/new',
    renderMode: RenderMode.Server,
  },
  {
    path: 'invoices/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Server,
  }
];
