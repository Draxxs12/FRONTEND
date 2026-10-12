import { Subject } from 'rxjs';
import { NavigationEnd } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LayoutComponent } from './layout.component';
import { puede, rutasDe, primeraRuta, PERMISOS } from '../../Settings/permisos';
import { rolGuard } from '../../Guards/rol.guard';
import { AuthService } from '../../Services/auth.service';

/**
 * HU-S2-07 (H0026) Navegación rápida desde el dashboard.
 * La navegación del sistema vive en el menú lateral (LayoutComponent) y se
 * filtra por rol con permisos.ts. Estas pruebas verifican qué accesos ve cada rol.
 */
describe('HU-S2-07 Permisos por rol (qué accesos ve cada usuario)', () => {
  it('el Administrador entra a todas las rutas', () => {
    expect(puede('Administrador', 'usuarios')).toBe(true);
    expect(puede('Administrador', 'stock')).toBe(true);
    expect(puede('Administrador', 'ruta-que-no-existe')).toBe(true);
  });
  it('el Recepcionista entra a ventas y caja', () => {
    expect(puede('Recepcionista', 'punto-de-venta')).toBe(true);
    expect(puede('Recepcionista', 'historial-ventas')).toBe(true);
    expect(puede('Recepcionista', 'caja')).toBe(true);
  });
  it('el Recepcionista NO entra a inventario ni administración', () => {
    expect(puede('Recepcionista', 'productos')).toBe(false);
    expect(puede('Recepcionista', 'stock')).toBe(false);
    expect(puede('Recepcionista', 'usuarios')).toBe(false);
  });
  it('el Almacenero entra a inventario y abastecimiento', () => {
    expect(puede('Almacenero', 'productos')).toBe(true);
    expect(puede('Almacenero', 'categorias')).toBe(true);
    expect(puede('Almacenero', 'stock')).toBe(true);
    expect(puede('Almacenero', 'compras')).toBe(true);
  });
  it('el Almacenero NO entra al punto de venta ni a caja', () => {
    expect(puede('Almacenero', 'punto-de-venta')).toBe(false);
    expect(puede('Almacenero', 'caja')).toBe(false);
  });
  it('todos los roles definidos pueden entrar al dashboard', () => {
    Object.keys(PERMISOS).forEach(rol => expect(puede(rol, 'dashboard')).toBe(true));
  });
  it('un rol desconocido o sin rol solo ve el dashboard (valor límite)', () => {
    expect(rutasDe('Invitado')).toEqual(['dashboard']);
    expect(rutasDe(null)).toEqual(['dashboard']);
    expect(puede(null, 'dashboard')).toBe(true);
    expect(puede(null, 'ventas')).toBe(false);
  });
  it('primeraRuta manda al Administrador al dashboard', () => {
    expect(primeraRuta('Administrador')).toBe('dashboard');
  });
  it('primeraRuta manda a cada rol a su primera pantalla permitida', () => {
    expect(primeraRuta('Recepcionista')).toBe('dashboard');
    expect(primeraRuta('Almacenero')).toBe('dashboard');
    expect(primeraRuta(null)).toBe('dashboard');
  });
});

describe('HU-S2-07 Guard de rutas (rolGuard)', () => {
  function evaluar(rol: string | null, path: string) {
    const router: any = { navigate: vi.fn() };
    const auth: any = { getRol: () => rol };
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: auth }, { provide: Router, useValue: router }]
    });
    const permitido = TestBed.runInInjectionContext(
      () => rolGuard({ routeConfig: { path } } as any, {} as any));
    return { permitido, router };
  }

  it('deja pasar si el rol tiene permiso', () => {
    const { permitido, router } = evaluar('Almacenero', 'stock');
    expect(permitido).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });
  it('bloquea y redirige si el rol no tiene permiso', () => {
    const { permitido, router } = evaluar('Recepcionista', 'usuarios');
    expect(permitido).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});

describe('HU-S2-07 Menú lateral (LayoutComponent)', () => {
  function crear(rol: string, nombre = 'dany baca') {
    const events = new Subject<any>();
    const router: any = { events, navigate: vi.fn() };
    const route: any = { firstChild: null, snapshot: { data: {} } };
    const auth: any = { getNombre: () => nombre, getRol: () => rol, logout: vi.fn() };
    const cdr: any = { detectChanges: vi.fn() };
    const c = new LayoutComponent(auth, router, route, cdr);
    c.ngOnInit();
    return { c, auth, router, route, events };
  }

  it('toma el nombre, el rol y la inicial en mayúscula del usuario', () => {
    const { c } = crear('Almacenero', 'dany baca');
    expect(c.nombre).toBe('dany baca');
    expect(c.rol).toBe('Almacenero');
    expect(c.inicial).toBe('D');
  });
  it('sin nombre usa "Usuario"', () => {
    const { c } = crear('Almacenero', '');
    expect(c.nombre).toBe('Usuario');
    expect(c.inicial).toBe('U');
  });
  it('el Administrador ve todos los grupos del menú', () => {
    const { c } = crear('Administrador');
    expect(c.grupoVentas()).toBe(true);
    expect(c.grupoInventario()).toBe(true);
    expect(c.grupoAbastecimiento()).toBe(true);
    expect(c.grupoAdmin()).toBe(true);
  });
  it('el Almacenero ve Inventario y Abastecimiento, no Ventas ni Administración', () => {
    const { c } = crear('Almacenero');
    expect(c.grupoInventario()).toBe(true);
    expect(c.grupoAbastecimiento()).toBe(true);
    expect(c.grupoVentas()).toBe(false);
    expect(c.grupoAdmin()).toBe(false);
  });
  it('el Recepcionista ve Ventas, no Inventario', () => {
    const { c } = crear('Recepcionista');
    expect(c.grupoVentas()).toBe(true);
    expect(c.grupoInventario()).toBe(false);
  });
  it('toggle abre y cierra un grupo desplegable', () => {
    const { c } = crear('Administrador');
    expect(c.grupos.ventas).toBe(true);
    c.toggle('ventas');
    expect(c.grupos.ventas).toBe(false);
    c.toggle('ventas');
    expect(c.grupos.ventas).toBe(true);
  });
  it('al navegar, el título de la sección sale de la ruta activa', () => {
    const { c, route, events } = crear('Administrador');
    (route as any).firstChild = { firstChild: null, snapshot: { data: { titulo: 'Inventario' } } };
    events.next(new NavigationEnd(1, '/stock', '/stock'));
    expect(c.tituloSeccion).toBe('Inventario');
  });
  it('si la ruta no trae título usa "Dashboard"', () => {
    const { c, route, events } = crear('Administrador');
    (route as any).firstChild = { firstChild: null, snapshot: { data: {} } };
    events.next(new NavigationEnd(2, '/x', '/x'));
    expect(c.tituloSeccion).toBe('Dashboard');
  });
  it('salir cierra la sesión y vuelve al login', () => {
    const { c, auth, router } = crear('Administrador');
    c.salir();
    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
