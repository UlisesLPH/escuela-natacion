import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { mensajeDeError } from '../../core/auth';
import { DIAS, HorarioForm, NIVELES } from '../../core/models';
import { UiService } from '../../core/ui.service';

@Component({
  selector: 'app-horario-form',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page angosta">
      <a class="back" [routerLink]="id() ? ['/horarios', id()] : ['/horarios']"><span class="icon">arrow_back</span> {{ id() ? 'Horario' : 'Horarios' }}</a>
      <div class="page-head"><div><h1>{{ id() ? 'Editar horario' : 'Nuevo horario' }}</h1>
        <div class="sub">Define el grupo, sus días, la hora y cuántos alumnos caben.</div></div></div>

      @if (errores().length) {
        <div class="errores"><ul>@for (e of errores(); track e) { <li>{{ e }}</li> }</ul></div>
      }

      @if (cargado()) {
        <form (ngSubmit)="guardar()" #f="ngForm">
          <section class="card card-pad mb-16">
            <h2 class="section-title">Grupo</h2>
            <div class="form-grid">
              <div class="field col-6"><label for="nombre">Nombre del grupo *</label>
                <input class="input" id="nombre" name="nombre" [(ngModel)]="form.nombre" required maxlength="120" placeholder="Ej. Delfines vespertino"></div>
              <div class="field col-6"><label for="instructor">Instructor</label>
                <input class="input" id="instructor" name="instructor" [(ngModel)]="form.instructor" maxlength="120"></div>
            </div>
            <div class="field mt-16"><span class="label">Nivel</span>
              <div class="chips">
                @for (n of niveles; track n) {
                  <button type="button" class="chip" [class.sel]="form.nivel === n" (click)="form.nivel = form.nivel === n ? '' : n">{{ n }}</button>
                }
              </div>
            </div>
          </section>

          <section class="card card-pad mb-16">
            <h2 class="section-title">Días y hora</h2>
            <div class="semana">
              @for (d of dias; track d.codigo) {
                <button type="button" class="dia" [class.sel]="form.dias.includes(d.codigo)" (click)="alternar(d.codigo)">
                  <strong>{{ d.nombre.slice(0, 3) }}</strong><span>{{ d.nombre }}</span>
                </button>
              }
            </div>
            <div class="form-grid mt-16">
              <div class="field col-4"><label for="ini">Hora de inicio *</label>
                <input class="input" type="time" id="ini" name="ini" [(ngModel)]="form.hora_inicio" required></div>
              <div class="field col-4"><label for="fin">Hora de fin *</label>
                <input class="input" type="time" id="fin" name="fin" [(ngModel)]="form.hora_fin" required></div>
              <div class="field col-4"><label for="cupo">Cupo máximo *</label>
                <input class="input" type="number" min="1" max="500" id="cupo" name="cupo" [(ngModel)]="form.cupo" required></div>
            </div>
          </section>

          <div class="row fin">
            <a class="btn btn-ghost" [routerLink]="id() ? ['/horarios', id()] : ['/horarios']">Cancelar</a>
            <button class="btn btn-primary" [disabled]="guardando() || !f.valid || !form.dias.length"><span class="icon">save</span> Guardar</button>
          </div>
        </form>
      } @else {
        <div class="skeleton" style="height: 380px"></div>
      }
    </div>
  `,
  styles: `
    .angosta { max-width: 860px; }
    .chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .chip { height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--line); background: #fff; font: 600 13px var(--font); color: var(--ink-2); cursor: pointer; }
    .chip.sel { background: var(--brand-50); border-color: var(--brand); color: var(--brand-600); }
    .semana { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
    .dia { height: 64px; border-radius: 14px; border: 1px solid var(--line); background: #fff; cursor: pointer; font: inherit; color: var(--ink-2); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; transition: all .15s; }
    .dia strong { font-size: 16px; }
    .dia span { font-size: 11px; color: var(--muted); }
    .dia:hover { border-color: var(--brand); }
    .dia.sel { background: linear-gradient(135deg, var(--brand), #0891b2); border-color: transparent; color: #fff; box-shadow: 0 6px 14px rgba(14,116,144,.25); }
    .dia.sel span { color: #cffafe; }
    .fin { justify-content: flex-end; }
    @media (max-width: 600px) { .semana { grid-template-columns: repeat(4, 1fr); } }
  `,
})
export class HorarioFormComponent implements OnInit {
  private api = inject(ApiService);
  private ui = inject(UiService);
  private router = inject(Router);

  id = input<string>();
  dias = DIAS;
  niveles = NIVELES;
  errores = signal<string[]>([]);
  guardando = signal(false);
  cargado = signal(false);
  form: HorarioForm = { nombre: '', dias: [], hora_inicio: '', hora_fin: '', nivel: '', instructor: '', cupo: 10 };

  ngOnInit(): void {
    const id = Number(this.id());
    if (!id) {
      this.cargado.set(true);
      return;
    }
    this.api.horario(id).subscribe({
      next: (h) => {
        this.form = { nombre: h.nombre, dias: [...h.dias], hora_inicio: h.hora_inicio, hora_fin: h.hora_fin,
          nivel: h.nivel ?? '', instructor: h.instructor ?? '', cupo: h.cupo };
        this.cargado.set(true);
      },
      error: (e) => this.errores.set(mensajeDeError(e)),
    });
  }

  alternar(codigo: string): void {
    const d = this.form.dias;
    this.form.dias = d.includes(codigo) ? d.filter((x) => x !== codigo) : [...d, codigo];
  }

  guardar(): void {
    this.guardando.set(true);
    this.errores.set([]);
    const id = Number(this.id());
    const peticion = id ? this.api.editarHorario(id, this.form) : this.api.crearHorario(this.form);
    peticion.subscribe({
      next: (h) => {
        this.ui.avisar(`Horario «${h.nombre}» guardado.`);
        this.router.navigate(['/horarios', h.id]);
      },
      error: (e) => {
        this.errores.set(mensajeDeError(e));
        this.guardando.set(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  }
}
