import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Devolucion } from '../Models/Devolucion';
import { appsettings } from '../Settings/appsettings';

export interface DevolucionRequest {
  usuarioId:      number;
  ventaId:        number;
  motivo:         string;
  tipoReembolso:  string;
  detalles: { producto: { id: number }; cantidad: number; precioUnitario: number }[];
}

@Injectable({ providedIn: 'root' })
export class DevolucionService {
  private url = `${appsettings.apiUrl}/devoluciones`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Devolucion[]> {
    return this.http.get<Devolucion[]>(this.url);
  }

  crear(req: DevolucionRequest): Observable<Devolucion> {
    return this.http.post<Devolucion>(this.url, req);
  }
}
