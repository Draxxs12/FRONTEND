import { of, throwError } from 'rxjs';
import { PuntoVentaComponent } from './punto-venta.component';
import { Producto } from '../../Models/Producto';

const prod = (o: Partial<Producto>): Producto => ({
  id: 1, codigo: 'X', nombre: 'Martillo', categoria: null,
  precioCompra: 10, precioVenta: 15, stock: 5, stockMinimo: 1, activo: true, ...o
});
const cliente = (o: any = {}) => ({
  id: 1, nombre: 'Cliente General', tipoDocumento: 'DNI', numeroDocumento: '12345678',
  telefono: '', email: '', ...o
});

function crear(opts: { productos?: Producto[]; clientes?: any[]; productosError?: boolean; venta?: any } = {}) {
  const productos = opts.productos ?? [];
  const productoService: any = {
    listar: vi.fn(() => opts.productosError ? throwError(() => new Error('x')) : of(productos))
  };
  const clienteService: any = { getAll: vi.fn(() => of(opts.clientes ?? [cliente()])) };
  const venta = opts.venta ?? { numeroComprobante: 'B001-00000001', total: 17.7, createdAt: '2026-10-09T10:00:00' };
  const ventaService: any = { registrar: vi.fn(() => of(venta)) };
  const auth: any = { getUsuarioId: vi.fn(() => 7) };
  const comprobante: any = { precargar: vi.fn(), emitir: vi.fn() };
  const cdr: any = { detectChanges: vi.fn() };
  const c = new PuntoVentaComponent(productoService, clienteService, ventaService, auth, comprobante, cdr);
  return { c, productoService, ventaService, comprobante, auth };
}

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('HU-S2-08 Visualizar catálogo de productos (punto de venta)', () => {
  const lista = [
    prod({ id: 1, nombre: 'Martillo', codigo: 'MAR001' }),
    prod({ id: 2, nombre: 'Taladro', codigo: 'TAL001' }),
  ];

  it('al abrir carga todos los productos en el catálogo', () => {
    const { c } = crear({ productos: lista });
    c.ngOnInit();
    expect(c.productos.length).toBe(2);
    expect(c.filtrados.length).toBe(2);
  });
  it('si falla la carga avisa con un mensaje de error', () => {
    const { c } = crear({ productosError: true });
    c.ngOnInit();
    expect(c.esError).toBe(true);
    expect(c.mensaje).toBe('No se pudieron cargar los productos.');
  });
  it('sin productos el catálogo queda vacío sin error', () => {
    const { c } = crear({ productos: [] });
    c.ngOnInit();
    expect(c.filtrados).toEqual([]);
    expect(c.esError).toBe(false);
  });
  it('filtra por nombre sin distinguir mayúsculas', () => {
    const { c } = crear({ productos: lista }); c.ngOnInit();
    c.busqueda = 'TALADRO'; c.filtrar();
    expect(c.filtrados.map(p => p.nombre)).toEqual(['Taladro']);
  });
  it('filtra por código', () => {
    const { c } = crear({ productos: lista }); c.ngOnInit();
    c.busqueda = 'mar001'; c.filtrar();
    expect(c.filtrados.map(p => p.nombre)).toEqual(['Martillo']);
  });
  it('texto en blanco muestra todo el catálogo', () => {
    const { c } = crear({ productos: lista }); c.ngOnInit();
    c.busqueda = '   '; c.filtrar();
    expect(c.filtrados.length).toBe(2);
  });
  it('texto sin coincidencias deja el catálogo vacío', () => {
    const { c } = crear({ productos: lista }); c.ngOnInit();
    c.busqueda = 'zzz'; c.filtrar();
    expect(c.filtrados.length).toBe(0);
  });
  it('un producto sin código no rompe la búsqueda', () => {
    const { c } = crear({ productos: [prod({ id: 3, nombre: 'Clavo', codigo: '' })] }); c.ngOnInit();
    c.busqueda = 'clavo'; c.filtrar();
    expect(c.filtrados.length).toBe(1);
  });
});

describe('HU-S2-09 Carrito: cantidades y totales', () => {
  it('cambiar(+1) sube la cantidad dentro del stock', () => {
    const { c } = crear(); const p = prod({ stock: 5 });
    c.agregar(p); c.cambiar(c.carrito[0], +1);
    expect(c.carrito[0].cantidad).toBe(2);
  });
  it('cambiar a una cantidad mayor al stock se rechaza (valor límite stock+1)', () => {
    const { c } = crear(); const p = prod({ stock: 2 });
    c.agregar(p); c.cambiar(c.carrito[0], +1);   // 2 = stock, válido
    c.cambiar(c.carrito[0], +1);                 // 3 > stock
    expect(c.carrito[0].cantidad).toBe(2);
    expect(c.esError).toBe(true);
  });
  it('cambiar a 0 quita el producto del carrito (valor límite)', () => {
    const { c } = crear(); c.agregar(prod({ stock: 5 }));
    c.cambiar(c.carrito[0], -1);
    expect(c.carrito.length).toBe(0);
  });
  it('quitar elimina solo ese producto', () => {
    const { c } = crear();
    c.agregar(prod({ id: 1 })); c.agregar(prod({ id: 2, nombre: 'Taladro' }));
    c.quitar(c.carrito[0]);
    expect(c.carrito.map(i => i.producto.id)).toEqual([2]);
  });
  it('vaciar deja el carrito y el monto recibido en cero', () => {
    const { c } = crear(); c.agregar(prod({})); c.montoRecibido = 50;
    c.vaciar();
    expect(c.carrito.length).toBe(0);
    expect(c.montoRecibido).toBe(0);
  });
  it('carrito vacío: subtotal, IGV y total son 0', () => {
    const { c } = crear();
    expect(c.subtotal).toBe(0); expect(c.igv).toBe(0); expect(c.total).toBe(0);
  });
  it('calcula subtotal, IGV (18 %) y total: 2 x S/ 15', () => {
    const { c } = crear(); const p = prod({ precioVenta: 15, stock: 5 });
    c.agregar(p); c.cambiar(c.carrito[0], +1);
    expect(c.subtotal).toBeCloseTo(30, 2);
    expect(c.igv).toBeCloseTo(5.4, 2);
    expect(c.total).toBeCloseTo(35.4, 2);
  });
  it('suma varios productos distintos', () => {
    const { c } = crear();
    c.agregar(prod({ id: 1, precioVenta: 10 })); c.agregar(prod({ id: 2, precioVenta: 20 }));
    expect(c.subtotal).toBeCloseTo(30, 2);
  });
});

describe('HU-S2-10 Seleccionar cliente (casos adicionales)', () => {
  it('si no hay cliente "General" preselecciona el primero de la lista', () => {
    const { c } = crear({ clientes: [cliente({ id: 5, nombre: 'Juan Pérez' }), cliente({ id: 6, nombre: 'Ana' })] });
    c.ngOnInit();
    expect(c.clienteId).toBe(5);
  });
  it('sin clientes registrados no hay cliente seleccionado', () => {
    const { c } = crear({ clientes: [] }); c.ngOnInit();
    expect(c.clienteId).toBeNull();
    expect(c.clienteSeleccionado).toBeUndefined();
  });
  it('documentoCliente devuelve el documento del cliente elegido', () => {
    const { c } = crear({ clientes: [cliente({ id: 5, numeroDocumento: '87654321' })] }); c.ngOnInit();
    expect(c.documentoCliente).toBe('87654321');
  });
});

describe('H0031-H0033 Comprobante, pago y registro de la venta', () => {
  function listo(extra: Partial<{ tipo: string; ruc: string; recibido: number; clienteId: number | null }> = {}) {
    const ctx = crear({ productos: [prod({ id: 9, precioVenta: 15, stock: 5 })] });
    ctx.c.ngOnInit();
    ctx.c.agregar(ctx.c.productos[0]);         // subtotal 15, total 17.70
    ctx.c.tipoComprobante = extra.tipo ?? 'Boleta';
    ctx.c.rucFactura = extra.ruc ?? '';
    ctx.c.montoRecibido = extra.recibido ?? 20;
    if (extra.clienteId !== undefined) ctx.c.clienteId = extra.clienteId;
    return ctx;
  }

  it('carrito vacío: no registra y avisa', () => {
    const { c, ventaService } = crear(); c.ngOnInit();
    c.registrar();
    expect(ventaService.registrar).not.toHaveBeenCalled();
    expect(c.mensaje).toBe('El carrito está vacío.');
  });
  it('sin cliente seleccionado: no registra y avisa', () => {
    const { c, ventaService } = listo({ clienteId: null });
    c.registrar();
    expect(ventaService.registrar).not.toHaveBeenCalled();
    expect(c.mensaje).toBe('Selecciona un cliente antes de registrar la venta.');
  });
  it('monto recibido menor al total: no registra (valor límite total - 0.01)', () => {
    const { c, ventaService } = listo({ recibido: 17.69 });
    expect(c.pagoInsuficiente).toBe(true);
    c.registrar();
    expect(ventaService.registrar).not.toHaveBeenCalled();
    expect(c.esError).toBe(true);
  });
  it('monto recibido igual al total es válido (valor límite) y el cambio es 0', () => {
    const { c, ventaService } = listo({ recibido: 17.7 });
    expect(c.pagoInsuficiente).toBe(false);
    expect(c.cambio).toBeCloseTo(0, 2);
    c.registrar();
    expect(ventaService.registrar).toHaveBeenCalledTimes(1);
  });
  it('el cambio es lo recibido menos el total', () => {
    const { c } = listo({ recibido: 20 });
    expect(c.cambio).toBeCloseTo(2.3, 2);
  });
  it('factura sin RUC (ni en el cliente): no registra', () => {
    const { c, ventaService } = crear({ clientes: [cliente({ numeroDocumento: '' })], productos: [prod({ id: 9 })] });
    c.ngOnInit(); c.agregar(c.productos[0]);
    c.tipoComprobante = 'Factura'; c.rucFactura = ''; c.montoRecibido = 100;
    c.registrar();
    expect(ventaService.registrar).not.toHaveBeenCalled();
    expect(c.mensaje).toBe('Ingresa el RUC del cliente para emitir una factura.');
  });
  it('factura usa el RUC escrito en pantalla en lugar del documento del cliente', () => {
    const { c, ventaService } = listo({ tipo: 'Factura', ruc: '20123456789', recibido: 100 });
    c.registrar();
    expect(ventaService.registrar.mock.calls[0][0].venta.rucCliente).toBe('20123456789');
  });
  it('boleta usa el documento del cliente', () => {
    const { c, ventaService } = listo({ tipo: 'Boleta', recibido: 100 });
    c.registrar();
    expect(ventaService.registrar.mock.calls[0][0].venta.rucCliente).toBe('12345678');
  });
  it('envía usuario, tipo de pago, comprobante y detalle con precio unitario', () => {
    const { c, ventaService } = listo({ recibido: 100 });
    c.tipoPago = 'Yape';
    c.registrar();
    const p = ventaService.registrar.mock.calls[0][0];
    expect(p.usuarioId).toBe(7);
    expect(p.venta.tipoPago).toBe('Yape');
    expect(p.venta.tipoComprobante).toBe('Boleta');
    expect(p.venta.cliente).toEqual({ id: 1 });
    expect(p.detalles).toEqual([{ producto: { id: 9 }, cantidad: 1, precioUnitario: 15 }]);
  });
  it('venta exitosa: emite el comprobante, vacía el carrito y refresca el stock', () => {
    const { c, comprobante, productoService } = listo({ recibido: 100 });
    const llamadasAntes = productoService.listar.mock.calls.length;
    c.registrar();
    expect(comprobante.emitir).toHaveBeenCalledTimes(1);
    expect(c.carrito.length).toBe(0);
    expect(c.cargando).toBe(false);
    expect(c.esError).toBe(false);
    expect(c.mensaje).toContain('B001-00000001');
    expect(productoService.listar.mock.calls.length).toBe(llamadasAntes + 1);
  });
  it('si el servidor rechaza la venta: avisa, no emite comprobante y conserva el carrito', () => {
    const { c, ventaService, comprobante } = listo({ recibido: 100 });
    ventaService.registrar.mockReturnValue(throwError(() => new Error('Stock insuficiente')));
    c.registrar();
    expect(c.esError).toBe(true);
    expect(c.mensaje).toBe('Stock insuficiente');
    expect(comprobante.emitir).not.toHaveBeenCalled();
    expect(c.carrito.length).toBe(1);
    expect(c.cargando).toBe(false);
  });
});

describe('H0034 Generar proforma', () => {
  it('carrito vacío: no abre la proforma y avisa', () => {
    const { c } = crear();
    const abrir = vi.spyOn(window, 'open');
    c.proforma();
    expect(abrir).not.toHaveBeenCalled();
    expect(c.mensaje).toBe('El carrito está vacío.');
  });
  it('si el navegador bloquea la ventana emergente avisa', () => {
    const { c } = crear(); c.agregar(prod({}));
    vi.spyOn(window, 'open').mockReturnValue(null);
    c.proforma();
    expect(c.esError).toBe(true);
    expect(c.mensaje).toContain('ventanas emergentes');
  });
  it('genera la proforma con el producto, el total y la aclaración de que no es comprobante', () => {
    const { c } = crear(); c.agregar(prod({ nombre: 'Martillo', precioVenta: 15 }));
    const doc = { write: vi.fn(), close: vi.fn() };
    vi.spyOn(window, 'open').mockReturnValue({ document: doc } as any);
    c.proforma();
    const html = doc.write.mock.calls[0][0] as string;
    expect(html).toContain('PROFORMA');
    expect(html).toContain('Martillo');
    expect(html).toContain('S/ 17.70');
    expect(html).toContain('no válido como comprobante');
    expect(doc.close).toHaveBeenCalled();
  });
});
