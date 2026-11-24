import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ESTADOS, EstadoPago, Estudiante, Horario, ORDEN_ESTADOS, cuandoPaga } from '../../core/models';
import { AvatarComponent } from '../../shared/avatar.component';
import { EstadoPillComponent } from '../../shared/estado-pill.component';

type Vista = 'tarjetas' | 'tabla';
type Orden = 'proximo' | 'nombre' | 'dia_pago';

const CLAVE_VISTA = 'natacion.vista-alumnos';

@Component({
  selector: 'app-alumnos-lista',
  imports: [FormsModule, RouterLink, CurrencyPipe, DatePipe, AvatarComponent, EstadoPillComponent],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>Alumnos</h1>
          <div class="sub">
            @if (cargando()) { Cargando… } @else {
              {{ activos() }} alumno(s) activo(s){{ verInactivos() ? ' · ' + (todos().length - activos()) + ' inactivo(s)' : '' }}
            }
          </div>
        </div>
        <a class="btn btn-primary" routerLink="/alumnos/nuevo"><span class="icon">person_add</span> Nuevo alumno</a>
      </div>

      <!-- Barra de herramientas -->
      <div class="card herramientas">
        <div class="input-icon buscar">
          <span class="icon">search</span>
          <input class="input" placeholder="Buscar por nombre, tutor o teléfono" [ngModel]="q()" (ngModelChange)="q.set($event)" aria-label="Buscar alumnos">
          @if (q()) { <button class="limpiar" (click)="q.set('')" aria-label="Limpiar búsqueda"><span class="icon">close</span></button> }
        </div>
        <select class="select" [ngModel]="horarioId()" (ngModelChange)="horarioId.set($event)" aria-label="Filtrar por horario">
          <option [ngValue]="null">Todos los horarios</option>
          @for (h of horarios(); track h.id) { <option [ngValue]="h.id">{{ h.nombre }} · {{ h.rango }}</option> }
        </select>
        <select class="select orden" [ngModel]="orden()" (ngModelChange)="orden.set($event)" aria-label="Ordenar">
          <option value="proximo">Ordenar: próximo pago</option>
          <option value="nombre">Ordenar: nombre</option>
          <option value="dia_pago">Ordenar: día del mes</option>
        </select>
        <label class="switch">
          <input type="checkbox" [ngModel]="verInactivos()" (ngModelChange)="cambiarInactivos($event)">
          <span class="track"></span> Inactivos
        </label>
        <div class="vistas" role="group" aria-label="Vista">
          <button [class.sel]="vista() === 'tarjetas'" (click)="ponerVista('tarjetas')" title="Tarjetas" aria-label="Ver como tarjetas"><span class="icon">grid_view</span></button>
          <button [class.sel]="vista() === 'tabla'" (click)="ponerVista('tabla')" title="Tabla" aria-label="Ver como tabla"><span class="icon">table_rows</span></button>
        </div>
      </div>

      <!-- Filtro por estado de pago -->
      <div class="estados">
        <button class="estado" [class.sel]="!estadoSel()" (click)="estadoSel.set(null)">
          Todos <span class="n">{{ baseFiltrada().length }}</span>
        </button>
        @for (e of ordenEstados; track e) {
          <button class="estado" [class]="'estado tono-' + ESTADOS[e].tono" [class.sel]="estadoSel() === e" (click)="estadoSel.set(estadoSel() === e ? null : e)">
            <span class="icon">{{ ESTADOS[e].icono }}</span> {{ ESTADOS[e].texto }} <span class="n">{{ conteo()[e] }}</span>
          </button>
        }
      </div>

      @if (cargando()) {
        <div class="grid">@for (i of [1, 2, 3, 4, 5, 6]; track i) { <div class="skeleton" style="height: 190px"></div> }</div>
      } @else if (!lista().length) {
        <div class="card vacio">
          <span class="icon">{{ todos().length ? 'search_off' : 'pool' }}</span>
          <h3>{{ todos().length ? 'Sin resultados' : 'Aún no hay alumnos' }}</h3>
          <p>{{ todos().length ? 'Prueba con otra búsqueda o quita los filtros.' : 'Registra al primer alumno de la escuela.' }}</p>
          @if (todos().length) {
            <button class="btn btn-ghost" (click)="limpiarFiltros()">Quitar filtros</button>
          } @else {
            <a class="btn btn-primary" routerLink="/alumnos/nuevo"><span class="icon">person_add</span> Nuevo alumno</a>
          }
        </div>
      } @else if (vista() === 'tarjetas') {
        <div class="grid">
          @for (e of lista(); track e.id) {
            <article class="card alumno" [class.inactivo]="!e.activo" [class]="'card alumno borde-' + ESTADOS[e.estado].tono" (click)="abrir(e)">
              <div class="cab">
                <app-avatar [nombre]="e.nombre_completo" [tam]="52" />
                <div class="grow nombre">
                  <h3>{{ e.nombre_completo }}</h3>
                  <div class="muted small">
                    {{ e.edad !== null ? e.edad + ' años' : 'Edad sin registrar' }}{{ e.tutor ? ' · ' + e.tutor : '' }}
                  </div>
                </div>
                <div class="monto">{{ e.mensualidad | currency: 'MXN' : 'symbol-narrow' : '1.0-0' }}<span>/mes</span></div>
              </div>

              <div class="horarios">
                @for (h of e.horarios; track h.id) {
                  <span class="tag" [title]="h.dias_texto"><span class="icon">schedule</span>{{ h.nombre }} · {{ h.rango }}</span>
                } @empty {
                  <span class="tag tag-muted">Sin horario</span>
                }
              </div>

              <div class="pie">
                <div class="fecha" [class]="'fecha tono-' + ESTADOS[e.estado].tono">
                  <span>{{ e.proximo_pago | date: 'MMM' }}</span>
                  <strong>{{ e.proximo_pago | date: 'd' }}</strong>
                </div>
                <div class="grow">
                  <div class="fw-6 dia-sem">{{ e.proximo_pago | date: "EEEE d 'de' MMMM" }}</div>
                  <div class="small muted">{{ cuando(e.dias_para_pago) }} · paga el día {{ e.dia_pago }}</div>
                </div>
                @if (e.activo) { <app-estado [estado]="e.estado" /> } @else { <span class="pill tono-idle">Inactivo</span> }
              </div>
            </article>
          }
        </div>
      } @else {
        <div class="card table-wrap">
          <table class="table">
            <thead>
              <tr><th>Alumno</th><th>Horarios</th><th>Contacto</th><th>Próximo pago</th><th class="num">Mensualidad</th><th>Aviso</th></tr>
            </thead>
            <tbody>
              @for (e of lista(); track e.id) {
                <tr class="clic" [class.inactivo]="!e.activo" (click)="abrir(e)">
                  <td>
                    <div class="row">
                      <app-avatar [nombre]="e.nombre_completo" [tam]="36" />
                      <div><div class="fw-6">{{ e.nombre_completo }}</div><div class="muted small">{{ e.edad !== null ? e.edad + ' años' : '—' }}</div></div>
                    </div>
                  </td>
                  <td>
                    <div class="row wrap">
                      @for (h of e.horarios; track h.id) { <span class="tag">{{ h.nombre }}</span> } @empty { <span class="muted small">—</span> }
                    </div>
                  </td>
                  <td class="small">{{ e.tutor || '—' }}<div class="muted">{{ e.telefono || '' }}</div></td>
                  <td><span class="fw-6">{{ e.proximo_pago | date: "d 'de' MMMM" }}</span><div class="muted small">{{ cuando(e.dias_para_pago) }} · día {{ e.dia_pago }}</div></td>
                  <td class="num fw-6">{{ e.mensualidad | currency: 'MXN' : 'symbol-narrow' : '1.0-0' }}</td>
                  <td>@if (e.activo) { <app-estado [estado]="e.estado" /> } @else { <span class="pill tono-idle">Inactivo</span> }</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: `
    .herramientas { display: flex; gap: 12px; padding: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 16px; }
    .buscar { flex: 1 1 280px; }
    .limpiar { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); border: 0; background: none; color: var(--muted); cursor: pointer; width: 30px; height: 30px; border-radius: 8px; }
    .limpiar .icon { position: static; transform: none; font-size: 18px; }
    .herramientas .select { width: auto; flex: 0 1 230px; }
    .vistas { display: flex; background: var(--surface-2); border: 1px solid var(--line); border-radius: 12px; padding: 3px; }
    .vistas button { border: 0; background: none; width: 36px; height: 34px; border-radius: 9px; cursor: pointer; color: var(--muted); }
    .vistas button.sel { background: #fff; color: var(--brand); box-shadow: 0 1px 3px rgba(15,34,51,.12); }

    .estados { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
    .estado {
      display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 12px; border-radius: 999px;
      border: 1px solid var(--line); background: #fff; font: 600 13px var(--font); color: var(--ink-2); cursor: pointer;
      transition: box-shadow .15s, border-color .15s;
    }
    .estado .icon { font-size: 17px; }
    .estado .n { min-width: 22px; height: 22px; padding: 0 6px; border-radius: 999px; background: var(--idle-bg); color: var(--ink-2); display: inline-grid; place-items: center; font-size: 12px; }
    .estado.tono-ok, .estado.tono-warn, .estado.tono-info, .estado.tono-danger, .estado.tono-idle { background: #fff; }
    .estado.sel { border-color: currentColor; box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 14%, transparent); }
    .estado:not(.tono-ok):not(.tono-warn):not(.tono-info):not(.tono-danger):not(.tono-idle).sel { color: var(--brand); }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .alumno {
      padding: 18px; display: flex; flex-direction: column; gap: 14px; cursor: pointer; position: relative; overflow: hidden;
      transition: transform .15s, box-shadow .15s, border-color .15s;
    }
    .alumno::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--line); }
    .borde-warn::before { background: #fbbf24; } .borde-info::before { background: var(--sky); }
    .alumno:hover { transform: translateY(-3px); box-shadow: 0 14px 30px rgba(11,37,64,.12); border-color: #cfe3ec; }
    .cab { display: flex; gap: 12px; align-items: flex-start; }
    .nombre { min-width: 0; }
    .nombre h3 { font-size: 16px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .horarios { display: flex; flex-wrap: wrap; gap: 6px; min-height: 24px; }
    .pie { display: flex; align-items: center; gap: 14px; padding-top: 12px; border-top: 1px dashed var(--line); font-size: 13px; color: var(--muted); flex-wrap: wrap; }
    .pie strong { color: var(--ink); }
    .pie .fw-6 { color: var(--ink); }
    .dia-sem::first-letter { text-transform: uppercase; }
    .fecha { width: 48px; flex-shrink: 0; text-align: center; border-radius: 12px; border: 1px solid var(--line); overflow: hidden; background: #fff !important; color: var(--ink); }
    .fecha span { display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; padding: 2px 0; background: var(--idle-bg); color: var(--idle); }
    .fecha strong { display: block; font-size: 19px; padding: 2px 0 3px; color: var(--ink); }
    .fecha.tono-warn span { background: var(--warn-bg); color: var(--warn); }
    .fecha.tono-info span { background: var(--info-bg); color: var(--info); }
    .monto { font-weight: 800; color: var(--ink); font-size: 15px; white-space: nowrap; }
    .monto span { font-weight: 500; color: var(--muted); font-size: 12px; }
    .inactivo { opacity: .6; }
    .vacio .btn { margin-top: 12px; }
    @media (max-width: 720px) { .herramientas .select { flex: 1 1 100%; } }
  `,
})
export class AlumnosListaComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  /** Filtros que pueden llegar en la URL, p. ej. /alumnos?estado=hoy&horario=3 */
  estado = input<string>();
  horario = input<string>();

  ESTADOS = ESTADOS;
  ordenEstados = ORDEN_ESTADOS;

  todos = signal<Estudiante[]>([]);
  horarios = signal<Horario[]>([]);
  cargando = signal(true);
  q = signal('');
  horarioId = signal<number | null>(null);
  estadoSel = signal<EstadoPago | null>(null);
  verInactivos = signal(false);
  orden = signal<Orden>('proximo');
  vista = signal<Vista>(this.vistaGuardada());
  cuando = cuandoPaga;

  activos = computed(() => this.todos().filter((e) => e.activo).length);

  /** Alumnos tras búsqueda y horario (sin el filtro de estado, para contar por estado). */
  baseFiltrada = computed(() => {
    const q = this.normalizar(this.q().trim());
    const h = this.horarioId();
    return this.todos().filter((e) =>
      (!h || e.horarios.some((x) => x.id === h)) &&
      (!q || [e.nombre_completo, e.tutor, e.telefono].some((c) => c && this.normalizar(c).includes(q))),
    );
  });

  conteo = computed(() => {
    const c: Record<EstadoPago, number> = { hoy: 0, pronto: 0, programado: 0 };
    for (const e of this.baseFiltrada()) if (e.activo) c[e.estado]++;
    return c;
  });

  lista = computed(() => {
    const est = this.estadoSel();
    const filtrada = this.baseFiltrada().filter((e) => !est || (e.activo && e.estado === est));
    const porNombre = (a: Estudiante, b: Estudiante) => a.nombre_completo.localeCompare(b.nombre_completo, 'es');
    const criterio: Record<Orden, (a: Estudiante, b: Estudiante) => number> = {
      proximo: (a, b) => Number(b.activo) - Number(a.activo) || a.dias_para_pago - b.dias_para_pago || porNombre(a, b),
      nombre: porNombre,
      dia_pago: (a, b) => a.dia_pago - b.dia_pago || porNombre(a, b),
    };
    return [...filtrada].sort(criterio[this.orden()]);
  });

  constructor() {
    effect(() => {
      const e = this.estado();
      if (e && e in ESTADOS) this.estadoSel.set(e as EstadoPago);
      const h = Number(this.horario());
      if (h) this.horarioId.set(h);
    });
  }

  ngOnInit(): void {
    this.cargar();
    this.api.horarios().subscribe((h) => this.horarios.set(h));
  }

  cargar(): void {
    this.api.estudiantes(this.verInactivos()).subscribe({
      next: (lista) => {
        this.todos.set(lista);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  cambiarInactivos(v: boolean): void {
    this.verInactivos.set(v);
    this.cargar();
  }

  limpiarFiltros(): void {
    this.q.set('');
    this.horarioId.set(null);
    this.estadoSel.set(null);
  }

  ponerVista(v: Vista): void {
    this.vista.set(v);
    try { localStorage.setItem(CLAVE_VISTA, v); } catch { /* sin almacenamiento */ }
  }

  abrir(e: Estudiante): void {
    this.router.navigate(['/alumnos', e.id]);
  }

  private vistaGuardada(): Vista {
    try { return localStorage.getItem(CLAVE_VISTA) === 'tabla' ? 'tabla' : 'tarjetas'; } catch { return 'tarjetas'; }
  }

  private normalizar(t: string): string {
    return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
}
