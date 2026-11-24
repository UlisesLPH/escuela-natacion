import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { mensajeDeError } from '../../core/auth';
import { EstudianteForm, Horario, hoyIso } from '../../core/models';
import { UiService } from '../../core/ui.service';

@Component({
  selector: 'app-alumno-form',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page angosta">
      <a class="back" [routerLink]="id() ? ['/alumnos', id()] : ['/alumnos']"><span class="icon">arrow_back</span> {{ id() ? 'Ficha del alumno' : 'Alumnos' }}</a>
      <div class="page-head">
        <div>
          <h1>{{ id() ? 'Editar alumno' : 'Nuevo alumno' }}</h1>
          <div class="sub">Los campos con * son obligatorios.</div>
        </div>
      </div>

      @if (errores().length) {
        <div class="errores"><ul>@for (e of errores(); track e) { <li>{{ e }}</li> }</ul></div>
      }

      @if (listo()) {
        <form (ngSubmit)="guardar()" #f="ngForm">
          <section class="card card-pad mb-16">
            <h2 class="section-title">Datos personales</h2>
            <div class="form-grid">
              <div class="field col-4"><label for="nombre">Nombre *</label>
                <input class="input" id="nombre" name="nombre" [(ngModel)]="form.nombre" required maxlength="80"></div>
              <div class="field col-5"><label for="apellidos">Apellidos</label>
                <input class="input" id="apellidos" name="apellidos" [(ngModel)]="form.apellidos" maxlength="120"></div>
              <div class="field col-3"><label for="nac">Fecha de nacimiento</label>
                <input class="input" type="date" id="nac" name="nac" [(ngModel)]="form.fecha_nacimiento" [max]="hoy"></div>
              <div class="field col-4"><label for="tutor">Padre, madre o tutor</label>
                <input class="input" id="tutor" name="tutor" [(ngModel)]="form.tutor" maxlength="120"></div>
              <div class="field col-4"><label for="tel">Teléfono</label>
                <input class="input" type="tel" id="tel" name="tel" [(ngModel)]="form.telefono" maxlength="30"></div>
              <div class="field col-4"><label for="email">Correo</label>
                <input class="input" type="email" id="email" name="email" [(ngModel)]="form.email" maxlength="120" email></div>
            </div>
          </section>

          <section class="card card-pad mb-16">
            <h2 class="section-title">Fecha de pago</h2>
            <div class="form-grid">
              <div class="field col-4">
                <label for="dia">Día del mes en que paga *</label>
                <input class="input" type="number" min="1" max="31" id="dia" name="dia" [(ngModel)]="form.dia_pago" required>
                <span class="hint">Si el mes es más corto, se toma el último día.</span>
              </div>
              <div class="field col-4">
                <label for="mensualidad">Mensualidad *</label>
                <div class="input-prefix"><span>$</span>
                  <input class="input" type="number" min="0" step="0.01" id="mensualidad" name="mensualidad" [(ngModel)]="form.mensualidad" required></div>
              </div>
              @if (id()) {
                <div class="field col-4">
                  <span class="label">Estado</span>
                  <label class="switch alto"><input type="checkbox" name="activo" [(ngModel)]="form.activo"><span class="track"></span>{{ form.activo ? 'Activo' : 'Inactivo' }}</label>
                </div>
              }
            </div>
            <div class="dias">
              @for (d of diasMes; track d) {
                <button type="button" class="dia" [class.sel]="form.dia_pago === d" (click)="form.dia_pago = d">{{ d }}</button>
              }
            </div>
          </section>

          <section class="card card-pad mb-16">
            <div class="row"><h2 class="section-title grow">Horarios</h2><span class="muted small">{{ form.horarios.length }} seleccionado(s)</span></div>
            @if (horarios().length) {
              <div class="horarios">
                @for (h of horarios(); track h.id) {
                  @let marcado = form.horarios.includes(h.id);
                  @let sinCupo = h.lleno && !inicial().includes(h.id);
                  <button type="button" class="horario" [class.sel]="marcado" [disabled]="sinCupo && !marcado" (click)="alternar(h.id)">
                    <span class="check"><span class="icon">{{ marcado ? 'check' : 'add' }}</span></span>
                    <span class="grow">
                      <strong>{{ h.nombre }}</strong> @if (h.nivel) { <span class="tag">{{ h.nivel }}</span> }
                      <span class="d small">{{ h.dias_texto }} · {{ h.rango }}</span>
                      <span class="cupo small" [class.lleno]="h.lleno">
                        <span class="barra" [class.llena]="h.lleno"><span [style.width.%]="(h.ocupados / h.cupo) * 100"></span></span>
                        {{ h.ocupados }}/{{ h.cupo }}{{ sinCupo ? ' · sin cupo' : '' }}
                      </span>
                    </span>
                  </button>
                }
              </div>
            } @else {
              <p class="muted">Aún no hay horarios. <a routerLink="/horarios/nuevo">Crea uno</a> y después asígnalo.</p>
            }
          </section>

          <section class="card card-pad mb-16">
            <div class="field"><label for="notas">Notas (salud, alergias, observaciones)</label>
              <textarea class="textarea" id="notas" name="notas" [(ngModel)]="form.notas" maxlength="2000"></textarea></div>
          </section>

          <div class="row fin">
            <a class="btn btn-ghost" [routerLink]="id() ? ['/alumnos', id()] : ['/alumnos']">Cancelar</a>
            <button class="btn btn-primary" [disabled]="guardando() || !f.valid"><span class="icon">save</span> Guardar</button>
          </div>
        </form>
      } @else {
        <div class="skeleton" style="height: 480px"></div>
      }
    </div>
  `,
  styles: `
    .angosta { max-width: 980px; }
    .col-5 { grid-column: span 5; }
    .alto { height: 42px; }
    .dias { display: grid; grid-template-columns: repeat(16, 1fr); gap: 6px; margin-top: 16px; }
    .dia { height: 34px; border-radius: 9px; border: 1px solid var(--line); background: #fff; font: 600 13px var(--font); color: var(--ink-2); cursor: pointer; }
    .dia:hover { border-color: var(--brand); }
    .dia.sel { background: var(--brand); border-color: var(--brand); color: #fff; }
    .horarios { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; }
    .horario { display: flex; gap: 12px; text-align: left; padding: 12px; border-radius: 14px; border: 1px solid var(--line); background: #fff; cursor: pointer; font: inherit; color: inherit; transition: border-color .15s, background .15s; }
    .horario:hover:not(:disabled) { border-color: #9ccfe0; }
    .horario.sel { border-color: var(--brand); background: var(--brand-50); }
    .horario:disabled { opacity: .5; cursor: not-allowed; }
    .check { width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--line); display: grid; place-items: center; flex-shrink: 0; background: #fff; color: var(--muted); }
    .sel .check { background: var(--brand); border-color: var(--brand); color: #fff; }
    .check .icon { font-size: 18px; }
    .d { display: block; color: var(--muted); margin: 2px 0 6px; }
    .cupo { display: flex; align-items: center; gap: 8px; color: var(--muted); font-weight: 600; }
    .cupo .barra { flex: 1; height: 6px; }
    .cupo.lleno { color: var(--red); }
    .fin { justify-content: flex-end; }
    @media (max-width: 720px) { .dias { grid-template-columns: repeat(8, 1fr); } }
  `,
})
export class AlumnoFormComponent implements OnInit {
  private api = inject(ApiService);
  private ui = inject(UiService);
  private router = inject(Router);

  id = input<string>();
  horarios = signal<Horario[]>([]);
  inicial = signal<number[]>([]);
  errores = signal<string[]>([]);
  guardando = signal(false);
  cargado = signal(false);
  listo = this.cargado;

  hoy = hoyIso();
  diasMes = Array.from({ length: 31 }, (_, i) => i + 1);
  form: EstudianteForm = {
    nombre: '', apellidos: '', fecha_nacimiento: '', telefono: '', email: '', tutor: '',
    dia_pago: new Date().getDate(), mensualidad: null, activo: true, notas: '', horarios: [],
  };

  ngOnInit(): void {
    this.api.horarios().subscribe((h) => this.horarios.set(h));
    const id = Number(this.id());
    if (!id) {
      this.cargado.set(true);
      return;
    }
    this.api.estudiante(id).subscribe({
      next: (a) => {
        this.form = {
          nombre: a.nombre, apellidos: a.apellidos, fecha_nacimiento: a.fecha_nacimiento ?? '',
          telefono: a.telefono ?? '', email: a.email ?? '', tutor: a.tutor ?? '', dia_pago: a.dia_pago,
          mensualidad: a.mensualidad, activo: a.activo, notas: a.notas ?? '', horarios: a.horarios.map((h) => h.id),
        };
        this.inicial.set([...this.form.horarios]);
        this.cargado.set(true);
      },
      error: (e) => this.errores.set(mensajeDeError(e)),
    });
  }

  alternar(id: number): void {
    const h = this.form.horarios;
    this.form.horarios = h.includes(id) ? h.filter((x) => x !== id) : [...h, id];
  }

  guardar(): void {
    this.guardando.set(true);
    this.errores.set([]);
    const id = Number(this.id());
    const peticion = id ? this.api.editarEstudiante(id, this.form) : this.api.crearEstudiante(this.form);
    peticion.subscribe({
      next: (a) => {
        this.ui.avisar(`${a.nombre_completo} guardado.`);
        this.router.navigate(['/alumnos', a.id]);
      },
      error: (e) => {
        this.errores.set(mensajeDeError(e));
        this.guardando.set(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  }
}
