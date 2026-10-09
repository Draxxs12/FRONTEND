import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';

const hoy = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

function crear(productos: any[], clientes: any[], ventas: any[]) {
  const ps: any = { listar: vi.fn(() => of(productos)) };
  const cs: any = { getAll: vi.fn(() => of(clientes)) };
  const vs: any = { listar: vi.fn(() => of(ventas)), topClientes: vi.fn(() => of([])) };
  const cps: any = { getAll: vi.fn(() => of([])) };
  const cdr: any = { detectChanges: vi.fn() };
  return new DashboardComponent(ps, cs, vs, cps, cdr);
}

describe('HU-S2-01 / HU-S2-05 KPIs y stock crítico del Dashboard', () => {
  const productos = [
    { id: 1, nombre: 'A', activo: true,  stock: 3, stockMinimo: 5 },   // crítico
    { id: 2, nombre: 'B', activo: true,  stock: 20, stockMinimo: 5 },  // normal
    { id: 3, nombre: 'C', activo: false, stock: 0, stockMinimo: 5 },   // inactivo: no cuenta
  ];

  it('calcula productos activos y stock crítico', () => {
    const c = crear(productos, [], []);
    c.ngOnInit();
    expect(c.totalProductos).toBe(2);
    expect(c.totalStockBajo).toBe(1);
  });
  it('stock igual al mínimo es crítico (valor límite)', () => {
    const c = crear([{ id: 1, activo: true, stock: 5, stockMinimo: 5 }], [], []);
    c.ngOnInit();
    expect(c.totalStockBajo).toBe(1);
  });
  it('un producto inactivo nunca es crítico', () => {
    const c = crear([{ id: 1, activo: false, stock: 0, stockMinimo: 5 }], [], []);
    c.ngOnInit();
    expect(c.totalStockBajo).toBe(0);
  });
  it('cuenta el total de clientes', () => {
    const c = crear([], [{ id: 1 }, { id: 2 }, { id: 3 }], []);
    c.ngOnInit();
    expect(c.totalClientes).toBe(3);
  });
  it('ventasHoy suma solo las Completadas de hoy', () => {
    const ventas = [
      { estado: 'Completada', total: 100, createdAt: hoy() + 'T10:00:00' },
      { estado: 'Completada', total: 50,  createdAt: hoy() + 'T15:00:00' },
      { estado: 'Anulada',    total: 999, createdAt: hoy() + 'T11:00:00' },
      { estado: 'Completada', total: 500, createdAt: '2020-01-01T10:00:00' },
    ];
    const c = crear([], [], ventas);
    c.ngOnInit();
    expect(c.ventasHoy).toBe(150);
  });
});
