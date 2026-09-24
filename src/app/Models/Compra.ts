import { Proveedor } from './Proveedor';
import { Producto }  from './Producto';

export interface DetalleCompra {
  id?:             number;
  producto?:       Producto;
  productoId?:     number;
  cantidad?:       number;
  precioUnitario?: number;
  subtotal?:       number;
}

export interface Compra {
  id?:            number;
  numeroOrden?:   string;
  proveedor?:     Proveedor;
  proveedorId?:   number;
  usuario?:       { id: number };
  subtotal?:      number;
  igv?:           number;
  total?:         number;
  tipoPago?:      string;
  estado?:        string;
  fechaEsperada?: string;
  observaciones?: string;
  createdAt?:     string;
  detalles?:      DetalleCompra[];
}