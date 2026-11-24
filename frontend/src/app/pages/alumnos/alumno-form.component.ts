import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { mensajeDeError } from '../../core/auth';
import { CatalogosSat, ClaveSat, Cuotas, EstudianteForm, Horario, diaDe, hoyIso, primerPagoDe, tipoPersona } from '../../core/models';
import { UiService } from '../../core/ui.service';

@Component({
  selector: 'app-alumno-form',
  imports: [FormsModule, RouterLink, DatePipe, CurrencyPipe],
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
            <h2 class="section-title">Inscripción y pagos</h2>
            <div class="form-grid">
              <div class="field col-4">
                <span class="label">Fecha de inscripción</span>
                <div class="fija">
                  <span class="icon">event</span>
                  <span class="txt">{{ form.fecha_inscripcion + 'T00:00' | date: 'd MMM y' }}</span>
                  @if (!id()) { <span class="hoy">Hoy</span> }
                </div>
                <span class="hint">{{ id() ? 'No se puede cambiar.' : 'Se registra con la fecha de hoy.' }} Paga ese mismo día cada mes.</span>
              </div>
              <div class="field col-4">
                <label for="cuota-insc">Inscripción *</label>
                <div class="input-prefix"><span>$</span>
                  <input class="input" type="number" min="0" step="0.01" id="cuota-insc" name="cuota-insc" [(ngModel)]="form.cuota_inscripcion" required></div>
                <span class="hint">Pago único al entrar{{ cuotas() ? ' (cuota vigente ' + (cuotas()!.inscripcion | currency: 'MXN' : 'symbol-narrow') + ')' : '' }}.</span>
              </div>
              <div class="field col-4">
                <label for="mensualidad">Mensualidad *</label>
                <div class="input-prefix"><span>$</span>
                  <input class="input" type="number" min="0" step="0.01" id="mensualidad" name="mensualidad" [(ngModel)]="form.mensualidad" required></div>
                <span class="hint">{{ cuotas() ? 'Cuota vigente ' + (cuotas()!.mensualidad | currency: 'MXN' : 'symbol-narrow') + '.' : '' }}</span>
              </div>
              @if (id()) {
                <div class="field col-4">
                  <span class="label">Estado</span>
                  <label class="switch alto"><input type="checkbox" name="activo" [(ngModel)]="form.activo"><span class="track"></span>{{ form.activo ? 'Activo' : 'Inactivo' }}</label>
                </div>
              }
            </div>

            @if (primerPago(); as p) {
              <div class="resumen">
                @if (!id()) {
                  <div class="bloque">
                    <span class="icon">how_to_reg</span>
                    <div class="grow">
                      <div class="et">Al inscribirse paga</div>
                      <div class="linea"><span>Inscripción</span><span>{{ (form.cuota_inscripcion ?? 0) | currency: 'MXN' : 'symbol-narrow' }}</span></div>
                      <div class="linea"><span>Mensualidad de {{ form.fecha_inscripcion + 'T00:00' | date: 'MMMM' }}</span><span>{{ (form.mensualidad ?? 0) | currency: 'MXN' : 'symbol-narrow' }}</span></div>
                      <div class="linea total"><span>Total</span><span>{{ (form.cuota_inscripcion ?? 0) + (form.mensualidad ?? 0) | currency: 'MXN' : 'symbol-narrow' }}</span></div>
                    </div>
                  </div>
                }
                <div class="bloque">
                  <span class="icon">event_available</span>
                  <div class="grow">
                    <div class="et">Después, cada mes</div>
                    <strong>{{ (form.mensualidad ?? 0) | currency: 'MXN' : 'symbol-narrow' }} el día {{ dia() }}</strong>
                    <div class="small">Primer pago {{ esPasado(p) ? 'fue' : 'será' }} el {{ p | date: "EEEE d 'de' MMMM 'de' y" }}.</div>
                    @if (dia()! > 28) {
                      <div class="small nota">Los meses que no tienen día {{ dia() }} paga el día 1 del mes siguiente.</div>
                    }
                  </div>
                </div>
              </div>
            }
          </section>

          <section class="card card-pad mb-16">
            <div class="row wrap">
              <h2 class="section-title grow">Facturación</h2>
              <label class="switch">
                <input type="checkbox" name="fact-req" [(ngModel)]="form.factura.requiere"><span class="track"></span>
                {{ form.factura.requiere ? 'Requiere factura' : 'No requiere factura' }}
              </label>
            </div>
            @if (form.factura.requiere) {
              <p class="muted small ayuda">Captura los datos tal como aparecen en la <strong>Constancia de Situación Fiscal</strong>. Se usan para facturar la inscripción y cada mensualidad.</p>
              <div class="form-grid">
                <div class="field col-4">
                  <label for="rfc">RFC *</label>
                  <input class="input mayus" id="rfc" name="rfc" [(ngModel)]="form.factura.rfc" required maxlength="13" autocomplete="off" placeholder="XAXX010101000">
                  <span class="hint">
                    @switch (tipo()) {
                      @case ('fisica') { <span class="ok">✓ Persona física</span> }
                      @case ('moral') { <span class="ok">✓ Persona moral</span> }
                      @default { 13 caracteres persona física, 12 persona moral. }
                    }
                  </span>
                </div>
                <div class="field col-8">
                  <label for="razon">Nombre o razón social *</label>
                  <input class="input mayus" id="razon" name="razon" [(ngModel)]="form.factura.razon_social" required maxlength="254" placeholder="Sin «S.A. de C.V.» ni otro régimen societario">
                </div>
                <div class="field col-8">
                  <label for="regimen">Régimen fiscal *</label>
                  <select class="select" id="regimen" name="regimen" [(ngModel)]="form.factura.regimen_fiscal" required>
                    <option value="" disabled>Selecciona…</option>
                    @for (r of regimenes(); track r.clave) { <option [value]="r.clave">{{ r.clave }} · {{ r.descripcion }}</option> }
                  </select>
                </div>
                <div class="field col-4">
                  <label for="cp">Código postal del domicilio fiscal *</label>
                  <input class="input" id="cp" name="cp" [(ngModel)]="form.factura.codigo_postal" required inputmode="numeric" maxlength="5" pattern="[0-9]{5}">
                </div>
                <div class="field col-6">
                  <label for="uso">Uso de CFDI *</label>
                  <select class="select" id="uso" name="uso" [(ngModel)]="form.factura.uso_cfdi" required>
                    <option value="" disabled>Selecciona…</option>
                    @for (u of usos(); track u.clave) { <option [value]="u.clave">{{ u.clave }} · {{ u.descripcion }}</option> }
                  </select>
                </div>
                <div class="field col-6">
                  <label for="fcorreo">Correo electrónico *</label>
                  <input class="input" type="email" id="fcorreo" name="fcorreo" [(ngModel)]="form.factura.correo" required email maxlength="120">
                  @if (form.email && form.factura.correo !== form.email) {
                    <button type="button" class="link" (click)="form.factura.correo = form.email">Usar el correo del alumno ({{ form.email }})</button>
                  }
                </div>
              </div>
            }
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
    .fija { display: flex; align-items: center; gap: 8px; height: 42px; padding: 0 14px; border-radius: 12px; border: 1px dashed var(--line); background: var(--surface-2); font-weight: 600; color: var(--ink-2); }
    .fija .icon { color: var(--brand); font-size: 19px; }
    .fija .txt { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .hoy { margin-left: auto; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: var(--brand-50); color: var(--brand-600); }
    .ayuda { margin: 4px 0 14px; }
    .mayus { text-transform: uppercase; }
    .ok { color: var(--ok); font-weight: 700; }
    .link { align-self: flex-start; border: 0; background: none; padding: 0; color: var(--brand); font: 600 12px var(--font); cursor: pointer; }
    .link:hover { text-decoration: underline; }
    .resumen { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; margin-top: 18px; }
    .bloque { display: flex; gap: 12px; padding: 14px 16px; border-radius: 14px; background: var(--brand-50); }
    .bloque > .icon { font-size: 26px; color: var(--brand); }
    .bloque .et { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--brand-600); margin-bottom: 6px; }
    .bloque strong { font-size: 16px; }
    .linea { display: flex; justify-content: space-between; gap: 12px; font-size: 14px; padding: 2px 0; }
    .linea span:first-child::first-letter { text-transform: uppercase; }
    .linea.total { border-top: 1px dashed #9ccfe0; margin-top: 6px; padding-top: 6px; font-weight: 800; font-size: 16px; }
    .nota { color: var(--warn); margin-top: 4px; }
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
  cuotas = signal<Cuotas | null>(null);
  form: EstudianteForm = {
    nombre: '', apellidos: '', fecha_nacimiento: '', telefono: '', email: '', tutor: '',
    fecha_inscripcion: hoyIso(), mensualidad: null, cuota_inscripcion: null, activo: true, notas: '', horarios: [],
    factura: { requiere: false, rfc: '', razon_social: '', regimen_fiscal: '', codigo_postal: '', uso_cfdi: 'G03', correo: '' },
  };
  catalogos = signal<CatalogosSat | null>(null);

  ngOnInit(): void {
    this.api.horarios().subscribe((h) => this.horarios.set(h));
    this.api.catalogosSat().subscribe((c) => this.catalogos.set(c));
    const id = Number(this.id());
    this.api.cuotas().subscribe((c) => {
      this.cuotas.set(c);
      if (!id) {
        // Alumno nuevo: se proponen las cuotas vigentes (se pueden cambiar, p. ej. por un descuento).
        this.form.cuota_inscripcion = c.inscripcion;
        this.form.mensualidad = c.mensualidad;
        this.cargado.set(true);
      }
    });
    if (!id) return;
    this.api.estudiante(id).subscribe({
      next: (a) => {
        this.form = {
          nombre: a.nombre, apellidos: a.apellidos, fecha_nacimiento: a.fecha_nacimiento ?? '',
          telefono: a.telefono ?? '', email: a.email ?? '', tutor: a.tutor ?? '',
          fecha_inscripcion: a.fecha_inscripcion,
          mensualidad: a.mensualidad, cuota_inscripcion: a.cuota_inscripcion ?? 0,
          factura: {
            requiere: a.factura.requiere, rfc: a.factura.rfc ?? '', razon_social: a.factura.razon_social ?? '',
            regimen_fiscal: a.factura.regimen_fiscal ?? '', codigo_postal: a.factura.codigo_postal ?? '',
            uso_cfdi: a.factura.uso_cfdi ?? 'G03', correo: a.factura.correo ?? '',
          }, activo: a.activo, notas: a.notas ?? '', horarios: a.horarios.map((h) => h.id),
        };
        this.inicial.set([...this.form.horarios]);
        this.cargado.set(true);
      },
      error: (e) => this.errores.set(mensajeDeError(e)),
    });
  }

  primerPago(): Date | null {
    return primerPagoDe(this.form.fecha_inscripcion);
  }

  tipo(): 'fisica' | 'moral' | null {
    return tipoPersona(this.form.factura.rfc);
  }

  /** Régimen y uso de CFDI que aplican al tipo de persona del RFC (todos mientras no sea válido). */
  regimenes(): ClaveSat[] {
    return this.filtrar(this.catalogos()?.regimenes ?? []);
  }

  usos(): ClaveSat[] {
    return this.filtrar(this.catalogos()?.usos_cfdi ?? []);
  }

  private filtrar(lista: ClaveSat[]): ClaveSat[] {
    const t = this.tipo();
    return t ? lista.filter((c) => (t === 'fisica' ? c.fisica : c.moral)) : lista;
  }

  dia(): number | null {
    return diaDe(this.form.fecha_inscripcion);
  }

  esPasado(fecha: Date): boolean {
    return fecha.getTime() < new Date(new Date().toDateString()).getTime();
  }

  alternar(id: number): void {
    const h = this.form.horarios;
    this.form.horarios = h.includes(id) ? h.filter((x) => x !== id) : [...h, id];
  }

  guardar(): void {
    this.guardando.set(true);
    this.errores.set([]);
    const id = Number(this.id());
    const f = this.form.factura;
    f.rfc = f.rfc.toUpperCase().replace(/[\s-]/g, '');
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
