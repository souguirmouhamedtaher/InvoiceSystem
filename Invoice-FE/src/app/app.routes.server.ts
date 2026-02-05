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
