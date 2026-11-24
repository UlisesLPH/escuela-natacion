import { Component, HostListener, inject } from '@angular/core';
import { UiService } from '../core/ui.service';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    @if (ui.pregunta(); as p) {
      <div class="velo" (click)="p.responder(false)">
        <div class="dialogo" role="alertdialog" aria-modal="true" [attr.aria-label]="p.titulo" (click)="$event.stopPropagation()">
          <div class="icono" [class.peligro]="p.peligro"><span class="icon">{{ p.peligro ? 'delete' : 'help' }}</span></div>
          <h2>{{ p.titulo }}</h2>
          <p>{{ p.mensaje }}</p>
          <div class="acciones">
            <button class="btn btn-ghost" (click)="p.responder(false)">Cancelar</button>
            <button class="btn" [class.btn-primary]="!p.peligro" [class.rojo]="p.peligro" (click)="p.responder(true)">{{ p.accion }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .velo { position: fixed; inset: 0; background: rgba(11, 37, 64, .45); backdrop-filter: blur(3px); z-index: 900; display: grid; place-items: center; padding: 16px; animation: aparece .15s; }
    .dialogo { background: #fff; border-radius: 20px; padding: 28px; width: min(420px, 100%); box-shadow: var(--shadow-lg); text-align: center; animation: sube .2s ease-out; }
    .icono { width: 56px; height: 56px; border-radius: 50%; display: grid; place-items: center; margin: 0 auto 14px; background: var(--brand-50); color: var(--brand); }
    .icono.peligro { background: #fee2e2; color: var(--red); }
    .icono .icon { font-size: 28px; }
    h2 { font-size: 19px; margin-bottom: 6px; }
    p { color: var(--muted); margin: 0 0 22px; }
    .acciones { display: flex; gap: 10px; justify-content: center; }
    .rojo { background: var(--red); color: #fff; }
    .rojo:hover { background: #b91c1c; }
    @keyframes aparece { from { opacity: 0; } }
    @keyframes sube { from { transform: translateY(12px) scale(.98); opacity: 0; } }
  `,
})
export class ConfirmDialogComponent {
  ui = inject(UiService);

  @HostListener('document:keydown.escape')
  cerrar(): void {
    this.ui.pregunta()?.responder(false);
  }
}
