export interface DetalleVenta {
  id: number;
  producto: { id: number; nombre: string; codigo: string } | null;  // ← agrega | null
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}
export interface Venta {
  id: number;
  numeroComprobante: string;
  cliente: { id: number; nombre: string } | null;
  usuario: { id: number; nombre: string };
  subtotal: number;
  igv: number;
  total: number;
  tipoPago: 'Efectivo' | 'Tarjeta' | 'Yape' | 'Plin';
  estado: 'Completada' | 'Anulada';   // ← eliminado 'Pendiente'
  tipoComprobante?: 'Boleta' | 'Factura';
  rucCliente?: string;
  createdAt: string;
}