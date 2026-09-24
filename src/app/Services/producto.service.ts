import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto, ProductoForm } from '../Models/Producto';
import { appsettings } from '../Settings/appsettings';
@Injectable({
  providedIn: 'root'
})
export class ProductoService {
 
  private apiUrl = 'http://localhost:8080/api/productos';
 
  constructor(private http: HttpClient) {}
 
  // GET /api/productos — lista todos los activos
  listar(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }
 
  // GET /api/productos/:id — obtener uno por id
  obtener(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }
 
  // GET /api/productos/buscar?nombre=xxx
  buscarPorNombre(nombre: string): Observable<Producto[]> {
    const params = new HttpParams().set('nombre', nombre);
    return this.http.get<Producto[]>(`${this.apiUrl}/buscar`, { params });
  }
 
  // GET /api/productos/stock-bajo
  stockBajo(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/stock-bajo`);
  }
 
  // POST /api/productos — crear nuevo
  crear(producto: ProductoForm): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, producto);
  }
 
  // PUT /api/productos/:id — actualizar
  actualizar(id: number, producto: ProductoForm): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${id}`, producto);
  }
 
  // DELETE /api/productos/:id — baja lógica (activo = false)
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
 