import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { mensajeDeError } from '../core/auth';
import { Cuotas } from '../core/models';
import { UiService } from '../core/ui.service';

/** Cuotas de la escuela: inscripción y mensualidad que se proponen a los alumnos nuevos. */
@Component({
  selector: 'app-cuotas',
  imports: [FormsModule, CurrencyPipe],
  template: `
    <div class="page angosta">
      <div class="page-head">
        <div>
          <h1>Cuotas</h1>
          <div class="sub">Montos que se proponen al inscribir a un alumno nuevo.</div>
        </div>
      </div>

      @if (errores().length) {
        <div class="errores"><ul>@for (e of errores(); track e) { <li>{{ e }}</li> }</ul></div>
      }

      @if (vigentes(); as v) {
        <div class="tarjetas">
          <div class="card cuota">
            <span class="ico"><span class="icon">how_to_reg</span></span>
            <div>
              <div class="et">Inscripción</div>
              <div class="monto">{{ v.inscripcion | currency: 'MXN' : 'symbol-narrow' }}</div>
              <div class="muted small">Pago único al entrar</div>
            </div>
          </div>
          <div class="card cuota">
            <span class="ico"><span class="icon">calendar_month</span></span>
            <div>
              <div class="et">Mensualidad</div>
              <div class="monto">{{ v.mensualidad | currency: 'MXN' : 'symbol-narrow' }}</div>
              <div class="muted small">Cada mes, el día de su inscripción</div>
            </div>
          </div>
          <div class="card cuota destacada">
            <span class="ico"><span class="icon">payments</span></span>
            <div>
              <div class="et">Un alumno nuevo paga al entrar</div>
              <div class="monto">{{ v.inscripcion + v.mensualidad | currency: 'MXN' : 'symbol-narrow' }}</div>
              <div class="small">Inscripción + primera mensualidad</div>
            </div>
          </div>
        </div>

        <form class="card card-pad" (ngSubmit)="guardar()" #f="ngForm">
          <h2 class="section-title">Cambiar cuotas</h2>
          <div class="form-grid">
            <div class="field col-6">
              <label for="insc">Inscripción *</label>
              <div class="input-prefix"><span>$</span>
                <input class="input" type="number" min="0" step="0.01" id="insc" name="insc" [(ngModel)]="form.inscripcion" required></div>
            </div>
            <div class="field col-6">
              <label for="mens">Mensualidad *</label>
              <div class="input-prefix"><span>$</span>
                <input class="input" type="number" min="0" step="0.01" id="mens" name="mens" [(ngModel)]="form.mensualidad" required></div>
            </div>
          </div>
          <label class="switch mt-16">
            <input type="checkbox" name="todos" [(ngModel)]="aplicarATodos"><span class="track"></span>
            Aplicar la nueva mensualidad también a los alumnos activos
          </label>
          <p class="muted small">
            {{ aplicarATodos
              ? 'Se cambiará la mensualidad de todos los alumnos activos.'
              : 'Los alumnos actuales conservan su mensualidad; el cambio aplica a los que se inscriban a partir de ahora.' }}
          </p>
          <div class="row fin">
            <button type="button" class="btn btn-ghost" (click)="restablecer()">Deshacer cambios</button>
            <button class="btn btn-primary" [disabled]="guardando() || !f.valid"><span class="icon">save</span> Guardar cuotas</button>
          </div>
        </form>
      } @else {
        <div class="skeleton" style="height: 360px"></div>
      }
    </div>
  `,
  styles: `
    .angosta { max-width: 900px; }
    .tarjetas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
    .cuota { display: flex; gap: 14px; padding: 18px; }
    .ico { width: 46px; height: 46px; border-radius: 14px; background: var(--brand-50); color: var(--brand); display: grid; place-items: center; flex-shrink: 0; }
    .ico .icon { font-size: 24px; }
    .et { font-size: 13px; color: var(--muted); font-weight: 600; }
    .monto { font-size: 28px; font-weight: 800; line-height: 1.2; }
    .destacada { background: linear-gradient(135deg, var(--brand), #3aaee6); border: 0; color: #fff; }
    .destacada .et, .destacada .small { color: #e0f2fe; }
    .destacada .ico { background: rgba(255,255,255,.18); color: #fff; }
    .fin { justify-content: flex-end; margin-top: 8px; }
    @media (max-width: 800px) { .tarjetas { grid-template-columns: 1fr; } }
  `,
})
export class CuotasComponent implements OnInit {
  private api = inject(ApiService);
  private ui = inject(UiService);

  vigentes = signal<Cuotas | null>(null);
  errores = signal<string[]>([]);
  guardando = signal(false);
  form: Cuotas = { inscripcion: 0, mensualidad: 0 };
  aplicarATodos = false;

  ngOnInit(): void {
    this.api.cuotas().subscribe((c) => {
      this.vigentes.set(c);
      this.restablecer();
    });
  }

  restablecer(): void {
    const v = this.vigentes();
    if (v) this.form = { inscripcion: v.inscripcion, mensualidad: v.mensualidad };
    this.aplicarATodos = false;
    this.errores.set([]);
  }

  guardar(): void {
    this.guardando.set(true);
    this.errores.set([]);
    this.api.guardarCuotas(this.form, this.aplicarATodos).subscribe({
      next: (c) => {
        this.vigentes.set(c);
        this.guardando.set(false);
        const extra = this.aplicarATodos ? ` Se actualizó la mensualidad de ${c.actualizados ?? 0} alumno(s).` : '';
        this.ui.avisar(`Cuotas guardadas.${extra}`);
        this.restablecer();
      },
      error: (e) => {
        this.errores.set(mensajeDeError(e));
        this.guardando.set(false);
      },
    });
  }
}
