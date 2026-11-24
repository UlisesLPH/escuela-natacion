import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { DIAS, Horario } from '../../core/models';

@Component({
  selector: 'app-horarios-lista',
  imports: [RouterLink],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>Horarios</h1>
          <div class="sub">{{ todos().length }} grupo(s) · {{ inscritos() }} lugar(es) ocupado(s) de {{ capacidad() }}</div>
        </div>
        <a class="btn btn-primary" routerLink="/horarios/nuevo"><span class="icon">more_time</span> Nuevo horario</a>
      </div>

      <div class="semana card">
        <button [class.sel]="!dia()" (click)="dia.set(null)">Toda la semana</button>
        @for (d of dias; track d.codigo) {
          <button [class.sel]="dia() === d.codigo" [class.hoy]="d.codigo === hoy" (click)="dia.set(d.codigo)">
            {{ d.nombre }} <span class="n">{{ porDia()[d.codigo] }}</span>
          </button>
        }
      </div>

      @if (cargando()) {
        <div class="grid">@for (i of [1, 2, 3]; track i) { <div class="skeleton" style="height: 220px"></div> }</div>
      } @else if (!lista().length) {
        <div class="card vacio">
          <span class="icon">event_busy</span>
          <h3>{{ todos().length ? 'No hay clases ese día' : 'Aún no hay horarios' }}</h3>
          <p>{{ todos().length ? 'Elige otro día de la semana.' : 'Crea el primer grupo con sus días, horas y cupo.' }}</p>
          @if (!todos().length) { <a class="btn btn-primary" routerLink="/horarios/nuevo">Nuevo horario</a> }
        </div>
      } @else {
        <div class="grid">
          @for (h of lista(); track h.id) {
            <a class="card horario" [routerLink]="['/horarios', h.id]">
              <div class="row">
                <div class="hora"><strong>{{ h.hora_inicio }}</strong><span>a {{ h.hora_fin }}</span></div>
                <span class="grow"></span>
                @if (h.nivel) { <span class="tag">{{ h.nivel }}</span> }
              </div>
              <h2>{{ h.nombre }}</h2>
              <div class="muted small instructor"><span class="icon">sports</span> {{ h.instructor || 'Sin instructor' }}</div>
              <div class="puntos">
                @for (d of dias; track d.codigo) {
                  <span [class.on]="h.dias.includes(d.codigo)" [title]="d.nombre">{{ d.corto }}</span>
                }
              </div>
              <div class="cupo">
                <div class="row small"><span class="grow muted">Ocupación</span>
                  <strong [class.lleno]="h.lleno">{{ h.ocupados }}/{{ h.cupo }}</strong></div>
                <div class="barra" [class.llena]="h.lleno"><span [style.width.%]="(h.ocupados / h.cupo) * 100"></span></div>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .semana { display: flex; gap: 4px; padding: 6px; margin-bottom: 20px; overflow-x: auto; }
    .semana button { flex: 1; white-space: nowrap; border: 0; background: none; height: 38px; padding: 0 12px; border-radius: 10px; font: 600 13px var(--font); color: var(--ink-2); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
    .semana button:hover { background: var(--surface-2); }
    .semana button.sel { background: var(--navy); color: #fff; }
    .semana button.hoy:not(.sel) { color: var(--brand); }
    .n { font-size: 11px; min-width: 20px; height: 20px; border-radius: 999px; background: var(--idle-bg); color: var(--idle); display: inline-grid; place-items: center; padding: 0 5px; }
    .sel .n { background: rgba(255,255,255,.18); color: #fff; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 16px; }
    .horario { padding: 20px; color: inherit; display: flex; flex-direction: column; gap: 10px; position: relative; overflow: hidden; transition: transform .15s, box-shadow .15s; }
    .horario::after { content: ''; position: absolute; right: -30px; top: -30px; width: 110px; height: 110px; border-radius: 50%; background: radial-gradient(circle, rgba(56,189,248,.16), transparent 70%); }
    .horario:hover { transform: translateY(-3px); box-shadow: 0 14px 30px rgba(11,37,64,.12); color: inherit; }
    .hora strong { font-size: 26px; font-weight: 800; letter-spacing: -.02em; }
    .hora span { color: var(--muted); font-weight: 600; margin-left: 6px; }
    h2 { font-size: 18px; font-weight: 700; }
    .instructor { display: flex; align-items: center; gap: 4px; margin-top: -6px; }
    .instructor .icon { font-size: 17px; }
    .puntos { display: flex; gap: 5px; }
    .puntos span { width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; font-size: 12px; font-weight: 700; background: var(--idle-bg); color: #94a3b8; }
    .puntos span.on { background: var(--brand-50); color: var(--brand-600); box-shadow: inset 0 0 0 1px #a5d8e6; }
    .cupo { margin-top: 4px; display: flex; flex-direction: column; gap: 6px; }
    .lleno { color: var(--red); }
  `,
})
export class HorariosListaComponent implements OnInit {
  private api = inject(ApiService);

  dias = DIAS;
  hoy = DIAS[(new Date().getDay() + 6) % 7].codigo;
  todos = signal<Horario[]>([]);
  cargando = signal(true);
  dia = signal<string | null>(null);

  lista = computed(() => {
    const d = this.dia();
    return d ? this.todos().filter((h) => h.dias.includes(d)) : this.todos();
  });
  porDia = computed(() => Object.fromEntries(DIAS.map((d) => [d.codigo, this.todos().filter((h) => h.dias.includes(d.codigo)).length])) as Record<string, number>);
  inscritos = computed(() => this.todos().reduce((s, h) => s + h.ocupados, 0));
  capacidad = computed(() => this.todos().reduce((s, h) => s + h.cupo, 0));

  ngOnInit(): void {
    this.api.horarios().subscribe({
      next: (h) => { this.todos.set(h); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }
}
