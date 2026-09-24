export interface DetalleDevolucion {
  id?:            number;
  producto?:      { id: number; nombre?: string; codigo?: string } | null;
  cantidad:       number;
  precioUnitario: number;
  subtotal?:      number;
}

export interface Devolucion {
  id?:             number;
  numeroNota?:     string;
  venta?:          { id: number; numeroComprobante?: string; cliente?: { nombre?: string } | null } | null;
  usuario?:        { id: number; nombre?: string } | null;
  motivo?:         string;
  montoReembolso?: number;
  tipoReembolso?:  'Efectivo' | 'Tarjeta' | 'NotaCredito';
  createdAt?:      string;
  detalles?:       DetalleDevolucion[];
}
