import { Injectable }                from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError }    from 'rxjs';
import { catchError }                from 'rxjs/operators';
import { Venta, DetalleVenta }       from '../Models/Venta';
import { appsettings }               from '../Settings/appsettings';

export interface VentaPayload {
  usuarioId: number;
  venta: {
    cliente: { id: number } | null;
    tipoPago: string;
    tipoComprobante?: string;
    rucCliente?: string;
    numeroComprobante?: string;
  };
  detalles: { producto: { id: number }; cantidad: number; precioUnitario: number }[];
}

@Injectable({ providedIn: 'root' })
export class VentaService {

  private apiUrl = `${appsettings.apiUrl}/ventas`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Venta[]> {
    return this.http.get<Venta[]>(this.apiUrl).pipe(
      catchError(this.manejarError)
    );
  }

  registrar(payload: VentaPayload): Observable<Venta> {
    return this.http.post<Venta>(this.apiUrl, payload).pipe(
      catchError(this.manejarError)
    );
  }

  anular(id: number, usuarioId: number): Observable<Venta> {
    const params = new HttpParams().set('usuarioId', usuarioId);
    return this.http.put<Venta>(`${this.apiUrl}/${id}/anular`, {}, { params }).pipe(
      catchError(this.manejarError)
    );
  }

  buscarPorId(id: number): Observable<Venta> {
    return this.http.get<Venta>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.manejarError)
    );
  }

  obtenerDetalle(id: number): Observable<DetalleVenta[]> {
    return this.http.get<DetalleVenta[]>(`${this.apiUrl}/${id}/detalle`).pipe(
      catchError(this.manejarError)
    );
  }
  topClientes(): Observable<{ nombre: string; total: number }[]> {
  return this.http.get<{ nombre: string; total: number }[]>(
    `${this.apiUrl}/top-clientes`
  ).pipe(
    catchError(this.manejarError)
  );
  }
  // ✅ Extrae el mensaje del backend si viene en el body del 400
  private manejarError(err: HttpErrorResponse): Observable<never> {
    let mensaje = 'Error inesperado. Intenta nuevamente.';
    if (err.status === 0) {
      mensaje = 'No se pudo conectar con el servidor.';
    } else if (err.status === 400 && typeof err.error === 'string') {
      mensaje = err.error; // mensaje del backend (ej: "Stock insuficiente para...")
    } else if (err.status === 404) {
      mensaje = 'Recurso no encontrado.';
    } else if (err.status === 500) {
      mensaje = 'Error interno del servidor.';
    }
    return throwError(() => new Error(mensaje));
  }
}