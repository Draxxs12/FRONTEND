// src/app/Models/Cliente.ts

export interface Cliente {
  id?:             number;
  nombre:          string;
  tipoDocumento:   'DNI' | 'RUC' | 'CE';
  numeroDocumento: string;
  telefono:        string;
  email:           string;
  createdAt?:      string;
  registradoPor?:  string;
}