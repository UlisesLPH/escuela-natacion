import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { PorFacturar, cuandoPaga, textoFactura } from '../core/models';
import { UiService } from '../core/ui.service';
import { AvatarComponent } from '../shared/avatar.component';

type Vista = 'hoy' | 'semana' | 'todos';

/**
 * Pagos de alumnos que piden factura: a quién facturar, el concepto y el importe.
 * La app no emite el CFDI; los datos se copian para capturarlos en el portal de facturación.
 */
@Component({
  selector: 'app-facturacion',
  imports: [RouterLink, CurrencyPipe, DatePipe, AvatarComponent],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>Facturación</h1>
          <div class="sub">Alumnos que piden factura, con el pago que toca facturar. Copia los datos y captúralos en tu portal de facturación.</div>
        </div>
      </div>

      <div class="pestanas card">
        <button [class.sel]="vista() === 'hoy'" (click)="vista.set('hoy')">Hoy <span class="n">{{ hoy().length }}</span></button>
        <button [class.sel]="vista() === 'semana'" (click)="vista.set('semana')">Próximos 7 días <span class="n">{{ semana().length }}</span></button>
        <button [class.sel]="vista() === 'todos'" (click)="vista.set('todos')">Todos con factura <span class="n">{{ todos().length }}</span></button>
      </div>

      @if (cargando()) {
        <div class="skeleton" style="height: 260px"></div>
      } @else if (!lista().length) {
        <div class="card vacio">
          <span class="icon">receipt_long</span>
          <h3>{{ todos().length ? 'Nada por facturar ' + (vista() === 'hoy' ? 'hoy' : 'en los próximos 7 días') : 'Ningún alumno pide factura' }}</h3>
          <p>{{ todos().length ? 'Revisa la pestaña «Todos con factura».' : 'Activa «Requiere factura» en la ficha del alumno y captura sus datos fiscales.' }}</p>
        </div>
      } @else {
        <div class="lista">
          @for (p of lista(); track p.estudiante_id) {
            <article class="card pago">
              <div class="cab">
                <div class="fecha" [class.hoy]="p.cuando === 'hoy'">
                  <span>{{ p.fecha + 'T00:00' | date: 'MMM' }}</span>
                  <strong>{{ p.fecha + 'T00:00' | date: 'd' }}</strong>
                </div>
                <div class="grow">
                  <a class="fw-6 nombre" [routerLink]="['/alumnos', p.estudiante_id]">{{ p.alumno }}</a>
                  <div class="muted small">{{ p.concepto }} · {{ cuando(p.dias) }}</div>
                </div>
                <div class="importe">{{ p.importe | currency: 'MXN' : 'symbol-narrow' }}</div>
              </div>
              <div class="datos">
                <div><span>RFC</span><strong>{{ p.factura.rfc }}</strong></div>
                <div><span>Código postal</span><strong>{{ p.factura.codigo_postal }}</strong></div>
                <div class="ancho"><span>Nombre o razón social</span><strong>{{ p.factura.razon_social }}</strong></div>
                <div class="ancho"><span>Régimen fiscal</span><strong>{{ p.factura.regimen_fiscal }} · {{ p.factura.regimen_texto }}</strong></div>
                <div class="ancho"><span>Uso de CFDI</span><strong>{{ p.factura.uso_cfdi }} · {{ p.factura.uso_texto }}</strong></div>
                <div class="ancho"><span>Correo electrónico</span><strong>{{ p.factura.correo }}</strong></div>
              </div>
              <div class="pie">
                <app-avatar [nombre]="p.alumno" [tam]="26" />
                <span class="muted small grow">Persona {{ p.factura.tipo_persona === 'moral' ? 'moral' : 'física' }}</span>
                <button class="btn btn-sm btn-ghost" (click)="copiar(p)"><span class="icon">content_copy</span> Copiar datos</button>
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .pestanas { display: flex; gap: 4px; padding: 6px; margin-bottom: 20px; overflow-x: auto; }
    .pestanas button { flex: 1; white-space: nowrap; border: 0; background: none; height: 38px; padding: 0 14px; border-radius: 10px; font: 600 13px var(--font); color: var(--ink-2); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
    .pestanas button:hover { background: var(--surface-2); }
    .pestanas button.sel { background: var(--navy); color: #fff; }
    .n { font-size: 11px; min-width: 20px; height: 20px; border-radius: 999px; background: var(--idle-bg); color: var(--idle); display: inline-grid; place-items: center; padding: 0 5px; }
    .sel .n { background: rgba(255,255,255,.18); color: #fff; }
    .lista { display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: 16px; }
    .pago { padding: 18px; display: flex; flex-direction: column; gap: 14px; }
    .cab { display: flex; gap: 12px; align-items: center; }
    .nombre { color: var(--ink); font-size: 16px; }
    .importe { font-size: 20px; font-weight: 800; white-space: nowrap; }
    .fecha { width: 48px; flex-shrink: 0; text-align: center; border-radius: 12px; border: 1px solid var(--line); overflow: hidden; }
    .fecha span { display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; background: var(--brand-50); color: var(--brand-600); padding: 2px 0; }
    .fecha strong { display: block; font-size: 19px; padding: 2px 0 3px; }
    .fecha.hoy { border-color: #fcd34d; }
    .fecha.hoy span { background: var(--warn-bg); color: var(--warn); }
    .datos { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; padding: 14px; border-radius: 12px; background: var(--surface-2); border: 1px solid var(--line); }
    .datos div { display: flex; flex-direction: column; min-width: 0; }
    .datos .ancho { grid-column: span 2; }
    .datos span { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); }
    .datos strong { font-size: 14px; overflow-wrap: anywhere; }
    .pie { display: flex; align-items: center; gap: 8px; }
    @media (max-width: 560px) { .lista { grid-template-columns: 1fr; } .datos { grid-template-columns: 1fr; } .datos .ancho { grid-column: span 1; } }
  `,
})
export class FacturacionComponent implements OnInit {
  private api = inject(ApiService);
  private ui = inject(UiService);
  private moneda = new CurrencyPipe('es-MX');

  todos = signal<PorFacturar[]>([]);
  cargando = signal(true);
  vista = signal<Vista>('hoy');
  cuando = cuandoPaga;

  hoy = computed(() => this.todos().filter((p) => p.dias === 0));
  semana = computed(() => this.todos().filter((p) => p.dias <= 7));
  lista = computed(() => {
    const v = this.vista();
    return v === 'hoy' ? this.hoy() : v === 'semana' ? this.semana() : this.todos();
  });

  ngOnInit(): void {
    this.api.facturacion().subscribe({
      next: (l) => {
        this.todos.set(l);
        this.cargando.set(false);
        if (!this.hoy().length) this.vista.set(this.semana().length ? 'semana' : 'todos');
      },
      error: () => this.cargando.set(false),
    });
  }

  async copiar(p: PorFacturar): Promise<void> {
    const importe = this.moneda.transform(p.importe, 'MXN', 'symbol-narrow') ?? String(p.importe);
    try {
      await navigator.clipboard.writeText(textoFactura(p.factura, p.concepto, importe));
      this.ui.avisar(`Datos de ${p.alumno} copiados.`);
    } catch {
      this.ui.avisar('No se pudo copiar. Selecciona el texto y cópialo a mano.', 'error');
    }
  }
}
