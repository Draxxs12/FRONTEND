import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';

const fechaLocal = (fecha: Date): string => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}`;
};

const fechaRelativa = (dias: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return fechaLocal(d);
};

function crear(
  productos: any[] = [],
  clientes: any[] = [],
  ventas: any[] = [],
  compras: any[] = [],
  topClientes: any[] = []
) {
  const ps: any = { listar: vi.fn(() => of(productos)) };
  const cs: any = { getAll: vi.fn(() => of(clientes)) };
  const vs: any = {
    listar: vi.fn(() => of(ventas)),
    topClientes: vi.fn(() => of(topClientes))
  };
  const cps: any = { getAll: vi.fn(() => of(compras)) };
  const cdr: any = { detectChanges: vi.fn() };
  const component = new DashboardComponent(ps, cs, vs, cps, cdr);
  component.ngOnInit();
  return { component, ps, cs, vs, cps, cdr };
}

describe('Sprint 2 — Dashboard (HU-S2-01 a HU-S2-05)', () => {
  describe('HU-S2-01: KPIs del Dashboard', () => {
    it('cuenta únicamente los productos activos', () => {
      const { component } = crear([
        { id: 1, activo: true, stock: 10, stockMinimo: 2 },
        { id: 2, activo: true, stock: 4, stockMinimo: 2 },
        { id: 3, activo: false, stock: 0, stockMinimo: 2 }
      ]);
      expect(component.totalProductos).toBe(2);
    });

    it('cuenta todos los clientes recibidos del servicio', () => {
      const { component } = crear([], [{ id: 1 }, { id: 2 }, { id: 3 }]);
      expect(component.totalClientes).toBe(3);
    });

    it('suma solo las ventas completadas de la fecha local actual', () => {
      const hoy = fechaRelativa(0);
      const { component } = crear([], [], [
        { estado: 'Completada', total: 100, createdAt: `${hoy}T10:00:00` },
        { estado: 'Completada', total: 50, createdAt: `${hoy}T15:00:00` },
        { estado: 'Anulada', total: 999, createdAt: `${hoy}T11:00:00` },
        { estado: 'Completada', total: 500, createdAt: '2020-01-01T10:00:00' }
      ]);
      expect(component.ventasHoy).toBe(150);
    });
  });

  describe('HU-S2-02: tendencia de ventas de los últimos siete días', () => {
    it('genera siete puntos y suma solo ventas completadas por día', () => {
      const ayer = fechaRelativa(-1);
      const hoy = fechaRelativa(0);
      const { component } = crear([], [], [
        { estado: 'Completada', total: 20, createdAt: `${ayer}T09:00:00` },
        { estado: 'Completada', total: 30, createdAt: `${hoy}T10:00:00` },
        { estado: 'Anulada', total: 500, createdAt: `${hoy}T11:00:00` }
      ]);
      const opciones: any = component.mainLineChartOptions;
      const valores: number[] = opciones.series[0].data;
      expect(opciones.xAxis.data).toHaveLength(7);
      expect(valores).toHaveLength(7);
      expect(valores[5]).toBe(20);
      expect(valores[6]).toBe(30);
    });

    it('muestra cero en los días sin ventas completadas', () => {
      const { component } = crear([], [], []);
      const opciones: any = component.mainLineChartOptions;
      expect(opciones.series[0].data).toEqual([0, 0, 0, 0, 0, 0, 0]);
    });
  });

  describe('HU-S2-03: principales proveedores por monto de compras', () => {
    it('agrupa compras por proveedor, suma montos y ordena los cinco mayores', () => {
      const compras = [
        { proveedor: { empresa: 'Proveedor A' }, total: 100 },
        { proveedor: { empresa: 'Proveedor B' }, total: 300 },
        { proveedor: { empresa: 'Proveedor A' }, total: 250 },
        { proveedor: { empresa: 'Proveedor C' }, total: 50 },
        { proveedor: { empresa: 'Proveedor D' }, total: 200 },
        { proveedor: { empresa: 'Proveedor E' }, total: 150 },
        { proveedor: { empresa: 'Proveedor F' }, total: 125 },
        { proveedor: { empresa: 'Proveedor G' }, total: 10 }
      ];
      const { component } = crear([], [], [], compras);
      const opciones: any = component.proveedoresChartOptions;
      expect(opciones.yAxis.data).toEqual([
        'Proveedor A', 'Proveedor B', 'Proveedor D', 'Proveedor E', 'Proveedor F'
      ]);
      expect(opciones.series[0].data.map((x: any) => x.value)).toEqual([350, 300, 200, 150, 125]);
    });

    it('presenta un estado vacío cuando no hay compras con proveedor y monto', () => {
      const { component } = crear([], [], [], []);
      const opciones: any = component.proveedoresChartOptions;
      expect(opciones.yAxis.data).toEqual(['Sin compras registradas']);
      expect(opciones.series[0].data).toEqual([{ value: 0 }]);
    });
  });

  describe('HU-S2-04: productos por categoría', () => {
    it('cuenta productos activos por categoría y excluye productos inactivos', () => {
      const { component } = crear([
        { id: 1, activo: true, categoria: { nombre: 'Herramientas' } },
        { id: 2, activo: true, categoria: { nombre: 'Herramientas' } },
        { id: 3, activo: true, categoria: { nombre: 'Pinturas' } },
        { id: 4, activo: false, categoria: { nombre: 'Pinturas' } },
        { id: 5, activo: true }
      ]);
      const opciones: any = component.barChartOptions;
      expect(opciones.xAxis.data).toEqual(['Herramientas', 'Pinturas']);
      expect(opciones.series[0].data).toEqual([2, 1]);
    });

    it('muestra un estado vacío cuando no existen productos activos con categoría', () => {
      const { component } = crear([
        { id: 1, activo: false, categoria: { nombre: 'Herramientas' } },
        { id: 2, activo: true }
      ]);
      const opciones: any = component.barChartOptions;
      expect(opciones.xAxis.data).toEqual(['Sin productos']);
      expect(opciones.series[0].data).toEqual([0]);
    });
  });

  describe('HU-S2-05: productos con stock crítico', () => {
    it('identifica productos activos cuyo stock es menor o igual al mínimo individual', () => {
      const { component } = crear([
        { id: 1, activo: true, stock: 8, stockMinimo: 10 },
        { id: 2, activo: true, stock: 3, stockMinimo: 2 },
        { id: 3, activo: true, stock: 5, stockMinimo: 5 },
        { id: 4, activo: false, stock: 0, stockMinimo: 5 }
      ]);
      expect(component.productosStockCritico.map(p => p.id)).toEqual([1, 3]);
      expect(component.totalStockBajo).toBe(2);
    });

    it('considera crítico un producto cuyo stock es exactamente el mínimo', () => {
      const { component } = crear([
        { id: 1, activo: true, stock: 5, stockMinimo: 5 }
      ]);
      expect(component.totalStockBajo).toBe(1);
    });
  });
});
