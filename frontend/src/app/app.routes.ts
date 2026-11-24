import { Routes } from '@angular/router';
import { authGuard } from './core/auth';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login.component').then((m) => m.LoginComponent), title: 'Entrar · Escuela de Natación' },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', loadComponent: () => import('./pages/panel.component').then((m) => m.PanelComponent), title: 'Panel · Escuela de Natación' },
      { path: 'alumnos', loadComponent: () => import('./pages/alumnos/alumnos-lista.component').then((m) => m.AlumnosListaComponent), title: 'Alumnos · Escuela de Natación' },
      { path: 'alumnos/nuevo', loadComponent: () => import('./pages/alumnos/alumno-form.component').then((m) => m.AlumnoFormComponent), title: 'Nuevo alumno · Escuela de Natación' },
      { path: 'alumnos/:id', loadComponent: () => import('./pages/alumnos/alumno-detalle.component').then((m) => m.AlumnoDetalleComponent), title: 'Alumno · Escuela de Natación' },
      { path: 'alumnos/:id/editar', loadComponent: () => import('./pages/alumnos/alumno-form.component').then((m) => m.AlumnoFormComponent), title: 'Editar alumno · Escuela de Natación' },
      { path: 'horarios', loadComponent: () => import('./pages/horarios/horarios-lista.component').then((m) => m.HorariosListaComponent), title: 'Horarios · Escuela de Natación' },
      { path: 'horarios/nuevo', loadComponent: () => import('./pages/horarios/horario-form.component').then((m) => m.HorarioFormComponent), title: 'Nuevo horario · Escuela de Natación' },
      { path: 'horarios/:id', loadComponent: () => import('./pages/horarios/horario-detalle.component').then((m) => m.HorarioDetalleComponent), title: 'Horario · Escuela de Natación' },
      { path: 'horarios/:id/editar', loadComponent: () => import('./pages/horarios/horario-form.component').then((m) => m.HorarioFormComponent), title: 'Editar horario · Escuela de Natación' },
    ],
  },
  { path: '**', redirectTo: '' },
];
