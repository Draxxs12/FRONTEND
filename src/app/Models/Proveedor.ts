// src/app/Models/Proveedor.ts

export interface Proveedor {
  id?:        number;
  empresa:    string;
  ruc:        string;
  contacto:   string;
  telefono:   string;
  email:      string;
  direccion:  string;
  activo?:    boolean;
  createdAt?: string;
  registradoPor?: string;
}