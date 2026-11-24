import { Component, inject } from '@angular/core';
import { UiService } from '../core/ui.service';

@Component({
  selector: 'app-toasts',
  template: `
    <div class="pila" aria-live="polite">
      @for (t of ui.toasts(); track t.id) {
        <div class="toast" [class]="'toast t-' + t.tipo">
          <span class="icon">{{ t.tipo === 'ok' ? 'check_circle' : t.tipo === 'error' ? 'error' : 'info' }}</span>
          <span class="grow">{{ t.texto }}</span>
          <button class="btn-icon" (click)="ui.cerrarToast(t.id)" aria-label="Cerrar"><span class="icon">close</span></button>
        </div>
      }
    </div>
  `,
  styles: `
    .pila { position: fixed; right: 20px; bottom: 20px; z-index: 1000; display: flex; flex-direction: column; gap: 10px; max-width: min(420px, calc(100vw - 40px)); }
    .toast {
      display: flex; align-items: center; gap: 10px; padding: 10px 8px 10px 14px;
      background: var(--navy); color: #fff; border-radius: 14px; box-shadow: var(--shadow-lg);
      font-weight: 600; font-size: 14px; animation: entra .25s ease-out;
    }
    .toast .btn-icon { color: #cbd5e1; border: 0; cursor: pointer; width: 30px; height: 30px; }
    .toast .btn-icon:hover { background: rgba(255,255,255,.1); }
    .t-ok > .icon { color: #4ade80; }
    .t-error { background: #7f1d1d; } .t-error > .icon { color: #fca5a5; }
    .t-info > .icon { color: var(--sky); }
    @keyframes entra { from { transform: translateY(10px); opacity: 0; } }
  `,
})
export class ToastsComponent {
  ui = inject(UiService);
}
