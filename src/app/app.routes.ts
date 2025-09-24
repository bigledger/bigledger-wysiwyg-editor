import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./demo/demo-home/demo-home.component').then(m => m.DemoHomeComponent)
  },
  {
    path: 'basic',
    loadComponent: () => import('./demo/basic-usage/basic-usage.component').then(m => m.BasicUsageComponent)
  },
  {
    path: 'forms',
    loadComponent: () => import('./demo/forms-integration/forms-integration.component').then(m => m.FormsIntegrationComponent)
  },
  {
    path: 'toolbar',
    loadComponent: () => import('./demo/toolbar-config/toolbar-config.component').then(m => m.ToolbarConfigComponent)
  },
  {
    path: 'events',
    loadComponent: () => import('./demo/event-handling/event-handling.component').then(m => m.EventHandlingComponent)
  },
  {
    path: 'styling',
    loadComponent: () => import('./demo/styling/styling.component').then(m => m.StylingComponent)
  },
  {
    path: 'advanced',
    loadComponent: () => import('./demo/advanced/advanced.component').then(m => m.AdvancedComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
