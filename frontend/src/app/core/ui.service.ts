import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  texto: string;
  tipo: 'ok' | 'error' | 'info';
}

export interface Pregunta {
  titulo: string;
  mensaje: string;
  accion: string;
  peligro: boolean;
  responder: (si: boolean) => void;
}

/** Avisos flotantes y diálogo de confirmación compartidos por toda la app. */
@Injectable({ providedIn: 'root' })
export class UiService {
  readonly toasts = signal<Toast[]>([]);
  readonly pregunta = signal<Pregunta | null>(null);
  private siguiente = 1;

  avisar(texto: string, tipo: Toast['tipo'] = 'ok'): void {
    const id = this.siguiente++;
    this.toasts.update((t) => [...t, { id, texto, tipo }]);
    setTimeout(() => this.cerrarToast(id), tipo === 'error' ? 6000 : 3500);
  }

  cerrarToast(id: number): void {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
  }

  confirmar(titulo: string, mensaje: string, accion = 'Eliminar', peligro = true): Promise<boolean> {
    return new Promise((resolve) => {
      this.pregunta.set({
        titulo, mensaje, accion, peligro,
        responder: (si) => {
          this.pregunta.set(null);
          resolve(si);
        },
      });
    });
  }
}
