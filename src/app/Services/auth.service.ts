import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { appsettings } from '../Settings/appsettings';

export interface LoginRequest { email: string; password: string; }

export interface LoginResponse {
  token: string;
  nombre: string;
  email: string;
  rol: string;
}

export interface PerfilResponse {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  createdAt?: string;
  registradoPor?: string;
  dobleFactorActivo: boolean;
}

export interface MfaResponse {
  requiresMfa: boolean;
  challengeToken: string;
  email: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${appsettings.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  getMiPerfil(): Observable<PerfilResponse> {
    return this.http.get<PerfilResponse>(`${this.apiUrl}/me`);
  }

  solicitarCambioPassword(currentPassword: string): Observable<{challengeToken: string; email: string; message: string}> {
    return this.http.post<{challengeToken: string; email: string; message: string}>(
      `${this.apiUrl}/change-password/request`, { currentPassword }
    );
  }

  confirmarCambioPassword(challengeToken: string, code: string, newPassword: string): Observable<{message: string}> {
    return this.http.post<{message: string}>(`${this.apiUrl}/change-password/confirm`, {
      token: challengeToken, code, newPassword
    });
  }

  login(datos: LoginRequest): Observable<MfaResponse> {
    return this.http.post<MfaResponse>(`${this.apiUrl}/login`, datos);
  }

  resendMfa(challengeToken: string): Observable<MfaResponse> {
    return this.http.post<MfaResponse>(`${this.apiUrl}/resend-mfa`, {
      token: challengeToken
    });
  }

  verifyMfa(challengeToken: string, code: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/verify-mfa`, {
      token: challengeToken, code
    }).pipe(tap(res => this.guardarSesion(res)));
  }

  forgotPassword(email: string): Observable<{message: string; challengeToken?: string}> {
    return this.http.post<{message: string; challengeToken?: string}>(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(challengeToken: string, code: string, newPassword: string): Observable<{message: string}> {
    return this.http.post<{message: string}>(`${this.apiUrl}/reset-password`, {
      token: challengeToken, code, newPassword
    });
  }

  private guardarSesion(res: LoginResponse): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('nombre', res.nombre);
    localStorage.setItem('rol', res.rol);
    const id = this.decodeUsuarioId(res.token);
    if (id != null) localStorage.setItem('usuarioId', String(id));
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('nombre');
    localStorage.removeItem('rol');
    localStorage.removeItem('usuarioId');
  }

  estaAutenticado(): boolean { return !!localStorage.getItem('token'); }
  getRol(): string | null { return localStorage.getItem('rol'); }
  getNombre(): string | null { return localStorage.getItem('nombre'); }

  getUsuarioId(): number {
    const guardado = localStorage.getItem('usuarioId');
    if (guardado) return Number(guardado);
    const token = localStorage.getItem('token');
    const id = token ? this.decodeUsuarioId(token) : null;
    return id != null ? id : 0;
  }

  private decodeUsuarioId(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.usuarioId ?? null;
    } catch { return null; }
  }
}
