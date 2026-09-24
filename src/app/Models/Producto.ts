export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  categoria: {
    id: number;
    nombre: string;
  } | null;
  precioCompra: number;
  precioVenta: number;
  stock: number;
  stockMinimo: number;
  activo: boolean;
  createdAt?: string;
  registradoPor?: string;
}

export interface ProductoForm {
  codigo: string;
  nombre: string;
  categoria: { id: number } | null;
  precioCompra: number;
  precioVenta: number;
  stock: number;
  stockMinimo: number;
  activo: boolean;
}