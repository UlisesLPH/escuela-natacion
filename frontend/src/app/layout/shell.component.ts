import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/auth';
import { AvatarComponent } from '../shared/avatar.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AvatarComponent],
  template: `
    <div class="app" [class.abierto]="menuAbierto()">
      <aside class="lateral">
        <a class="marca" routerLink="/">
          <img class="logo" src="logo.svg" alt="">
          <span>
            <span class="nombre">Burbujas</span>
            <strong>Centro acuático</strong>
          </span>
        </a>

        <nav>
          @for (item of menu; track item.ruta) {
            <a [routerLink]="item.ruta" routerLinkActive="activo" [routerLinkActiveOptions]="{ exact: item.ruta === '/' }">
              <span class="icon">{{ item.icono }}</span>{{ item.texto }}
            </a>
          }
        </nav>

        <div class="ola" aria-hidden="true">
          <svg viewBox="0 0 240 80" preserveAspectRatio="none"><path d="M0 40 C 40 20, 80 60, 120 40 S 200 20, 240 40 V80 H0Z" fill="rgba(56,189,248,.10)"/><path d="M0 55 C 40 35, 80 75, 120 55 S 200 35, 240 55 V80 H0Z" fill="rgba(34,211,238,.10)"/></svg>
        </div>

        <div class="usuario">
          <app-avatar [nombre]="auth.usuario() ?? 'Admin'" [tam]="36" />
          <div class="grow">
            <div class="fw-6">{{ auth.usuario() }}</div>
            <div class="rol">Administrador</div>
          </div>
          <button class="salir" (click)="auth.salir()" title="Cerrar sesión" aria-label="Cerrar sesión"><span class="icon">logout</span></button>
        </div>
      </aside>

      <div class="velo" (click)="menuAbierto.set(false)"></div>

      <div class="contenido">
        <header class="barra-movil">
          <button class="btn-icon" (click)="menuAbierto.set(true)" aria-label="Abrir menú"><span class="icon">menu</span></button>
          <img src="logo.svg" alt="" width="28" height="28">
          <strong>Burbujas · Centro acuático</strong>
        </header>
        <router-outlet />
      </div>
    </div>
  `,
  styles: `
    .app { display: flex; min-height: 100vh; }
    .lateral {
      position: sticky; top: 0; height: 100vh; width: 248px; flex-shrink: 0;
      background: radial-gradient(120% 60% at 0% 0%, #1f5f99 0%, transparent 60%), var(--navy);
      color: #cbd5e1; display: flex; flex-direction: column; padding: 22px 16px; overflow: hidden;
    }
    .marca { display: flex; align-items: center; gap: 12px; color: #fff; padding: 4px 8px 26px; line-height: 1.15; }
    .marca strong { display: block; font-size: 12px; font-weight: 600; color: #9fd3f5; letter-spacing: .02em; }
    .marca .nombre { display: block; font-size: 20px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
    .logo { width: 48px; height: 48px; border-radius: 50%; background: #fff; padding: 2px; box-shadow: 0 4px 14px rgba(0,0,0,.25); }
    nav { display: flex; flex-direction: column; gap: 4px; }
    nav a {
      display: flex; align-items: center; gap: 12px; padding: 11px 14px; border-radius: 12px;
      color: #cbd5e1; font-weight: 600; transition: background .15s, color .15s;
    }
    nav a:hover { background: rgba(255,255,255,.06); color: #fff; }
    nav a.activo { background: linear-gradient(135deg, rgba(58,174,230,.25), rgba(40,120,190,.28)); color: #fff; box-shadow: inset 0 0 0 1px rgba(125,211,252,.18); }
    nav a.activo .icon { color: var(--sky); font-variation-settings: 'FILL' 1; }
    .ola { margin-top: auto; margin-left: -16px; margin-right: -16px; height: 80px; }
    .ola svg { width: 100%; height: 100%; display: block; }
    .usuario { display: flex; align-items: center; gap: 10px; padding: 12px; border-radius: 14px; background: rgba(255,255,255,.06); color: #fff; }
    .rol { font-size: 12px; color: #94a3b8; }
    .salir { background: none; border: 0; color: #94a3b8; cursor: pointer; width: 34px; height: 34px; border-radius: 10px; }
    .salir:hover { color: #fff; background: rgba(255,255,255,.08); }
    .contenido { flex: 1; min-width: 0; }
    .barra-movil, .velo { display: none; }

    @media (max-width: 960px) {
      .lateral { position: fixed; left: 0; z-index: 800; transform: translateX(-100%); transition: transform .25s ease; }
      .abierto .lateral { transform: none; box-shadow: var(--shadow-lg); }
      .abierto .velo { display: block; position: fixed; inset: 0; background: rgba(11,37,64,.4); z-index: 700; }
      .barra-movil {
        display: flex; align-items: center; gap: 8px; position: sticky; top: 0; z-index: 600;
        padding: 10px 12px; background: rgba(255,255,255,.9); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line);
      }
      .barra-movil .btn-icon { border: 0; cursor: pointer; }
    }
  `,
})
export class ShellComponent {
  auth = inject(AuthService);
  menuAbierto = signal(false);

  menu = [
    { ruta: '/', texto: 'Panel', icono: 'space_dashboard' },
    { ruta: '/alumnos', texto: 'Alumnos', icono: 'groups' },
    { ruta: '/horarios', texto: 'Horarios', icono: 'schedule' },
    { ruta: '/facturacion', texto: 'Facturación', icono: 'receipt_long' },
    { ruta: '/cuotas', texto: 'Cuotas', icono: 'sell' },
  ];

  constructor() {
    inject(Router).events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.menuAbierto.set(false));
  }
}
