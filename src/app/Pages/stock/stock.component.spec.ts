import { of } from 'rxjs';
import { StockComponent } from './stock.component';
import { Producto } from '../../Models/Producto';

const prod = (o: Partial<Producto>): Producto => ({
  id: 1, codigo: 'X', nombre: 'Prod', categoria: null,
  precioCompra: 10, precioVenta: 15, stock: 10, stockMinimo: 5, activo: true, ...o
});

function crear(productos: Producto[] = []) {
  const productoService: any = { listar: vi.fn(() => of(productos)) };
  const inventarioService: any = { listar: vi.fn(() => of([])), ajustar: vi.fn(() => of({})) };
  const auth: any = { getUsuarioId: vi.fn(() => 7) };
  const cdr: any = { detectChanges: vi.fn() };
  const c = new StockComponent(productoService, inventarioService, auth, cdr);
  return { c, productoService, inventarioService };
}

describe('HU-S2-21 Clasificar el estado del stock', () => {
  const { c } = crear();

  it('stock 0 => Agotado', () => {
    expect(c.estado(prod({ stock: 0, stockMinimo: 5 })).txt).toBe('Agotado');
  });
  it('stock negativo => Agotado', () => {
    expect(c.estado(prod({ stock: -1 })).txt).toBe('Agotado');
  });
  it('stock menor al mínimo => Stock bajo', () => {
    expect(c.estado(prod({ stock: 3, stockMinimo: 5 })).txt).toBe('Stock bajo');
  });
  it('stock igual al mínimo (valor límite) => Stock bajo', () => {
    expect(c.estado(prod({ stock: 5, stockMinimo: 5 })).txt).toBe('Stock bajo');
  });
  it('stock = mínimo + 1 (valor límite) => Disponible', () => {
    expect(c.estado(prod({ stock: 6, stockMinimo: 5 })).txt).toBe('Disponible');
  });
  it('usa el stock mínimo de CADA producto, no un valor fijo', () => {
    expect(c.estado(prod({ stock: 8, stockMinimo: 10 })).txt).toBe('Stock bajo');
    expect(c.estado(prod({ stock: 8, stockMinimo: 2 })).txt).toBe('Disponible');
  });
});

describe('HU-S2-22 Buscar producto en stock', () => {
  const lista = [
    prod({ id: 1, nombre: 'Taladro', codigo: 'TAL001' }),
    prod({ id: 2, nombre: 'Martillo', codigo: 'MAR001' }),
  ];
  it('sin texto muestra todos', () => {
    const { c } = crear(lista); c.cargar(); c.busqueda = '  '; c.filtrar();
    expect(c.filtrados.length).toBe(2);
  });
  it('filtra por código', () => {
    const { c } = crear(lista); c.cargar(); c.busqueda = 'TAL001'; c.filtrar();
    expect(c.filtrados.map(p => p.nombre)).toEqual(['Taladro']);
  });
  it('filtra por nombre sin distinguir mayúsculas', () => {
    const { c } = crear(lista); c.cargar(); c.busqueda = 'MARTILLO'; c.filtrar();
    expect(c.filtrados.map(p => p.nombre)).toEqual(['Martillo']);
  });
  it('texto sin coincidencias => lista vacía', () => {
    const { c } = crear(lista); c.cargar(); c.busqueda = 'zzz'; c.filtrar();
    expect(c.filtrados.length).toBe(0);
  });
});

describe('HU-S2-23 Ajustar stock manualmente (frontend)', () => {
  it('envía producto, nuevo stock, motivo y usuario al servicio', () => {
    const { c, inventarioService } = crear([prod({ id: 4, stock: 10 })]);
    c.abrirAjuste(prod({ id: 4, stock: 10 }));
    c.nuevoStock = 20; c.motivo = 'Conteo físico';
    c.guardarAjuste();
    expect(inventarioService.ajustar).toHaveBeenCalledWith({
      usuarioId: 7, productoId: 4, nuevoStock: 20, motivo: 'Conteo físico'
    });
  });
});
