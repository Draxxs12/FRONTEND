export interface MovimientoCaja {
  id?:          number;
  tipo:         'Ingreso' | 'Egreso';
  monto:        number;
  descripcion?: string;
  createdAt?:   string;
}

export interface Caja {
  id?:            number;
  usuario?:       { id: number; nombre?: string } | null;
  montoInicial:   number;
  montoFinal?:    number;
  totalVentas:    number;
  totalEgresos:   number;
  estado:         'Abierta' | 'Cerrada';
  observaciones?: string;
  apertura?:      string;
  cierre?:        string;
}
