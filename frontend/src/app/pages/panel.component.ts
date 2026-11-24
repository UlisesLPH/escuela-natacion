import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth';
import { Panel, cuandoPaga } from '../core/models';
import { AvatarComponent } from '../shared/avatar.component';
import { EstadoPillComponent } from '../shared/estado-pill.component';

@Component({
  selector: 'app-panel',
  imports: [RouterLink, CurrencyPipe, DatePipe, AvatarComponent, EstadoPillComponent],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>{{ saludo() }}, {{ auth.usuario() }} 👋</h1>
          <div class="sub">{{ hoy | date: "EEEE d 'de' MMMM 'de' y" }}</div>
        </div>
        <div class="row wrap">
          <a class="btn btn-ghost" routerLink="/horarios/nuevo"><span class="icon">more_time</span> Nuevo horario</a>
          <a class="btn btn-primary" routerLink="/alumnos/nuevo"><span class="icon">person_add</span> Nuevo alumno</a>
        </div>
      </div>

      @if (datos(); as d) {
        <div class="kpis">
          <a class="kpi card" routerLink="/alumnos">
            <span class="ico azul"><span class="icon">groups</span></span>
            <div><div class="et">Alumnos activos</div><div class="val">{{ d.activos }}</div><div class="det">en {{ d.horarios }} horario(s)</div></div>
          </a>
          <a class="kpi card" routerLink="/alumnos" [queryParams]="{ estado: 'hoy' }">
            <span class="ico ambar"><span class="icon">notifications_active</span></span>
            <div><div class="et">Les toca pagar hoy</div><div class="val">{{ d.pagan_hoy }}</div><div class="det">{{ hoy | date: "d 'de' MMMM" }}</div></div>
          </a>
          <a class="kpi card" routerLink="/alumnos" [queryParams]="{ estado: 'pronto' }">
            <span class="ico cielo"><span class="icon">event_upcoming</span></span>
            <div><div class="et">Pagan en los próximos 7 días</div><div class="val">{{ d.pagan_pronto }}</div><div class="det">sin contar hoy</div></div>
          </a>
          <div class="kpi card">
            <span class="ico agua"><span class="icon">savings</span></span>
            <div><div class="et">Mensualidades al mes</div><div class="val">{{ d.ingreso_mensual | currency: 'MXN' : 'symbol-narrow' : '1.0-0' }}</div><div class="det">suma de alumnos activos</div></div>
          </div>
        </div>

        <div class="cols">
          <section class="card">
            <div class="card-head">
              <h2><span class="icon">pool</span> Clases de hoy</h2>
              <a class="small fw-6" routerLink="/horarios">Ver horarios</a>
            </div>
            @if (d.clases_hoy.length) {
              <ol class="linea">
                @for (c of d.clases_hoy; track c.id) {
                  <li>
                    <div class="hora">{{ c.hora_inicio }}<span>{{ c.hora_fin }}</span></div>
                    <a class="clase" [routerLink]="['/horarios', c.id]">
                      <div class="row">
                        <strong class="grow">{{ c.nombre }}</strong>
                        @if (c.nivel) { <span class="tag">{{ c.nivel }}</span> }
                      </div>
                      <div class="muted small">{{ c.instructor || 'Sin instructor asignado' }}</div>
                      <div class="row mt-8">
                        <div class="caras">
                          @for (a of c.alumnos.slice(0, 5); track a.id) { <app-avatar [nombre]="a.nombre_completo" [tam]="28" /> }
                          @if (c.alumnos.length > 5) { <span class="mas">+{{ c.alumnos.length - 5 }}</span> }
                        </div>
                        <span class="grow"></span>
                        <span class="small fw-6" [class.lleno]="c.lleno">{{ c.ocupados }}/{{ c.cupo }} lugares</span>
                      </div>
                    </a>
                  </li>
                }
              </ol>
            } @else {
              <div class="vacio"><span class="icon">beach_access</span><h3>Hoy no hay clases</h3><p>No hay horarios programados para este día.</p></div>
            }
          </section>

          <section class="card">
            <div class="card-head">
              <h2><span class="icon">calendar_month</span> Próximas fechas de pago</h2>
              <span class="tag tag-muted">7 días</span>
            </div>
            @if (d.proximos_pagos.length) {
              <ul class="pagos">
                @for (e of d.proximos_pagos; track e.id) {
                  <li>
                    <a class="row grow" [routerLink]="['/alumnos', e.id]">
                      <div class="fecha" [class.hoy]="e.estado === 'hoy'">
                        <span>{{ e.proximo_pago | date: 'MMM' }}</span>
                        <strong>{{ e.proximo_pago | date: 'd' }}</strong>
                      </div>
                      <app-avatar [nombre]="e.nombre_completo" [tam]="34" />
                      <div class="grow nombre">
                        <div class="fw-6">{{ e.nombre_completo }}</div>
                        <div class="muted small">{{ cuando(e.dias_para_pago) }} · {{ e.mensualidad | currency: 'MXN' : 'symbol-narrow' : '1.0-0' }}</div>
                      </div>
                      <app-estado [estado]="e.estado" />
                    </a>
                  </li>
                }
              </ul>
            } @else {
              <div class="vacio"><span class="icon">event_available</span><h3>Semana tranquila</h3><p>A ningún alumno le toca pagar en los próximos 7 días.</p></div>
            }
          </section>
        </div>
      } @else {
        <div class="kpis">@for (i of [1, 2, 3, 4]; track i) { <div class="skeleton" style="height: 108px"></div> }</div>
        <div class="cols"><div class="skeleton" style="height: 320px"></div><div class="skeleton" style="height: 320px"></div></div>
      }
    </div>
  `,
  styles: `
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .kpi { display: flex; gap: 14px; padding: 18px; color: inherit; transition: transform .15s, box-shadow .15s; }
    a.kpi:hover { transform: translateY(-2px); color: inherit; }
    .ico { width: 46px; height: 46px; border-radius: 14px; display: grid; place-items: center; flex-shrink: 0; }
    .ico .icon { font-size: 24px; }
    .azul { background: #e0f2fe; color: #0369a1; } .ambar { background: var(--warn-bg); color: var(--warn); }
    .cielo { background: #e0f2fe; color: var(--info); } .agua { background: #cffafe; color: var(--brand-600); }
    .et { font-size: 13px; color: var(--muted); font-weight: 600; }
    .val { font-size: 28px; font-weight: 800; line-height: 1.2; }
    .det { font-size: 12px; color: var(--muted); }
    .cols { display: grid; grid-template-columns: 1.1fr 1fr; gap: 20px; align-items: start; }
    .linea { list-style: none; margin: 0; padding: 12px 20px 20px; }
    .linea li { display: flex; gap: 16px; padding-top: 12px; }
    .hora { width: 52px; flex-shrink: 0; font-weight: 800; font-size: 15px; text-align: right; padding-top: 12px; }
    .hora span { display: block; font-size: 12px; color: var(--muted); font-weight: 600; }
    .clase { flex: 1; display: block; padding: 12px 14px; border-radius: 14px; border: 1px solid var(--line); border-left: 4px solid var(--sky); color: inherit; background: var(--surface-2); transition: background .15s; }
    .clase:hover { background: var(--brand-50); color: inherit; }
    .mt-8 { margin-top: 8px; }
    .caras { display: flex; } .caras app-avatar { margin-right: -8px; border: 2px solid #fff; border-radius: 50%; }
    .mas { margin-left: 12px; font-size: 12px; color: var(--muted); font-weight: 700; align-self: center; }
    .lleno { color: var(--red); }
    .pagos { list-style: none; margin: 0; padding: 6px 0; }
    .pagos li + li { border-top: 1px solid var(--line); }
    .pagos a { color: inherit; padding: 10px 20px; gap: 12px; min-width: 0; }
    .pagos a:hover { background: #f7fbfd; }
    .nombre { min-width: 0; }
    .fecha { width: 46px; flex-shrink: 0; text-align: center; border-radius: 12px; border: 1px solid var(--line); overflow: hidden; background: #fff; }
    .fecha span { display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; background: var(--brand-50); color: var(--brand-600); padding: 2px 0; }
    .fecha strong { display: block; font-size: 18px; padding: 2px 0 3px; }
    .fecha.hoy { border-color: #fcd34d; }
    .fecha.hoy span { background: var(--warn-bg); color: var(--warn); }
    @media (max-width: 1100px) { .kpis { grid-template-columns: repeat(2, 1fr); } .cols { grid-template-columns: 1fr; } }
    @media (max-width: 560px) { .kpis { grid-template-columns: 1fr; } .pagos app-estado { display: none; } }
  `,
})
export class PanelComponent {
  private api = inject(ApiService);
  auth = inject(AuthService);

  hoy = new Date();
  datos = signal<Panel | null>(null);
  cuando = cuandoPaga;
  saludo = computed(() => {
    const h = this.hoy.getHours();
    return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  });

  constructor() {
    this.api.panel().subscribe((d) => this.datos.set(d));
  }
}
