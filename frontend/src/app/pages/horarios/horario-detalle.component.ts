import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { mensajeDeError } from '../../core/auth';
import { DIAS, HorarioDetalle, cuandoPaga } from '../../core/models';
import { UiService } from '../../core/ui.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { EstadoPillComponent } from '../../shared/estado-pill.component';

@Component({
  selector: 'app-horario-detalle',
  imports: [RouterLink, DatePipe, AvatarComponent, EstadoPillComponent],
  template: `
    <div class="page">
      <a class="back" routerLink="/horarios"><span class="icon">arrow_back</span> Horarios</a>

      @if (h(); as h) {
        <section class="card portada">
          <div class="hora"><strong>{{ h.hora_inicio }}</strong><span>{{ h.hora_fin }}</span></div>
          <div class="grow">
            <div class="row wrap"><h1>{{ h.nombre }}</h1> @if (h.nivel) { <span class="tag">{{ h.nivel }}</span> }</div>
            <div class="meta">
              <span><span class="icon">sports</span> {{ h.instructor || 'Sin instructor' }}</span>
              <span><span class="icon">date_range</span> {{ h.dias_texto }}</span>
            </div>
            <div class="puntos">
              @for (d of dias; track d.codigo) { <span [class.on]="h.dias.includes(d.codigo)">{{ d.nombre.slice(0, 3) }}</span> }
            </div>
          </div>
          <div class="ocupacion">
            <div class="anillo" [style.--p]="(h.ocupados / h.cupo) * 100" [class.lleno]="h.lleno">
              <strong>{{ h.ocupados }}</strong><span>de {{ h.cupo }}</span>
            </div>
            <span class="small muted">{{ h.lleno ? 'Grupo lleno' : (h.cupo - h.ocupados) + ' lugar(es) libre(s)' }}</span>
          </div>
          <div class="acciones">
            <a class="btn btn-ghost" [routerLink]="['/horarios', h.id, 'editar']"><span class="icon">edit</span> Editar</a>
            <button class="btn btn-danger" (click)="eliminar(h)"><span class="icon">delete</span> Eliminar</button>
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <h2><span class="icon">groups</span> Alumnos en este horario</h2>
            <span class="tag tag-muted">{{ h.estudiantes.length }}</span>
          </div>
          @if (h.estudiantes.length) {
            <div class="table-wrap">
              <table class="table">
                <thead><tr><th>#</th><th>Alumno</th><th>Tutor / teléfono</th><th>Próximo pago</th><th>Aviso</th></tr></thead>
                <tbody>
                  @for (e of h.estudiantes; track e.id; let i = $index) {
                    <tr class="clic" [class.inactivo]="!e.activo" (click)="abrir(e.id)">
                      <td class="muted">{{ i + 1 }}</td>
                      <td><div class="row"><app-avatar [nombre]="e.nombre_completo" [tam]="34" />
                        <div><div class="fw-6">{{ e.nombre_completo }}</div><div class="muted small">{{ e.edad !== null ? e.edad + ' años' : '' }}{{ e.activo ? '' : ' · Inactivo' }}</div></div></div></td>
                      <td class="small">{{ e.tutor || '—' }}<div class="muted">{{ e.telefono || '' }}</div></td>
                      <td><span class="fw-6">{{ e.proximo_pago | date: "d 'de' MMM" }}</span><div class="muted small">{{ cuando(e.dias_para_pago) }}</div></td>
                      <td>@if (e.activo) { <app-estado [estado]="e.estado" /> }</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="vacio"><span class="icon">person_add</span><h3>Nadie inscrito todavía</h3>
              <p>Asigna este horario desde la ficha de cada alumno.</p>
              <a class="btn btn-primary" routerLink="/alumnos/nuevo">Nuevo alumno</a></div>
          }
        </section>
      } @else if (error()) {
        <div class="card vacio"><span class="icon">event_busy</span><h3>No encontramos este horario</h3><p>{{ error() }}</p></div>
      } @else {
        <div class="skeleton" style="height: 160px; margin-bottom: 20px"></div>
        <div class="skeleton" style="height: 320px"></div>
      }
    </div>
  `,
  styles: `
    .portada { display: flex; gap: 24px; align-items: center; padding: 24px; margin-bottom: 20px; flex-wrap: wrap;
      background: linear-gradient(120deg, #fff 50%, var(--brand-50)); }
    .hora { width: 96px; height: 96px; border-radius: 22px; background: var(--navy); color: #fff; display: grid; place-content: center; text-align: center; flex-shrink: 0; }
    .hora strong { font-size: 24px; font-weight: 800; }
    .hora span { font-size: 13px; color: #93c5fd; font-weight: 600; }
    h1 { font-size: 26px; font-weight: 800; }
    .meta { display: flex; gap: 16px; flex-wrap: wrap; color: var(--muted); margin: 6px 0 10px; }
    .meta > span { display: inline-flex; align-items: center; gap: 6px; }
    .meta .icon { font-size: 18px; }
    .puntos { display: flex; gap: 5px; flex-wrap: wrap; }
    .puntos span { padding: 4px 9px; border-radius: 8px; font-size: 12px; font-weight: 700; background: var(--idle-bg); color: #94a3b8; }
    .puntos span.on { background: var(--brand); color: #fff; }
    .ocupacion { display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .anillo { --p: 0; width: 92px; height: 92px; border-radius: 50%; display: grid; place-content: center; text-align: center;
      background: radial-gradient(closest-side, #fff 78%, transparent 79%), conic-gradient(var(--brand) calc(var(--p) * 1%), var(--idle-bg) 0); }
    .anillo.lleno { background: radial-gradient(closest-side, #fff 78%, transparent 79%), conic-gradient(var(--red) calc(var(--p) * 1%), var(--idle-bg) 0); }
    .anillo strong { font-size: 24px; font-weight: 800; line-height: 1; }
    .anillo span { font-size: 12px; color: var(--muted); }
    .acciones { display: flex; flex-direction: column; gap: 8px; }
    .inactivo { opacity: .55; }
    .vacio .btn { margin-top: 12px; }
    @media (max-width: 720px) { .acciones { flex-direction: row; width: 100%; } }
  `,
})
export class HorarioDetalleComponent implements OnInit {
  private api = inject(ApiService);
  private ui = inject(UiService);
  private router = inject(Router);

  id = input.required<string>();
  h = signal<HorarioDetalle | null>(null);
  error = signal('');
  dias = DIAS;
  cuando = cuandoPaga;

  ngOnInit(): void {
    this.api.horario(Number(this.id())).subscribe({
      next: (h) => this.h.set(h),
      error: (e) => this.error.set(mensajeDeError(e)[0]),
    });
  }

  abrir(id: number): void {
    this.router.navigate(['/alumnos', id]);
  }

  async eliminar(h: HorarioDetalle): Promise<void> {
    const si = await this.ui.confirmar(`¿Eliminar el horario «${h.nombre}»?`,
      'Los alumnos no se borran: solo se les quita este horario.');
    if (!si) return;
    this.api.eliminarHorario(h.id).subscribe({
      next: () => {
        this.ui.avisar(`Horario «${h.nombre}» eliminado.`);
        this.router.navigate(['/horarios']);
      },
      error: (e) => this.ui.avisar(mensajeDeError(e)[0], 'error'),
    });
  }
}
