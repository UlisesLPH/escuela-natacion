import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, mensajeDeError } from '../core/auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <div class="login">
      <section class="hero">
        <div class="hero-txt">
          <span class="chip"><span class="icon">pool</span> Panel de administración</span>
          <h1>Cada brazada,<br>bien organizada.</h1>
          <p>Alumnos, horarios y mensualidades de tu escuela de natación en un solo lugar.</p>
        </div>
        <svg class="olas" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
          <path fill="rgba(56,189,248,.18)" d="M0,192L60,186.7C120,181,240,171,360,181.3C480,192,600,224,720,218.7C840,213,960,171,1080,160C1200,149,1320,171,1380,181.3L1440,192L1440,320L0,320Z"/>
          <path fill="rgba(34,211,238,.20)" d="M0,256L80,240C160,224,320,192,480,197.3C640,203,800,245,960,256C1120,267,1280,245,1360,234.7L1440,224L1440,320L0,320Z"/>
          <path fill="rgba(255,255,255,.07)" d="M0,288L120,282.7C240,277,480,267,720,272C960,277,1200,299,1320,309.3L1440,320L0,320Z"/>
        </svg>
      </section>

      <section class="panel">
        <form class="caja" (ngSubmit)="entrar()" #f="ngForm">
          <div class="logo">
            <svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="18" fill="#0b2540"/><path d="M10 37c5 0 5-4 11-4s6 4 11 4 5-4 11-4 6 4 11 4" fill="none" stroke="#38bdf8" stroke-width="5" stroke-linecap="round"/><path d="M10 47c5 0 5-4 11-4s6 4 11 4 5-4 11-4 6 4 11 4" fill="none" stroke="#22d3ee" stroke-width="5" stroke-linecap="round" opacity=".6"/><circle cx="40" cy="20" r="6" fill="#fff"/></svg>
          </div>
          <h2>Bienvenido de vuelta</h2>
          <p class="muted">Entra con tu cuenta de administrador.</p>

          @if (error()) {
            <div class="errores">{{ error() }}</div>
          }

          <div class="field">
            <label for="usuario">Usuario</label>
            <div class="input-icon">
              <span class="icon">person</span>
              <input class="input" id="usuario" name="usuario" [(ngModel)]="usuario" required autocomplete="username" autofocus>
            </div>
          </div>
          <div class="field">
            <label for="password">Contraseña</label>
            <div class="input-icon">
              <span class="icon">lock</span>
              <input class="input" id="password" name="password" [type]="ver() ? 'text' : 'password'" [(ngModel)]="password" required autocomplete="current-password">
              <button type="button" class="ojo" (click)="ver.set(!ver())" [attr.aria-label]="ver() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                <span class="icon">{{ ver() ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
          </div>
          <button class="btn btn-primary entrar" [disabled]="cargando() || !f.valid">
            @if (cargando()) { <span class="giro"></span> Entrando… } @else { Entrar <span class="icon">arrow_forward</span> }
          </button>
        </form>
      </section>
    </div>
  `,
  styles: `
    .login { display: grid; grid-template-columns: 1.1fr 1fr; min-height: 100vh; }
    .hero {
      position: relative; overflow: hidden; color: #fff; display: flex; align-items: center; padding: 64px;
      background: radial-gradient(80% 60% at 20% 10%, #1d6fa5 0%, transparent 60%), linear-gradient(160deg, #0b2540 0%, #0e3a5f 55%, #0e7490 100%);
    }
    .hero-txt { position: relative; z-index: 1; max-width: 480px; }
    .chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; background: rgba(255,255,255,.1); font-size: 13px; font-weight: 600; color: #bae6fd; }
    .chip .icon { font-size: 18px; }
    h1 { font-size: clamp(34px, 4vw, 52px); line-height: 1.05; font-weight: 800; margin: 22px 0 16px; letter-spacing: -.02em; }
    .hero p { color: #cbd5e1; font-size: 17px; margin: 0; }
    .olas { position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 45%; }
    .panel { display: grid; place-items: center; padding: 32px 20px; }
    .caja { width: min(400px, 100%); display: flex; flex-direction: column; gap: 16px; }
    .logo svg { width: 54px; height: 54px; }
    h2 { font-size: 26px; font-weight: 800; }
    .caja > p { margin: -10px 0 6px; }
    .ojo { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); background: none; border: 0; color: var(--muted); cursor: pointer; width: 34px; height: 34px; border-radius: 8px; }
    .ojo .icon { position: static; transform: none; }
    .entrar { height: 46px; margin-top: 6px; font-size: 15px; }
    .errores { margin: 0; }
    .giro { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: gira .7s linear infinite; }
    @keyframes gira { to { transform: rotate(360deg); } }
    @media (max-width: 860px) {
      .login { grid-template-columns: 1fr; }
      .hero { padding: 40px 24px 90px; min-height: 260px; }
      h1 { font-size: 32px; }
    }
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  usuario = '';
  password = '';
  ver = signal(false);
  cargando = signal(false);
  error = signal('');

  constructor() {
    if (this.auth.autenticado()) this.router.navigate(['/']);
  }

  entrar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.auth.login(this.usuario.trim(), this.password).subscribe({
      next: () => this.router.navigate(['/']),
      error: (e) => {
        this.error.set(mensajeDeError(e)[0]);
        this.cargando.set(false);
      },
    });
  }
}
