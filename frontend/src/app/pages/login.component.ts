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
          <div class="emblema"><img src="logo.svg" alt="Logo de Burbujas"></div>
          <div class="marca">Burbujas</div>
          <div class="lema">Centro acuático</div>
          <p>Alumnos, horarios y fechas de pago en un solo lugar.</p>
        </div>
        <svg class="olas" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
          <path fill="rgba(58,174,230,.20)" d="M0,192L60,186.7C120,181,240,171,360,181.3C480,192,600,224,720,218.7C840,213,960,171,1080,160C1200,149,1320,171,1380,181.3L1440,192L1440,320L0,320Z"/>
          <path fill="rgba(111,208,247,.20)" d="M0,256L80,240C160,224,320,192,480,197.3C640,203,800,245,960,256C1120,267,1280,245,1360,234.7L1440,224L1440,320L0,320Z"/>
          <path fill="rgba(255,255,255,.07)" d="M0,288L120,282.7C240,277,480,267,720,272C960,277,1200,299,1320,309.3L1440,320L0,320Z"/>
        </svg>
      </section>

      <section class="panel">
        <form class="caja" (ngSubmit)="entrar()" #f="ngForm">
          <img class="logo" src="logo.svg" alt="">
          <h2>Bienvenido de vuelta</h2>
          <p class="muted">Entra con tu cuenta de administrador de Burbujas.</p>

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
      background: radial-gradient(80% 60% at 20% 10%, #2b7fc4 0%, transparent 60%), linear-gradient(160deg, #0d2a4a 0%, #1f5f99 55%, #2f9fdc 100%);
    }
    .hero-txt { position: relative; z-index: 1; max-width: 480px; }
    .emblema { width: 132px; height: 132px; border-radius: 50%; background: #fff; padding: 6px; box-shadow: 0 18px 40px rgba(0,0,0,.25); }
    .emblema img { width: 100%; height: 100%; display: block; }
    .marca { font-size: clamp(38px, 4.4vw, 58px); font-weight: 800; letter-spacing: .14em; text-transform: uppercase; margin-top: 24px; line-height: 1; }
    .lema { font-size: 22px; font-weight: 600; color: #bfe6fb; margin: 8px 0 18px; }
    .hero p { color: #cbd5e1; font-size: 17px; margin: 0; }
    .olas { position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 45%; }
    .panel { display: grid; place-items: center; padding: 32px 20px; }
    .caja { width: min(400px, 100%); display: flex; flex-direction: column; gap: 16px; }
    .logo { width: 60px; height: 60px; }
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
      .hero { padding: 36px 24px 90px; min-height: 260px; }
      .emblema { width: 92px; height: 92px; }
      .marca { font-size: 34px; }
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
