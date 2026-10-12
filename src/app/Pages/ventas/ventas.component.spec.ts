import { VentasComponent } from './ventas.component';

function crear(ventas: any[] = []) {
  const ventaService: any = {};
  const auth: any = {};
  const comprobante: any = {};
  const cdr: any = { detectChanges: vi.fn() };
  const c = new VentasComponent(ventaService, auth, comprobante, cdr);
  c.ventas = ventas;
  return c;
}

const v = (id: number, createdAt: string, total = 100, estado = 'Completada') =>
  ({ id, createdAt, total, estado }) as any;

describe('H0035 Listar historial de ventas (CP-037, CP-038)', () => {
  it('sin filtros muestra todas las ventas', () => {
    const c = crear([v(1, '2026-09-10T10:00:00'), v(2, '2026-09-11T10:00:00')]);
    expect(c.ventasFiltradas.length).toBe(2);
  });
  it('sin ventas la lista queda vacía sin error', () => {
    const c = crear([]);
    expect(c.ventasFiltradas).toEqual([]);
    expect(c.totalVentas).toBe(0);
  });
});

describe('H0036 Filtrar historial por fechas (CP-039, CP-040, CP-041)', () => {
  const lista = [
    v(1, '2026-09-09T23:59:59'),   // un segundo antes del rango
    v(2, '2026-09-10T00:00:00'),   // inicio del rango
    v(3, '2026-09-12T12:00:00'),
    v(4, '2026-09-15T23:59:59'),   // último segundo de la fecha final
    v(5, '2026-09-16T00:00:00'),   // un segundo después del rango
  ];

  it('lista solo las ventas del rango', () => {
    const c = crear(lista);
    c.fechaInicio = '2026-09-10'; c.fechaFin = '2026-09-15';
    expect(c.ventasFiltradas.map(x => x.id)).toEqual([2, 3, 4]);
  });
  it('la fecha final incluye todo el día hasta 23:59:59 (valor límite)', () => {
    const c = crear(lista);
    c.fechaFin = '2026-09-15';
    expect(c.ventasFiltradas.map(x => x.id)).toContain(4);
    expect(c.ventasFiltradas.map(x => x.id)).not.toContain(5);
  });
  it('la fecha inicial incluye las ventas desde las 00:00:00 (valor límite)', () => {
    const c = crear(lista);
    c.fechaInicio = '2026-09-10';
    expect(c.ventasFiltradas.map(x => x.id)).toContain(2);
    expect(c.ventasFiltradas.map(x => x.id)).not.toContain(1);
  });
  it('con fecha inicial posterior a la final la lista queda vacía (hoy no avisa)', () => {
    const c = crear(lista);
    c.fechaInicio = '2026-09-15'; c.fechaFin = '2026-09-10';
    expect(c.ventasFiltradas).toEqual([]);
  });
  it('un día sin ventas devuelve lista vacía', () => {
    const c = crear(lista);
    c.fechaInicio = '2026-09-20'; c.fechaFin = '2026-09-20';
    expect(c.ventasFiltradas).toEqual([]);
  });
});

describe('H0036 Filtrar por estado', () => {
  const lista = [v(1, '2026-09-10T10:00:00'), v(2, '2026-09-10T11:00:00', 50, 'Anulada')];
  it('"Todos" muestra completadas y anuladas', () => {
    expect(crear(lista).ventasFiltradas.length).toBe(2);
  });
  it('filtra solo las anuladas', () => {
    const c = crear(lista); c.estadoFiltro = 'Anulada';
    expect(c.ventasFiltradas.map(x => x.id)).toEqual([2]);
  });
});

describe('H0037 Resumen de ventas (CP-042, CP-043)', () => {
  it('los totales coinciden con la suma de las ventas completadas', () => {
    const c = crear([v(1, '2026-09-10T10:00:00', 100), v(2, '2026-09-10T11:00:00', 50.5),
                     v(3, '2026-09-10T12:00:00', 999, 'Anulada')]);
    expect(c.totalVentas).toBe(150.5);
    expect(c.numVentas).toBe(2);
    expect(c.numAnuladas).toBe(1);
  });
  it('sin ventas los totales son 0', () => {
    const c = crear([]);
    expect(c.totalVentas).toBe(0);
    expect(c.numVentas).toBe(0);
    expect(c.numAnuladas).toBe(0);
  });
  it('el resumen respeta el filtro de fechas', () => {
    const c = crear([v(1, '2026-09-10T10:00:00', 100), v(2, '2026-09-20T10:00:00', 70)]);
    c.fechaInicio = '2026-09-15';
    expect(c.totalVentas).toBe(70);
  });
});
