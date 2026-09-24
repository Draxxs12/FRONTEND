import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Caja, MovimientoCaja } from '../Models/Caja';
import { appsettings } from '../Settings/appsettings';

@Injectable({ providedIn: 'root' })
export class CajaService {
  private url = `${appsettings.apiUrl}/caja`;

  constructor(private http: HttpClient) {}

  actual(): Observable<Caja | null> {
    return this.http.get<Caja | null>(`${this.url}/actual`);
  }

  historial(): Observable<Caja[]> {
    return this.http.get<Caja[]>(this.url);
  }

  movimientos(cajaId: number): Observable<MovimientoCaja[]> {
    return this.http.get<MovimientoCaja[]>(`${this.url}/${cajaId}/movimientos`);
  }

  abrir(usuarioId: number, montoInicial: number): Observable<Caja> {
    return this.http.post<Caja>(`${this.url}/abrir`, { usuarioId, montoInicial });
  }

  cerrar(observaciones: string): Observable<Caja> {
    return this.http.post<Caja>(`${this.url}/cerrar`, { observaciones });
  }

  registrarMovimiento(mov: MovimientoCaja): Observable<MovimientoCaja> {
    return this.http.post<MovimientoCaja>(`${this.url}/movimiento`, mov);
  }
}
