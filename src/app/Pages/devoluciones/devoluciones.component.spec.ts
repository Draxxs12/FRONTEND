import { of, throwError } from 'rxjs';
import { DevolucionesComponent } from './devoluciones.component';

const venta = (id: number, estado: 'Completada' | 'Anulada' = 'Completada') => ({
  id, numeroComprobante: `B001-${id}`, estado, total: 100, cliente: null, usuario: { id: 1, nombre: 'u' },
  subtotal: 0, igv: 0, tipoPago: 'Efectivo', createdAt: '2026-10-01T10:00:00'
});
const linea = (productoId: number, cantidad: number, precio: number) => ({
  id: productoId, producto: { id: productoId, nombre: 'P' + productoId, codigo: 'C' + productoId },
  cantidad, precioUnitario: precio, subtotal: cantidad * precio
});

function crear(opts: { devoluciones?: any[]; ventas?: any[]; detalle?: any[] } = {}) {
  const devolucionService: any = {
    listar: vi.fn(() => of(opts.devoluciones ?? [])),
    crear: vi.fn(() => of({}))
  };
  const ventaService: any = {
    listar: vi.fn(() => of(opts.ventas ?? [])),
    obtenerDetalle: vi.fn(() => of(opts.detalle ?? []))
  };
  const auth: any = { getUsuarioId: vi.fn(() => 7) };
  const cdr: any = { detectChanges: vi.fn() };
  const c = new DevolucionesComponent(devolucionService, ventaService, auth, cdr);
  return { c, devolucionService, ventaService, auth };
}

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('HU-S2-14 Listar devoluciones registradas', () => {
  it('al abrir carga todas las devoluciones del servidor', () => {
    const { c } = crear({ devoluciones: [{ id: 1, numeroNota: 'NC-001' }, { id: 2, numeroNota: 'NC-002' }] });
    c.ngOnInit();
    expect(c.devoluciones.length).toBe(2);
  });
  it('sin devoluciones el listado queda vacío sin error', () => {
    const { c } = crear({ devoluciones: [] });
    c.ngOnInit();
    expect(c.devoluciones).toEqual([]);
    expect(c.esError).toBe(false);
  });
  it('para devolver solo ofrece ventas Completadas (excluye las Anuladas)', () => {
    const { c } = crear({ ventas: [venta(1), venta(2, 'Anulada'), venta(3)] });
    c.ngOnInit();
    expect(c.ventas.map(v => v.id)).toEqual([1, 3]);
  });
});

describe('HU-S2-13 Registrar devolución (pantalla)', () => {
  it('abrirNueva limpia el formulario y usa Efectivo por defecto', () => {
    const { c } = crear();
    c.motivo = 'viejo'; c.tipoReembolso = 'Tarjeta'; c.ventaSelId = 5;
    c.abrirNueva();
    expect(c.mostrarModal).toBe(true);
    expect(c.ventaSelId).toBeNull();
    expect(c.motivo).toBe('');
    expect(c.tipoReembolso).toBe('Efectivo');
    expect(c.lineas).toEqual([]);
  });
  it('sin venta elegida no hay líneas', () => {
    const { c, ventaService } = crear();
    c.ventaSelId = null; c.cargarDetalle();
    expect(c.lineas).toEqual([]);
    expect(ventaService.obtenerDetalle).not.toHaveBeenCalled();
  });
  it('al elegir una venta carga su detalle con cantidad a devolver en 0', () => {
    const { c, ventaService } = crear({ detalle: [linea(1, 3, 10), linea(2, 1, 50)] });
    c.ventaSelId = 9; c.cargarDetalle();
    expect(ventaService.obtenerDetalle).toHaveBeenCalledWith(9);
    expect(c.lineas.length).toBe(2);
    expect(c.lineas.every(l => l.devolver === 0)).toBe(true);
  });
  it('totalReembolso es 0 mientras no se indique ninguna cantidad', () => {
    const { c } = crear({ detalle: [linea(1, 3, 10)] });
    c.ventaSelId = 9; c.cargarDetalle();
    expect(c.totalReembolso).toBe(0);
  });
  it('totalReembolso suma cantidad x precio solo de las líneas a devolver', () => {
    const { c } = crear({ detalle: [linea(1, 3, 10), linea(2, 4, 50)] });
    c.ventaSelId = 9; c.cargarDetalle();
    c.lineas[0].devolver = 2;      // 20
    c.lineas[1].devolver = 0;      // no cuenta
    expect(c.totalReembolso).toBe(20);
  });
  it('una cantidad negativa no resta del reembolso', () => {
    const { c } = crear({ detalle: [linea(1, 3, 10)] });
    c.ventaSelId = 9; c.cargarDetalle();
    c.lineas[0].devolver = -5;
    expect(c.totalReembolso).toBe(0);
  });
  it('sin venta seleccionada no registra y avisa', () => {
    const { c, devolucionService } = crear();
    c.ventaSelId = null;
    c.registrar();
    expect(devolucionService.crear).not.toHaveBeenCalled();
    expect(c.esError).toBe(true);
    expect(c.mensaje).toBe('Selecciona una venta e indica cantidades a devolver.');
  });
  it('con todas las cantidades en 0 no registra (valor límite)', () => {
    const { c, devolucionService } = crear({ detalle: [linea(1, 3, 10)] });
    c.ventaSelId = 9; c.cargarDetalle();
    c.registrar();
    expect(devolucionService.crear).not.toHaveBeenCalled();
  });
  it('envía solo las líneas con cantidad > 0, con usuario, venta, motivo y tipo de reembolso', () => {
    const { c, devolucionService } = crear({ detalle: [linea(1, 3, 10), linea(2, 4, 50)] });
    c.ventaSelId = 9; c.cargarDetalle();
    c.lineas[0].devolver = 1; c.motivo = 'Defectuoso'; c.tipoReembolso = 'Tarjeta';
    c.registrar();
    expect(devolucionService.crear).toHaveBeenCalledWith({
      usuarioId: 7, ventaId: 9, motivo: 'Defectuoso', tipoReembolso: 'Tarjeta',
      detalles: [{ producto: { id: 1 }, cantidad: 1, precioUnitario: 10 }]
    });
  });
  it('devolver exactamente lo vendido se envía (valor límite)', () => {
    const { c, devolucionService } = crear({ detalle: [linea(1, 3, 10)] });
    c.ventaSelId = 9; c.cargarDetalle();
    c.lineas[0].devolver = 3;
    c.registrar();
    expect(devolucionService.crear).toHaveBeenCalledTimes(1);
  });
  it('registro exitoso: cierra el modal, recarga y confirma', () => {
    const { c, devolucionService } = crear({ detalle: [linea(1, 3, 10)] });
    c.ventaSelId = 9; c.cargarDetalle(); c.abrirNueva(); c.ventaSelId = 9; c.cargarDetalle();
    c.lineas[0].devolver = 1;
    const cargas = devolucionService.listar.mock.calls.length;
    c.registrar();
    expect(c.mostrarModal).toBe(false);
    expect(c.esError).toBe(false);
    expect(c.mensaje).toBe('Devolución registrada.');
    expect(devolucionService.listar.mock.calls.length).toBe(cargas + 1);
  });
  it('si el servidor rechaza, muestra el texto que devuelve', () => {
    const { c, devolucionService } = crear({ detalle: [linea(1, 3, 10)] });
    devolucionService.crear.mockReturnValue(throwError(() => ({ error: 'No se puede devolver más de lo vendido' })));
    c.ventaSelId = 9; c.cargarDetalle(); c.lineas[0].devolver = 1;
    c.registrar();
    expect(c.esError).toBe(true);
    expect(c.mensaje).toBe('No se puede devolver más de lo vendido');
  });
  it('si el error no trae texto usa el mensaje genérico', () => {
    const { c, devolucionService } = crear({ detalle: [linea(1, 3, 10)] });
    devolucionService.crear.mockReturnValue(throwError(() => ({ status: 500 })));
    c.ventaSelId = 9; c.cargarDetalle(); c.lineas[0].devolver = 1;
    c.registrar();
    expect(c.mensaje).toBe('Error al registrar.');
  });

  // ROJO ESPERADO: hoy la validación "no más de lo vendido" solo existe en el servidor.
  // La pantalla deja enviar 5 unidades de una venta de 3. Decidir: validar también en pantalla o descartar este caso.
  it('ROJO esperado: devolver más de lo vendido no se envía al servidor', () => {
    const { c, devolucionService } = crear({ detalle: [linea(1, 3, 10)] });
    c.ventaSelId = 9; c.cargarDetalle();
    c.lineas[0].devolver = 5;
    c.registrar();
    expect(devolucionService.crear).not.toHaveBeenCalled();
  });
});
