export interface MovimientoInventario {
  id:           number;
  producto:     { id: number; nombre: string; codigo: string } | null;
  usuario:      { id: number; nombre: string } | null;
  tipo:         'Entrada' | 'Salida' | 'Ajuste';
  cantidad:     number;
  stockAntes:   number;
  stockDespues: number;
  motivo:       string;
  createdAt:    string;
}
