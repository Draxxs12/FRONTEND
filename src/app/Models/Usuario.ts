export interface Rol {
  id:     number;
  nombre: string;
}

export interface Usuario {
  id?:            number;
  nombre:         string;
  email:          string;
  rol?:           Rol | null;
  activo?:        boolean;
  createdAt?:     string;
  registradoPor?: string;
}

export interface UsuarioForm {
  nombre:    string;
  email:     string;
  password?: string;
  rolId:     number | null;
  activo:    boolean;
}
