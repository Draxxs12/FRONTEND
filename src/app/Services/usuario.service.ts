import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario, UsuarioForm, Rol } from '../Models/Usuario';
import { appsettings } from '../Settings/appsettings';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private url = `${appsettings.apiUrl}/usuarios`;
  private rolesUrl = `${appsettings.apiUrl}/roles`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.url);
  }

  roles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(this.rolesUrl);
  }

  crearRol(nombre: string): Observable<Rol> {
    return this.http.post<Rol>(this.rolesUrl, { nombre });
  }

  crear(u: UsuarioForm): Observable<Usuario> {
    return this.http.post<Usuario>(this.url, u);
  }

  actualizar(id: number, u: UsuarioForm): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.url}/${id}`, u);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
