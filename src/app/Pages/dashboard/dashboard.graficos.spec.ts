import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';

const p2 = (n: number) => String(n).padStart(2, '0');
const fecha = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const haceDias = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return fecha(d); };

interface Datos { productos?: any[]; clientes?: any[]; ventas?: any[]; compras?: any[]; }

function crear(datos: Datos = {}) {
  const ps: any = { listar: vi.fn(() => of(datos.productos ?? [])) };
  const cs: any = { getAll: vi.fn(() => of(datos.clientes ?? [])) };
  const vs: any = { listar: vi.fn(() => of(datos.ventas ?? [])), topClientes: vi.fn(() => of([])) };
  const cps: any = { getAll: vi.fn(() => of(datos.compras ?? [])) };
  const cdr: any = { detectChanges: vi.fn() };
  const c = new DashboardComponent(ps, cs, vs, cps, cdr);
  c.ngOnInit();
  return c;
}

const serie = (o: any): any[] => (o.series as any[])[0].data;

describe('H0020 KPIs sin datos (CP-002)', () => {
  it('con todo vacío los indicadores quedan en 0 y no hay error', () => {
    const c = crear();
    expect(c.totalProductos).toBe(0);
    expect(c.totalStockBajo).toBe(0);
    expect(c.totalClientes).toBe(0);
    expect(c.ventasHoy).toBe(0);
  });
});

describe('H0021 Tendencia de ventas semanal (CP-003, CP-004)', () => {
  it('la serie tiene 7 días y el último es hoy', () => {
    const c = crear({ ventas: [
      { estado: 'Completada', total: 100, createdAt: haceDias(0) + 'T09:00:00' },
      { estado: 'Completada', total: 40.5, createdAt: haceDias(0) + 'T18:00:00' },
    ]});
    const datos = serie(c.mainLineChartOptions);
    expect(datos.length).toBe(7);
    expect(datos[6]).toBe(140.5);
  });
  it('un día sin ventas aparece con 0', () => {
    const c = crear({ ventas: [{ estado: 'Completada', total: 80, createdAt: haceDias(2) + 'T10:00:00' }] });
    const datos = serie(c.mainLineChartOptions);
    expect(datos[4]).toBe(80);   // hace 2 días
    expect(datos[5]).toBe(0);    // ayer, sin ventas
    expect(datos[6]).toBe(0);    // hoy, sin ventas
  });
  it('las ventas anuladas no cuentan', () => {
    const c = crear({ ventas: [
      { estado: 'Anulada', total: 999, createdAt: haceDias(0) + 'T10:00:00' },
      { estado: 'Completada', total: 10, createdAt: haceDias(0) + 'T11:00:00' },
    ]});
    expect(serie(c.mainLineChartOptions)[6]).toBe(10);
  });
  it('las ventas de hace más de 7 días quedan fuera', () => {
    const c = crear({ ventas: [{ estado: 'Completada', total: 500, createdAt: haceDias(7) + 'T10:00:00' }] });
    expect(serie(c.mainLineChartOptions).every((v: number) => v === 0)).toBe(true);
  });
});

describe('H0022 Top proveedores (CP-005, CP-006, CP-007)', () => {
  const compra = (empresa: string, total: number) => ({ proveedor: { empresa }, total });

  it('suma las compras por proveedor y ordena de mayor a menor', () => {
    const c = crear({ compras: [compra('A', 100), compra('B', 500), compra('A', 150)] });
    const nombres = (c.proveedoresChartOptions.yAxis as any).data;
    const valores = serie(c.proveedoresChartOptions).map((d: any) => d.value);
    expect(nombres).toEqual(['B', 'A']);
    expect(valores).toEqual([500, 250]);
  });
  it('muestra como máximo 5 proveedores (valor límite)', () => {
    const compras = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((n, i) => compra(n, (i + 1) * 100));
    const c = crear({ compras });
    expect((c.proveedoresChartOptions.yAxis as any).data).toEqual(['G', 'F', 'E', 'D', 'C']);
  });
  it('exactamente 5 proveedores se muestran todos', () => {
    const c = crear({ compras: ['A', 'B', 'C', 'D', 'E'].map((n, i) => compra(n, (i + 1) * 10)) });
    expect((c.proveedoresChartOptions.yAxis as any).data.length).toBe(5);
  });
  it('sin compras la lista queda con un aviso y valor 0, sin error', () => {
    const c = crear();
    expect((c.proveedoresChartOptions.yAxis as any).data).toEqual(['Sin compras registradas']);
    expect(serie(c.proveedoresChartOptions)[0].value).toBe(0);
  });
  it('ignora las compras sin proveedor o sin total', () => {
    const c = crear({ compras: [{ proveedor: null, total: 100 }, compra('A', 0), compra('B', 70)] });
    expect((c.proveedoresChartOptions.yAxis as any).data).toEqual(['B']);
  });
});

describe('H0023 Productos por categoría (CP-008, CP-009)', () => {
  const prod = (id: number, cat: string | null, activo = true) =>
    ({ id, activo, stock: 10, stockMinimo: 1, categoria: cat ? { nombre: cat } : null });

  it('cuenta los productos activos de cada categoría', () => {
    const c = crear({ productos: [prod(1, 'Herramientas'), prod(2, 'Herramientas'), prod(3, 'Pinturas')] });
    expect((c.barChartOptions.xAxis as any).data).toEqual(['Herramientas', 'Pinturas']);
    expect(serie(c.barChartOptions)).toEqual([2, 1]);
  });
  it('los productos inactivos no cuentan', () => {
    const c = crear({ productos: [prod(1, 'Herramientas'), prod(2, 'Herramientas', false)] });
    expect(serie(c.barChartOptions)).toEqual([1]);
  });
  it('un producto sin categoría se omite (regla actual)', () => {
    const c = crear({ productos: [prod(1, null), prod(2, 'Pinturas')] });
    expect((c.barChartOptions.xAxis as any).data).toEqual(['Pinturas']);
  });
  it('sin productos muestra "Sin productos" con valor 0', () => {
    const c = crear();
    expect((c.barChartOptions.xAxis as any).data).toEqual(['Sin productos']);
    expect(serie(c.barChartOptions)).toEqual([0]);
  });
});

describe('H0025 Evolución de ventas y compras (CP-013, CP-014)', () => {
  it('la mini serie de compras tiene 4 días y el último es hoy', () => {
    const c = crear({ compras: [{ proveedor: { empresa: 'A' }, total: 300, createdAt: haceDias(0) + 'T10:00:00' }] });
    const datos = serie(c.miniLineComprasOptions);
    expect(datos.length).toBe(4);
    expect(datos[3]).toBe(300);
  });
  it('un periodo sin compras marca 0', () => {
    const c = crear({ compras: [{ proveedor: { empresa: 'A' }, total: 300, createdAt: haceDias(3) + 'T10:00:00' }] });
    expect(serie(c.miniLineComprasOptions)).toEqual([300, 0, 0, 0]);
  });
  it('la mini serie de ventas toma los últimos 4 días de la semana', () => {
    const c = crear({ ventas: [{ estado: 'Completada', total: 25, createdAt: haceDias(1) + 'T10:00:00' }] });
    expect(serie(c.miniLineVentasOptions)).toEqual([0, 0, 25, 0]);
  });
});
