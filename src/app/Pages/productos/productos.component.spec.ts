import { of, throwError } from 'rxjs';
import { ProductosComponent } from './productos.component';
import { Producto } from '../../Models/Producto';

const prod = (o: Partial<Producto>): Producto => ({
  id: 1, codigo: 'X', nombre: 'Prod', categoria: null,
  precioCompra: 10, precioVenta: 15, stock: 10, stockMinimo: 5, activo: true, ...o
});

function crear(productos: Producto[] = [], categorias: any[] = []) {
  const productoService: any = {
    listar: vi.fn(() => of(productos)),
    crear: vi.fn(() => of({})),
    actualizar: vi.fn(() => of({})),
    eliminar: vi.fn(() => of({}))
  };
  const categoriaService: any = { listar: vi.fn(() => of(categorias)) };
  const cdr: any = { detectChanges: vi.fn() };
  const c = new ProductosComponent(productoService, categoriaService, cdr);
  return { c, productoService, categoriaService };
}

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('HU-S2-15 Listar productos', () => {
  it('al abrir carga todos los productos y las categorías', () => {
    const { c } = crear([prod({ id: 1 }), prod({ id: 2 })], [{ id: 1, nombre: 'Herramientas' }]);
    c.ngOnInit();
    expect(c.productos.length).toBe(2);
    expect(c.productosFiltrados.length).toBe(2);
    expect(c.categorias.length).toBe(1);
    expect(c.cargando).toBe(false);
  });
  it('sin productos la lista queda vacía sin error', () => {
    const { c } = crear([]); c.ngOnInit();
    expect(c.productosFiltrados).toEqual([]);
    expect(c.error).toBe('');
  });
  it('si el servidor no responde muestra el aviso de conexión', () => {
    const { c, productoService } = crear();
    productoService.listar.mockReturnValue(throwError(() => new Error('x')));
    c.ngOnInit();
    expect(c.error).toBe('No se pudo conectar con el servidor.');
    expect(c.cargando).toBe(false);
  });
});

describe('HU-S2-16 Buscar producto', () => {
  const lista = [
    prod({ id: 1, nombre: 'Taladro', codigo: 'TAL001' }),
    prod({ id: 2, nombre: 'Martillo', codigo: 'MAR001' }),
    prod({ id: 3, nombre: 'Clavo', codigo: '' }),
  ];
  function buscar(texto: string) {
    const ctx = crear(lista); ctx.c.ngOnInit();
    ctx.c.busqueda = texto; ctx.c.buscar();
    vi.advanceTimersByTime(300);
    return ctx.c;
  }
  it('filtra por nombre sin distinguir mayúsculas', () => {
    expect(buscar('MARTILLO').productosFiltrados.map(p => p.nombre)).toEqual(['Martillo']);
  });
  it('filtra por código', () => {
    expect(buscar('tal001').productosFiltrados.map(p => p.nombre)).toEqual(['Taladro']);
  });
  it('texto vacío o en blanco muestra todos', () => {
    expect(buscar('   ').productosFiltrados.length).toBe(3);
  });
  it('texto sin coincidencias deja la lista vacía', () => {
    expect(buscar('zzz').productosFiltrados.length).toBe(0);
  });
  it('un producto sin código no rompe la búsqueda', () => {
    expect(buscar('clavo').productosFiltrados.map(p => p.nombre)).toEqual(['Clavo']);
  });
  it('espera 300 ms antes de filtrar (valor límite del debounce)', () => {
    const { c } = crear(lista); c.ngOnInit();
    c.busqueda = 'taladro'; c.buscar();
    vi.advanceTimersByTime(299);
    expect(c.productosFiltrados.length).toBe(3);
    vi.advanceTimersByTime(1);
    expect(c.productosFiltrados.length).toBe(1);
  });
});

describe('HU-S2-17 Registrar nuevo producto (pantalla)', () => {
  function conForm(o: Partial<Producto> = {}) {
    const ctx = crear(); ctx.c.ngOnInit(); ctx.c.abrirModalNuevo();
    Object.assign(ctx.c.form, { nombre: 'Martillo', precioCompra: 10, precioVenta: 15, stock: 5 }, o);
    return ctx;
  }

  it('el formulario nuevo empieza vacío, activo y con stock mínimo 5', () => {
    const { c } = crear(); c.abrirModalNuevo();
    expect(c.mostrarModal).toBe(true);
    expect(c.modoEdicion).toBe(false);
    expect(c.form).toMatchObject({ nombre: '', precioCompra: 0, precioVenta: 0, stock: 0, stockMinimo: 5, activo: true });
  });
  it('sin nombre no guarda', () => {
    const { c, productoService } = conForm({ nombre: '' });
    c.guardar();
    expect(productoService.crear).not.toHaveBeenCalled();
    expect(c.error).toBe('Nombre y precio de venta son obligatorios.');
  });
  it('precio de venta 0 no guarda', () => {
    const { c, productoService } = conForm({ precioVenta: 0, precioCompra: 0 });
    c.guardar();
    expect(productoService.crear).not.toHaveBeenCalled();
    expect(c.error).toBe('Nombre y precio de venta son obligatorios.');
  });
  it('precio de venta menor al de compra se rechaza', () => {
    const { c, productoService } = conForm({ precioCompra: 20, precioVenta: 15 });
    c.guardar();
    expect(productoService.crear).not.toHaveBeenCalled();
    expect(c.error).toContain('no puede ser menor');
  });
  it('venta = compra - 0.01 se rechaza (valor límite)', () => {
    const { c, productoService } = conForm({ precioCompra: 10, precioVenta: 9.99 });
    c.guardar();
    expect(productoService.crear).not.toHaveBeenCalled();
  });
  it('venta = compra es válido (valor límite)', () => {
    const { c, productoService } = conForm({ precioCompra: 10, precioVenta: 10 });
    c.guardar();
    expect(productoService.crear).toHaveBeenCalledTimes(1);
  });
  it('producto válido: crea, cierra el modal y recarga la lista', () => {
    const { c, productoService } = conForm();
    const cargas = productoService.listar.mock.calls.length;
    c.guardar();
    expect(productoService.crear).toHaveBeenCalledWith(c.form);
    expect(c.mostrarModal).toBe(false);
    expect(productoService.listar.mock.calls.length).toBe(cargas + 1);
  });
  it('si el servidor rechaza muestra su mensaje y deja el modal abierto', () => {
    const { c, productoService } = conForm();
    productoService.crear.mockReturnValue(throwError(() => ({ error: 'El stock no puede ser negativo.' })));
    c.guardar();
    expect(c.error).toBe('El stock no puede ser negativo.');
    expect(c.mostrarModal).toBe(true);
  });
  it('si el error no trae texto usa el mensaje genérico de creación', () => {
    const { c, productoService } = conForm();
    productoService.crear.mockReturnValue(throwError(() => ({ status: 500 })));
    c.guardar();
    expect(c.error).toBe('Error al crear el producto.');
  });

  // ROJO ESPERADO: el criterio de la historia dice que un stock negativo se rechaza.
  // Hoy la pantalla lo deja pasar y solo el servidor lo frena. Decidir: validar en pantalla o descartar el caso.
  it('ROJO esperado: stock negativo no se envía al servidor', () => {
    const { c, productoService } = conForm({ stock: -1 });
    c.guardar();
    expect(productoService.crear).not.toHaveBeenCalled();
  });
});

describe('H0048-H0049 Editar e inactivar producto (pantalla)', () => {
  it('abrirModalEditar copia los datos del producto al formulario', () => {
    const { c } = crear();
    c.abrirModalEditar(prod({ id: 8, nombre: 'Taladro', categoria: { id: 2, nombre: 'Eléctricas' }, precioVenta: 99 }));
    expect(c.modoEdicion).toBe(true);
    expect(c.productoEditandoId).toBe(8);
    expect(c.form.nombre).toBe('Taladro');
    expect(c.form.categoria).toEqual({ id: 2 });
    expect(c.form.precioVenta).toBe(99);
  });
  it('guardar en modo edición actualiza el producto, no crea otro', () => {
    const { c, productoService } = crear();
    c.abrirModalEditar(prod({ id: 8, precioCompra: 10, precioVenta: 15 }));
    c.guardar();
    expect(productoService.actualizar).toHaveBeenCalledWith(8, c.form);
    expect(productoService.crear).not.toHaveBeenCalled();
  });
  it('eliminar pide confirmación y, si se cancela, no hace nada', () => {
    vi.stubGlobal('confirm', () => false);
    const { c, productoService } = crear();
    c.eliminar(prod({ id: 3 }));
    expect(productoService.eliminar).not.toHaveBeenCalled();
  });
  it('eliminar confirmado inactiva el producto y recarga la lista', () => {
    vi.stubGlobal('confirm', () => true);
    const { c, productoService } = crear();
    const cargas = productoService.listar.mock.calls.length;
    c.eliminar(prod({ id: 3 }));
    expect(productoService.eliminar).toHaveBeenCalledWith(3);
    expect(productoService.listar.mock.calls.length).toBe(cargas + 1);
  });
});

describe('Indicador de stock en la lista de productos', () => {
  const { c } = crear();
  it('stock 0 => peligro', () => expect(c.stockClass(prod({ stock: 0 }))).toBe('badge-danger'));
  it('stock igual al mínimo => advertencia (valor límite)', () => {
    expect(c.stockClass(prod({ stock: 5, stockMinimo: 5 }))).toBe('badge-warning');
  });
  it('stock = mínimo + 1 => correcto (valor límite)', () => {
    expect(c.stockClass(prod({ stock: 6, stockMinimo: 5 }))).toBe('badge-success');
  });
});
