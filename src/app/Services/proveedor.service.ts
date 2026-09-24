import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Proveedor } from '../Models/Proveedor';

@Injectable({ providedIn: 'root' })
export class ProveedorService {
  private url = 'http://localhost:8080/api/proveedores';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.url);
  }

  getById(id: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.url}/${id}`);
  }

  create(p: Proveedor): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.url, p);
  }

  update(id: number, p: Proveedor): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.url}/${id}`, p);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}