import { Routes } from '@angular/router';
import { authGuard } from './core/auth';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login.component').then((m) => m.LoginComponent), title: 'Entrar · Burbujas' },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', loadComponent: () => import('./pages/panel.component').then((m) => m.PanelComponent), title: 'Panel · Burbujas' },
      { path: 'alumnos', loadComponent: () => import('./pages/alumnos/alumnos-lista.component').then((m) => m.AlumnosListaComponent), title: 'Alumnos · Burbujas' },
      { path: 'alumnos/nuevo', loadComponent: () => import('./pages/alumnos/alumno-form.component').then((m) => m.AlumnoFormComponent), title: 'Nuevo alumno · Burbujas' },
      { path: 'alumnos/:id', loadComponent: () => import('./pages/alumnos/alumno-detalle.component').then((m) => m.AlumnoDetalleComponent), title: 'Alumno · Burbujas' },
      { path: 'alumnos/:id/editar', loadComponent: () => import('./pages/alumnos/alumno-form.component').then((m) => m.AlumnoFormComponent), title: 'Editar alumno · Burbujas' },
      { path: 'horarios', loadComponent: () => import('./pages/horarios/horarios-lista.component').then((m) => m.HorariosListaComponent), title: 'Horarios · Burbujas' },
      { path: 'horarios/nuevo', loadComponent: () => import('./pages/horarios/horario-form.component').then((m) => m.HorarioFormComponent), title: 'Nuevo horario · Burbujas' },
      { path: 'horarios/:id', loadComponent: () => import('./pages/horarios/horario-detalle.component').then((m) => m.HorarioDetalleComponent), title: 'Horario · Burbujas' },
      { path: 'horarios/:id/editar', loadComponent: () => import('./pages/horarios/horario-form.component').then((m) => m.HorarioFormComponent), title: 'Editar horario · Burbujas' },
      { path: 'facturacion', loadComponent: () => import('./pages/facturacion.component').then((m) => m.FacturacionComponent), title: 'Facturación · Burbujas' },
      { path: 'cuotas', loadComponent: () => import('./pages/cuotas.component').then((m) => m.CuotasComponent), title: 'Cuotas · Burbujas' },
    ],
  },
  { path: '**', redirectTo: '' },
];
