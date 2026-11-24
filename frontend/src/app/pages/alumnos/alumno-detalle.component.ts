import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { mensajeDeError } from '../../core/auth';
import { Estudiante, cuandoPaga } from '../../core/models';
import { UiService } from '../../core/ui.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { EstadoPillComponent } from '../../shared/estado-pill.component';

@Component({
  selector: 'app-alumno-detalle',
  imports: [RouterLink, DatePipe, CurrencyPipe, AvatarComponent, EstadoPillComponent],
  template: `
    <div class="page">
      <a class="back" routerLink="/alumnos"><span class="icon">arrow_back</span> Alumnos</a>

      @if (alumno(); as a) {
        <section class="card portada">
          <app-avatar [nombre]="a.nombre_completo" [tam]="84" />
          <div class="grow">
            <div class="row wrap">
              <h1>{{ a.nombre_completo }}</h1>
              @if (!a.activo) { <span class="pill tono-idle">Inactivo</span> }
            </div>
            <div class="meta">
              @if (a.edad !== null) { <span><span class="icon">cake</span> {{ a.edad }} años</span> }
              @if (a.tutor) { <span><span class="icon">family_restroom</span> {{ a.tutor }}</span> }
              <span><span class="icon">calendar_today</span> Alta: {{ a.creado | date: "d 'de' MMM y" }}</span>
            </div>
          </div>
          <div class="row acciones">
            <a class="btn btn-ghost" [routerLink]="['/alumnos', a.id, 'editar']"><span class="icon">edit</span> Editar</a>
            <button class="btn btn-danger" (click)="eliminar(a)"><span class="icon">delete</span> Eliminar</button>
          </div>
        </section>

        <div class="cols">
          <div class="izq">
            <section class="card pago" [class]="'card pago tono-borde-' + a.estado">
              <div class="cal">
                <span>{{ a.proximo_pago | date: 'MMMM' }}</span>
                <strong>{{ a.proximo_pago | date: 'd' }}</strong>
                <em>{{ a.proximo_pago | date: 'EEEE' }}</em>
              </div>
              <div class="grow">
                <div class="et">Próxima fecha de pago</div>
                <div class="grande">{{ cuando(a.dias_para_pago) }}</div>
                <div class="muted">Le toca pagar el <strong>día {{ a.dia_pago }}</strong> de cada mes
                  @if (a.dia_pago > 28) { <span class="small">(en meses más cortos, el último día)</span> }
                </div>
                <div class="row mt-16 wrap">
                  @if (a.activo) { <app-estado [estado]="a.estado" /> }
                  <span class="tag tag-muted"><span class="icon">payments</span>{{ a.mensualidad | currency: 'MXN' : 'symbol-narrow' }} al mes</span>
                </div>
              </div>
            </section>

            <section class="card">
              <div class="card-head"><h2><span class="icon">schedule</span> Horarios</h2>
                <a class="small fw-6" [routerLink]="['/alumnos', a.id, 'editar']">Cambiar</a></div>
              @if (a.horarios.length) {
                <ul class="horarios">
                  @for (h of a.horarios; track h.id) {
                    <li>
                      <a [routerLink]="['/horarios', h.id]">
                        <span class="reloj"><span class="icon">pool</span></span>
                        <div class="grow">
                          <div class="fw-6">{{ h.nombre }} @if (h.nivel) { <span class="tag">{{ h.nivel }}</span> }</div>
                          <div class="muted small">{{ h.dias_texto }}</div>
                        </div>
                        <strong class="rango">{{ h.rango }}</strong>
                      </a>
                    </li>
                  }
                </ul>
              } @else {
                <div class="vacio"><span class="icon">event_busy</span><h3>Sin horario</h3><p>Asígnale un horario desde «Editar».</p></div>
              }
            </section>
          </div>

          <section class="card contacto">
            <div class="card-head"><h2><span class="icon">contact_page</span> Contacto</h2></div>
            <dl>
              <div><dt>Padre, madre o tutor</dt><dd>{{ a.tutor || '—' }}</dd></div>
              <div><dt>Teléfono</dt><dd>
                @if (a.telefono) { <a [href]="'tel:' + a.telefono">{{ a.telefono }}</a> } @else { — }
              </dd></div>
              <div><dt>Correo</dt><dd>
                @if (a.email) { <a [href]="'mailto:' + a.email">{{ a.email }}</a> } @else { — }
              </dd></div>
              <div><dt>Fecha de nacimiento</dt><dd>{{ a.fecha_nacimiento ? (a.fecha_nacimiento | date: "d 'de' MMMM 'de' y") : '—' }}</dd></div>
              <div><dt>Notas</dt><dd class="notas">{{ a.notas || 'Sin notas' }}</dd></div>
            </dl>
          </section>
        </div>
      } @else if (error()) {
        <div class="card vacio"><span class="icon">person_off</span><h3>No encontramos a este alumno</h3><p>{{ error() }}</p>
          <a class="btn btn-ghost" routerLink="/alumnos">Volver a la lista</a></div>
      } @else {
        <div class="skeleton" style="height: 130px; margin-bottom: 20px"></div>
        <div class="cols"><div class="skeleton" style="height: 300px"></div><div class="skeleton" style="height: 300px"></div></div>
      }
    </div>
  `,
  styles: `
    .portada { display: flex; align-items: center; gap: 20px; padding: 24px; margin-bottom: 20px; flex-wrap: wrap;
      background: linear-gradient(120deg, #fff 55%, var(--brand-50)); }
    .portada h1 { font-size: 26px; font-weight: 800; }
    .meta { display: flex; gap: 16px; flex-wrap: wrap; color: var(--muted); margin-top: 6px; font-size: 14px; }
    .meta > span { display: inline-flex; align-items: center; gap: 6px; }
    .meta .icon { font-size: 18px; }
    .cols { display: grid; grid-template-columns: 1.3fr 1fr; gap: 20px; align-items: start; }
    .izq { display: flex; flex-direction: column; gap: 20px; }
    .pago { display: flex; gap: 22px; padding: 22px; align-items: center; border-left: 5px solid var(--line); }
    .tono-borde-hoy { border-left-color: #fbbf24; } .tono-borde-pronto { border-left-color: var(--sky); }
    .cal { width: 104px; flex-shrink: 0; text-align: center; border-radius: 18px; overflow: hidden; border: 1px solid var(--line); box-shadow: var(--shadow); background: #fff; }
    .cal span { display: block; padding: 6px 0; background: linear-gradient(135deg, var(--brand), #0891b2); color: #fff; font-weight: 800; text-transform: uppercase; font-size: 12px; letter-spacing: .08em; }
    .cal strong { display: block; font-size: 42px; line-height: 1.1; padding-top: 6px; }
    .cal em { display: block; font-style: normal; color: var(--muted); font-size: 12px; padding-bottom: 8px; text-transform: capitalize; }
    .et { font-size: 13px; color: var(--muted); font-weight: 600; }
    .grande { font-size: 28px; font-weight: 800; margin: 2px 0 4px; }
    .horarios { list-style: none; margin: 0; padding: 6px 0; }
    .horarios li + li { border-top: 1px solid var(--line); }
    .horarios a { display: flex; align-items: center; gap: 14px; padding: 12px 20px; color: inherit; }
    .horarios a:hover { background: #f7fbfd; }
    .reloj { width: 40px; height: 40px; border-radius: 12px; background: var(--brand-50); color: var(--brand); display: grid; place-items: center; }
    .rango { font-variant-numeric: tabular-nums; }
    dl { margin: 0; padding: 8px 20px 16px; }
    dl > div { padding: 12px 0; border-bottom: 1px solid var(--line); }
    dl > div:last-child { border-bottom: 0; }
    dt { font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; }
    dd { margin: 4px 0 0; font-weight: 600; }
    .notas { white-space: pre-line; font-weight: 500; }
    .vacio .btn { margin-top: 12px; }
    @media (max-width: 960px) { .cols { grid-template-columns: 1fr; } }
    @media (max-width: 560px) { .pago { flex-direction: column; text-align: center; } .pago .row { justify-content: center; } }
  `,
})
export class AlumnoDetalleComponent implements OnInit {
  private api = inject(ApiService);
  private ui = inject(UiService);
  private router = inject(Router);

  id = input.required<string>();
  alumno = signal<Estudiante | null>(null);
  error = signal('');
  cuando = cuandoPaga;

  ngOnInit(): void {
    this.api.estudiante(Number(this.id())).subscribe({
      next: (a) => this.alumno.set(a),
      error: (e) => this.error.set(mensajeDeError(e)[0]),
    });
  }

  async eliminar(a: Estudiante): Promise<void> {
    const si = await this.ui.confirmar(`¿Eliminar a ${a.nombre_completo}?`,
      'Se borrará su registro y dejará de aparecer en sus horarios. Si solo dejó de venir, mejor márcalo como inactivo.');
    if (!si) return;
    this.api.eliminarEstudiante(a.id).subscribe({
      next: () => {
        this.ui.avisar(`${a.nombre_completo} fue eliminado.`);
        this.router.navigate(['/alumnos']);
      },
      error: (e) => this.ui.avisar(mensajeDeError(e)[0], 'error'),
    });
  }
}
