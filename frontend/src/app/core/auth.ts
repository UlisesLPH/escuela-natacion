import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, tap, throwError } from 'rxjs';

const CLAVE_TOKEN = 'natacion.token';
const CLAVE_USUARIO = 'natacion.usuario';

function leer(clave: string): string | null {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private _token = leer(CLAVE_TOKEN);

  readonly usuario = signal<string | null>(leer(CLAVE_USUARIO));

  get token(): string | null {
    return this._token;
  }

  autenticado(): boolean {
    return !!this._token;
  }

  login(usuario: string, password: string) {
    return this.http.post<{ token: string; usuario: string }>('/api/login', { usuario, password }).pipe(
      tap((r) => {
        this._token = r.token;
        this.usuario.set(r.usuario);
        try {
          localStorage.setItem(CLAVE_TOKEN, r.token);
          localStorage.setItem(CLAVE_USUARIO, r.usuario);
        } catch {
          /* sin almacenamiento: la sesión dura lo que la pestaña */
        }
      }),
    );
  }

  salir(): void {
    this._token = null;
    this.usuario.set(null);
    try {
      localStorage.removeItem(CLAVE_TOKEN);
      localStorage.removeItem(CLAVE_USUARIO);
    } catch {
      /* nada que limpiar */
    }
    this.router.navigate(['/login']);
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token;
  const peticion = token && req.url.startsWith('/api')
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;
  return next(peticion).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.endsWith('/login')) {
        auth.salir();
      }
      return throwError(() => err);
    }),
  );
};

export const authGuard: CanActivateFn = () =>
  inject(AuthService).autenticado() || inject(Router).createUrlTree(['/login']);

/** Convierte una respuesta de error de la API en texto para el usuario. */
export function mensajeDeError(err: unknown): string[] {
  if (err instanceof HttpErrorResponse) {
    if (Array.isArray(err.error?.errores)) return err.error.errores;
    if (typeof err.error?.error === 'string') return [err.error.error];
    if (err.status === 0) return ['No se pudo conectar con el servidor.'];
  }
  return ['Ocurrió un error inesperado. Intenta de nuevo.'];
}
