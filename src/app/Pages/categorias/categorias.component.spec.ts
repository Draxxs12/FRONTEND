import { of, throwError } from 'rxjs';
import { CategoriasComponent } from './categorias.component';

const prod = (id: number, catId: number | null) => ({
  id, codigo: 'C' + id, nombre: 'P' + id,
  categoria: catId == null ? null : { id: catId, nombre: 'Cat' + catId },
  precioCompra: 1, precioVenta: 2, stock: 1, stockMinimo: 1, activo: true
});

function crear(categorias: any[] = [], productos: any[] = []) {
  const categoriaService: any = {
    listar: vi.fn(() => of(categorias)),
    crear: vi.fn(() => of({})),
    actualizar: vi.fn(() => of({})),
    eliminar: vi.fn(() => of({}))
  };
  const productoService: any = { listar: vi.fn(() => of(productos)) };
  const cdr: any = { detectChanges: vi.fn() };
  const c = new CategoriasComponent(categoriaService, productoService, cdr);
  return { c, categoriaService, productoService };
}

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('HU-S2-18 Listar categorías', () => {
  it('al abrir carga todas las categorías y los productos', () => {
    const { c } = crear([{ id: 1, nombre: 'A' }, { id: 2, nombre: 'B' }], [prod(1, 1)]);
    c.ngOnInit();
    expect(c.categorias.length).toBe(2);
    expect(c.productos.length).toBe(1);
  });
  it('sin categorías el listado queda vacío', () => {
    const { c } = crear([]); c.ngOnInit();
    expect(c.categorias).toEqual([]);
  });
  it('productosDe devuelve solo los productos de esa categoría', () => {
    const { c } = crear([], [prod(1, 1), prod(2, 2), prod(3, 1), prod(4, null)]); c.ngOnInit();
    expect(c.productosDe(1).map(p => p.id)).toEqual([1, 3]);
  });
  it('productosDe sin id devuelve lista vacía', () => {
    const { c } = crear([], [prod(1, 1)]); c.ngOnInit();
    expect(c.productosDe(undefined)).toEqual([]);
  });
  it('toggleExpandir abre una categoría y la cierra al repetir', () => {
    const { c } = crear();
    c.toggleExpandir(3); expect(c.expandida).toBe(3);
    c.toggleExpandir(3); expect(c.expandida).toBeNull();
  });
  it('al expandir otra categoría se cierra la anterior', () => {
    const { c } = crear();
    c.toggleExpandir(1); c.toggleExpandir(2);
    expect(c.expandida).toBe(2);
  });
});

describe('HU-S2-19 Registrar nueva categoría', () => {
  it('abrirNuevo muestra el modal con el formulario vacío', () => {
    const { c } = crear(); c.form = { id: 4, nombre: 'viejo' }; c.abrirNuevo();
    expect(c.mostrarModal).toBe(true);
    expect(c.modoEdicion).toBe(false);
    expect(c.form).toEqual({ nombre: '' });
  });
  it('nombre vacío no guarda y avisa', () => {
    const { c, categoriaService } = crear(); c.abrirNuevo(); c.form.nombre = '';
    c.guardar();
    expect(categoriaService.crear).not.toHaveBeenCalled();
    expect(c.mensaje).toBe('El nombre es obligatorio.');
    expect(c.esError).toBe(true);
  });
  it('nombre con solo espacios no guarda (valor límite)', () => {
    const { c, categoriaService } = crear(); c.abrirNuevo(); c.form.nombre = '   ';
    c.guardar();
    expect(categoriaService.crear).not.toHaveBeenCalled();
  });
  it('nombre de 1 carácter es válido (valor límite)', () => {
    const { c, categoriaService } = crear(); c.abrirNuevo(); c.form.nombre = 'A';
    c.guardar();
    expect(categoriaService.crear).toHaveBeenCalledWith({ nombre: 'A' });
  });
  it('categoría válida: crea, cierra el modal, recarga y confirma', () => {
    const { c, categoriaService } = crear(); c.abrirNuevo(); c.form.nombre = 'Pinturas';
    const cargas = categoriaService.listar.mock.calls.length;
    c.guardar();
    expect(categoriaService.crear).toHaveBeenCalledWith({ nombre: 'Pinturas' });
    expect(categoriaService.actualizar).not.toHaveBeenCalled();
    expect(c.mostrarModal).toBe(false);
    expect(c.mensaje).toBe('Categoría guardada.');
    expect(c.esError).toBe(false);
    expect(categoriaService.listar.mock.calls.length).toBe(cargas + 1);
  });
  it('si el servidor falla (por ejemplo nombre repetido) muestra el error', () => {
    const { c, categoriaService } = crear(); c.abrirNuevo(); c.form.nombre = 'Pinturas';
    categoriaService.crear.mockReturnValue(throwError(() => ({ status: 500 })));
    c.guardar();
    expect(c.esError).toBe(true);
    expect(c.mensaje).toBe('Error al guardar.');
  });
  it('el mensaje de confirmación desaparece a los 4 segundos (valor límite)', () => {
    const { c } = crear(); c.abrirNuevo(); c.form.nombre = 'Pinturas';
    c.guardar();
    vi.advanceTimersByTime(3999); expect(c.mensaje).not.toBe('');
    vi.advanceTimersByTime(1);    expect(c.mensaje).toBe('');
  });

  // ROJO ESPERADO: la pantalla valida con trim() pero luego envía el nombre sin recortar,
  // así que "  Pinturas " queda guardado con espacios. Corrección sugerida: enviar this.form.nombre.trim().
  it('ROJO esperado: el nombre se guarda sin espacios sobrantes', () => {
    const { c, categoriaService } = crear(); c.abrirNuevo(); c.form.nombre = '  Pinturas ';
    c.guardar();
    expect(categoriaService.crear).toHaveBeenCalledWith({ nombre: 'Pinturas' });
  });
});

describe('HU-S2-20 Editar categoría', () => {
  it('abrirEditar carga una copia de la categoría en el formulario', () => {
    const { c } = crear(); const original = { id: 2, nombre: 'Pinturas' };
    c.abrirEditar(original);
    expect(c.modoEdicion).toBe(true);
    expect(c.form).toEqual(original);
    expect(c.form).not.toBe(original);          // es copia: cancelar no altera el listado
  });
  it('guardar en edición actualiza la categoría, no crea otra', () => {
    const { c, categoriaService } = crear(); c.abrirEditar({ id: 2, nombre: 'Pinturas' });
    c.form.nombre = 'Pinturas y barnices';
    c.guardar();
    expect(categoriaService.actualizar).toHaveBeenCalledWith(2, { id: 2, nombre: 'Pinturas y barnices' });
    expect(categoriaService.crear).not.toHaveBeenCalled();
    expect(c.mensaje).toBe('Categoría guardada.');
  });
  it('editar dejando el nombre vacío se rechaza', () => {
    const { c, categoriaService } = crear(); c.abrirEditar({ id: 2, nombre: 'Pinturas' });
    c.form.nombre = '';
    c.guardar();
    expect(categoriaService.actualizar).not.toHaveBeenCalled();
    expect(c.mensaje).toBe('El nombre es obligatorio.');
  });
  it('cerrar oculta el modal sin guardar', () => {
    const { c, categoriaService } = crear(); c.abrirEditar({ id: 2, nombre: 'X' });
    c.cerrar();
    expect(c.mostrarModal).toBe(false);
    expect(categoriaService.actualizar).not.toHaveBeenCalled();
  });
});

describe('H0054 Eliminar categoría', () => {
  it('si se cancela la confirmación no elimina', () => {
    vi.stubGlobal('confirm', () => false);
    const { c, categoriaService } = crear();
    c.eliminar({ id: 1, nombre: 'A' });
    expect(categoriaService.eliminar).not.toHaveBeenCalled();
  });
  it('confirmado: elimina y recarga', () => {
    vi.stubGlobal('confirm', () => true);
    const { c, categoriaService } = crear();
    const cargas = categoriaService.listar.mock.calls.length;
    c.eliminar({ id: 1, nombre: 'A' });
    expect(categoriaService.eliminar).toHaveBeenCalledWith(1);
    expect(categoriaService.listar.mock.calls.length).toBe(cargas + 1);
  });
  it('si tiene productos asociados avisa que no se pudo eliminar', () => {
    vi.stubGlobal('confirm', () => true);
    const { c, categoriaService } = crear();
    categoriaService.eliminar.mockReturnValue(throwError(() => ({ status: 409 })));
    c.eliminar({ id: 1, nombre: 'A' });
    expect(c.esError).toBe(true);
    expect(c.mensaje).toContain('No se pudo eliminar');
  });
  it('una categoría sin id no se intenta eliminar', () => {
    vi.stubGlobal('confirm', () => true);
    const { c, categoriaService } = crear();
    c.eliminar({ nombre: 'sin id' });
    expect(categoriaService.eliminar).not.toHaveBeenCalled();
  });
});
