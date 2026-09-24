// src/app/Services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { appsettings } from '../Settings/appsettings';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  nombre: string;
  email: string;
  rol: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = `${appsettings.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  login(datos: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, datos).pipe(
      tap((res) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('nombre', res.nombre);
        localStorage.setItem('rol', res.rol);
        const id = this.decodeUsuarioId(res.token);
        if (id != null) localStorage.setItem('usuarioId', String(id));
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('nombre');
    localStorage.removeItem('rol');
    localStorage.removeItem('usuarioId');
  }

  estaAutenticado(): boolean {
    return !!localStorage.getItem('token');
  }

  getRol(): string | null {
    return localStorage.getItem('rol');
  }

  getNombre(): string | null {
    return localStorage.getItem('nombre');
  }

  /** Id del usuario logueado (claim "usuarioId" del JWT). */
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
    } catch {
      return null;
    }
  }
}
