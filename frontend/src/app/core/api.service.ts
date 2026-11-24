import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  CatalogosSat, Cuotas, Estudiante, EstudianteForm, Horario, HorarioDetalle, HorarioForm, Panel, PorFacturar,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  panel() {
    return this.http.get<Panel>('/api/panel');
  }

  // Estudiantes
  estudiantes(inactivos = false) {
    const params = new HttpParams().set('inactivos', inactivos ? '1' : '0');
    return this.http.get<Estudiante[]>('/api/estudiantes', { params });
  }
  estudiante(id: number) {
    return this.http.get<Estudiante>(`/api/estudiantes/${id}`);
  }
  crearEstudiante(form: EstudianteForm) {
    return this.http.post<Estudiante>('/api/estudiantes', form);
  }
  editarEstudiante(id: number, form: EstudianteForm) {
    return this.http.put<Estudiante>(`/api/estudiantes/${id}`, form);
  }
  eliminarEstudiante(id: number) {
    return this.http.delete<void>(`/api/estudiantes/${id}`);
  }

  // Horarios
  horarios() {
    return this.http.get<Horario[]>('/api/horarios');
  }
  horario(id: number) {
    return this.http.get<HorarioDetalle>(`/api/horarios/${id}`);
  }
  crearHorario(form: HorarioForm) {
    return this.http.post<HorarioDetalle>('/api/horarios', form);
  }
  editarHorario(id: number, form: HorarioForm) {
    return this.http.put<HorarioDetalle>(`/api/horarios/${id}`, form);
  }
  eliminarHorario(id: number) {
    return this.http.delete<void>(`/api/horarios/${id}`);
  }

  // Cuotas
  cuotas() {
    return this.http.get<Cuotas>('/api/cuotas');
  }
  guardarCuotas(cuotas: Cuotas, aplicarATodos: boolean) {
    return this.http.put<Cuotas>('/api/cuotas', { ...cuotas, aplicar_a_todos: aplicarATodos });
  }

  // Facturación
  catalogosSat() {
    return this.http.get<CatalogosSat>('/api/catalogos/sat');
  }
  facturacion() {
    return this.http.get<PorFacturar[]>('/api/facturacion');
  }
}
