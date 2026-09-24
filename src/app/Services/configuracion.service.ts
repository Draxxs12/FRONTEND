import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Configuracion } from '../Models/Configuracion';
import { appsettings } from '../Settings/appsettings';

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private url = `${appsettings.apiUrl}/configuracion`;

  constructor(private http: HttpClient) {}

  obtener(): Observable<Configuracion> {
    return this.http.get<Configuracion>(this.url);
  }

  guardar(c: Configuracion): Observable<Configuracion> {
    return this.http.put<Configuracion>(this.url, c);
  }
}
