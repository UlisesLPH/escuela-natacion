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
  /** Siguiente fecha en que le toca pagar (AAAA-MM-DD). */
  proximo_pago: string;
  dias_para_pago: number;
  mensualidad: number;
  activo: boolean;
  notas: string | null;
  estado: EstadoPago;
  horarios: HorarioRef[];
  creado: string;
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
  dia_pago: number | null;
  mensualidad: number | null;
  activo: boolean;
  notas: string;
  horarios: number[];
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
