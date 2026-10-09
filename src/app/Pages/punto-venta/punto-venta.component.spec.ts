import { of } from 'rxjs';
import { PuntoVentaComponent } from './punto-venta.component';
import { Producto } from '../../Models/Producto';

const prod = (o: Partial<Producto>): Producto => ({
  id: 1, codigo: 'X', nombre: 'Martillo', categoria: null,
  precioCompra: 10, precioVenta: 15, stock: 3, stockMinimo: 1, activo: true, ...o
});

function crear(clientes: any[] = []) {
  const productoService: any = { listar: vi.fn(() => of([])) };
  const clienteService: any = { getAll: vi.fn(() => of(clientes)) };
  const ventaService: any = {};
  const auth: any = {};
  const comprobante: any = { precargar: vi.fn() };
  const cdr: any = { detectChanges: vi.fn() };
  return new PuntoVentaComponent(productoService, clienteService, ventaService, auth, comprobante, cdr);
}

describe('HU-S2-09 Agregar productos al carrito', () => {
  it('producto con stock entra con cantidad 1', () => {
    const c = crear();
    c.agregar(prod({ stock: 3 }));
    expect(c.carrito.length).toBe(1);
    expect(c.carrito[0].cantidad).toBe(1);
  });
  it('producto sin stock se rechaza y avisa', () => {
    const c = crear();
    c.agregar(prod({ stock: 0 }));
    expect(c.carrito.length).toBe(0);
    expect(c.esError).toBe(true);
    expect(c.mensaje).toContain('Sin stock');
  });
  it('agregar de nuevo el mismo producto aumenta la cantidad', () => {
    const c = crear(); const p = prod({ stock: 3 });
    c.agregar(p); c.agregar(p);
    expect(c.carrito.length).toBe(1);
    expect(c.carrito[0].cantidad).toBe(2);
  });
  it('no supera el stock disponible (valor límite)', () => {
    const c = crear(); const p = prod({ stock: 2 });
    c.agregar(p); c.agregar(p); c.agregar(p);
    expect(c.carrito[0].cantidad).toBe(2);
    expect(c.esError).toBe(true);
  });
  it('stock 1: se puede agregar una vez, la segunda se rechaza', () => {
    const c = crear(); const p = prod({ stock: 1 });
    c.agregar(p); c.agregar(p);
    expect(c.carrito[0].cantidad).toBe(1);
  });
});

describe('HU-S2-10 Seleccionar cliente', () => {
  it('clienteSeleccionado devuelve el cliente del id elegido', () => {
    const c = crear();
    c.clientes = [{ id: 1, nombre: 'General' }, { id: 2, nombre: 'Juan' }] as any;
    c.clienteId = 2;
    expect(c.clienteSeleccionado?.nombre).toBe('Juan');
  });
  it('sin coincidencia devuelve undefined', () => {
    const c = crear(); c.clientes = [{ id: 1, nombre: 'General' }] as any; c.clienteId = 99;
    expect(c.clienteSeleccionado).toBeUndefined();
  });
  it('al iniciar preselecciona al cliente General', () => {
    const c = crear([{ id: 1, nombre: 'Juan' }, { id: 5, nombre: 'Cliente General' }]);
    c.ngOnInit();
    expect(c.clienteId).toBe(5);
  });
});
