import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appsettings } from '../Settings/appsettings';

export interface LibroMayor {
  desde: string; hasta: string;
  totalIngresos: number; totalEgresos: number;
  cuentasPorPagar: number; utilidadBruta: number;
  ventas: any[]; compras: any[];
}

export interface AuditoriaStock {
  capitalAlmacenado: number;
  totalProductos: number;
  productos: any[];
}

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private url = `${appsettings.apiUrl}/reportes`;

  constructor(private http: HttpClient) {}

  libroMayor(desde: string, hasta: string): Observable<LibroMayor> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<LibroMayor>(`${this.url}/libro-mayor`, { params });
  }

  auditoriaStock(): Observable<AuditoriaStock> {
    return this.http.get<AuditoriaStock>(`${this.url}/stock`);
  }

  analisisIa(desde: string, hasta: string): Observable<{ analisis: string; fuente: string }> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<{ analisis: string; fuente: string }>(`${this.url}/analisis-ia`, { params });
  }

  analisisIaStock(): Observable<{ analisis: string; fuente: string }> {
    return this.http.get<{ analisis: string; fuente: string }>(`${this.url}/analisis-ia-stock`);
  }
}
