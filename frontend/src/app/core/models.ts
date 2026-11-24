/** Cuándo le toca pagar: hoy, en los próximos 7 días o más adelante. La web no cobra pagos. */
export type EstadoPago = 'hoy' | 'pronto' | 'programado';

export interface HorarioRef {
  id: number;
  nombre: string;
  rango: string;
  dias_texto: string;
  nivel: string | null;
}

export interface Horario {
  id: number;
  nombre: string;
  dias: string[];
  dias_texto: string;
  hora_inicio: string;
  hora_fin: string;
  rango: string;
  nivel: string | null;
  instructor: string | null;
  cupo: number;
  ocupados: number;
  lleno: boolean;
}

export interface Estudiante {
  id: number;
  nombre: string;
  apellidos: string;
  nombre_completo: string;
  fecha_nacimiento: string | null;
  edad: number | null;
  telefono: string | null;
  email: string | null;
  tutor: string | null;
  dia_pago: number;
  /** Día en que se inscribió; ese mes ya queda cubierto. */
  fecha_inscripcion: string;
  /** Primer pago: el día de pago del mes siguiente a la inscripción. */
  primer_pago: string;
  /** Siguiente fecha en que le toca pagar (AAAA-MM-DD). */
  proximo_pago: string;
  dias_para_pago: number;
  mensualidad: number;
  /** Lo que pagó de inscripción al entrar. */
  cuota_inscripcion: number | null;
  activo: boolean;
  notas: string | null;
  estado: EstadoPago;
  horarios: HorarioRef[];
  creado: string;
  factura: Factura;
}

/** Datos de facturación (CFDI 4.0) del alumno. */
export interface Factura {
  requiere: boolean;
  rfc: string | null;
  razon_social: string | null;
  tipo_persona: 'fisica' | 'moral' | null;
  regimen_fiscal: string | null;
  regimen_texto: string | null;
  codigo_postal: string | null;
  uso_cfdi: string | null;
  uso_texto: string | null;
  correo: string | null;
}

export interface FacturaForm {
  requiere: boolean;
  rfc: string;
  razon_social: string;
  regimen_fiscal: string;
  codigo_postal: string;
  uso_cfdi: string;
  correo: string;
}

export interface ClaveSat {
  clave: string;
  descripcion: string;
  fisica: boolean;
  moral: boolean;
}

export interface CatalogosSat {
  regimenes: ClaveSat[];
  usos_cfdi: ClaveSat[];
}

/** Próximo pago de un alumno que pide factura. */
export interface PorFacturar {
  estudiante_id: number;
  alumno: string;
  concepto: string;
  importe: number;
  fecha: string;
  dias: number;
  cuando: EstadoPago;
  factura: Factura;
}

export interface HorarioDetalle extends Horario {
  estudiantes: Estudiante[];
}

export interface ClaseHoy extends Horario {
  alumnos: { id: number; nombre_completo: string }[];
}

export interface Panel {
  fecha: string;
  activos: number;
  pagan_hoy: number;
  pagan_pronto: number;
  ingreso_mensual: number;
  horarios: number;
  clases_hoy: ClaseHoy[];
  proximos_pagos: Estudiante[];
}

export interface EstudianteForm {
  nombre: string;
  apellidos: string;
  fecha_nacimiento: string;
  telefono: string;
  email: string;
  tutor: string;
  fecha_inscripcion: string;
  mensualidad: number | null;
  cuota_inscripcion: number | null;
  activo: boolean;
  notas: string;
  horarios: number[];
  factura: FacturaForm;
}

export interface HorarioForm {
  nombre: string;
  dias: string[];
  hora_inicio: string;
  hora_fin: string;
  nivel: string;
  instructor: string;
  cupo: number | null;
}

// ---- Catálogos ----------------------------------------------------------------

export const ESTADOS: Record<EstadoPago, { texto: string; tono: string; icono: string }> = {
  hoy: { texto: 'Paga hoy', tono: 'warn', icono: 'notifications_active' },
  pronto: { texto: 'Próximos 7 días', tono: 'info', icono: 'event_upcoming' },
  programado: { texto: 'Programado', tono: 'idle', icono: 'event' },
};

export const ORDEN_ESTADOS: EstadoPago[] = ['hoy', 'pronto', 'programado'];

export const DIAS = [
  { codigo: 'lun', nombre: 'Lunes', corto: 'L' },
  { codigo: 'mar', nombre: 'Martes', corto: 'M' },
  { codigo: 'mie', nombre: 'Miércoles', corto: 'X' },
  { codigo: 'jue', nombre: 'Jueves', corto: 'J' },
  { codigo: 'vie', nombre: 'Viernes', corto: 'V' },
  { codigo: 'sab', nombre: 'Sábado', corto: 'S' },
  { codigo: 'dom', nombre: 'Domingo', corto: 'D' },
];

export const NIVELES = ['Bebés', 'Principiante', 'Intermedio', 'Avanzado', 'Competencia', 'Adultos'];

export function hoyIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** "Hoy", "Mañana" o "En 5 días". */
export function cuandoPaga(dias: number): string {
  return dias === 0 ? 'Hoy' : dias === 1 ? 'Mañana' : `En ${dias} días`;
}

/** Cuotas vigentes de la escuela. */
export interface Cuotas {
  inscripcion: number;
  mensualidad: number;
  actualizados?: number;
}

/**
 * Misma regla que el backend: se paga el mismo día de la inscripción, cada mes, empezando
 * el mes siguiente. Si ese mes no tiene el día (30 o 31 en febrero, 31 en abril…),
 * el pago se recorre al día 1 del mes siguiente.
 */
export function fechaDePago(anio: number, mes0: number, dia: number): Date {
  const ultimo = new Date(anio, mes0 + 1, 0).getDate();
  return dia <= ultimo ? new Date(anio, mes0, dia) : new Date(anio, mes0 + 1, 1);
}

export function primerPagoDe(inscripcion: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inscripcion ?? '')) return null;
  const [a, m, d] = inscripcion.split('-').map(Number);
  return fechaDePago(a, m, d); // m (1–12) usado como índice 0–11 = mes siguiente
}

export function diaDe(inscripcion: string): number | null {
  const d = Number((inscripcion ?? '').slice(8, 10));
  return d >= 1 && d <= 31 ? d : null;
}

/** RFC de persona física (13) o moral (12); null si todavía no es válido. */
export function tipoPersona(rfc: string): 'fisica' | 'moral' | null {
  const r = (rfc ?? '').toUpperCase().replace(/[\s-]/g, '');
  if (!/^[A-ZÑ&]{3,4}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[A-Z\d]{2}[A\d]$/.test(r)) return null;
  return r.length === 13 ? 'fisica' : 'moral';
}

/** Texto listo para pegar en el portal de facturación. */
export function textoFactura(f: Factura, concepto?: string, importe?: string): string {
  const lineas = [
    `RFC: ${f.rfc ?? ''}`,
    `Nombre o razón social: ${f.razon_social ?? ''}`,
    `Régimen fiscal: ${f.regimen_fiscal ?? ''} - ${f.regimen_texto ?? ''}`,
    `Código postal: ${f.codigo_postal ?? ''}`,
    `Uso de CFDI: ${f.uso_cfdi ?? ''} - ${f.uso_texto ?? ''}`,
    `Correo: ${f.correo ?? ''}`,
  ];
  if (concepto) lineas.push(`Concepto: ${concepto}`);
  if (importe) lineas.push(`Importe: ${importe}`);
  return lineas.join('\n');
}
