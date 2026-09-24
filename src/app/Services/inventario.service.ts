import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MovimientoInventario } from '../Models/Inventario';
import { appsettings } from '../Settings/appsettings';

export interface AjusteRequest {
  usuarioId:  number;
  productoId: number;
  nuevoStock: number;
  motivo:     string;
}

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private url = `${appsettings.apiUrl}/inventario`;

  constructor(private http: HttpClient) {}

  listar(): Observable<MovimientoInventario[]> {
    return this.http.get<MovimientoInventario[]>(this.url);
  }

  ajustar(req: AjusteRequest): Observable<MovimientoInventario> {
    return this.http.post<MovimientoInventario>(`${this.url}/ajuste`, req);
  }
}
