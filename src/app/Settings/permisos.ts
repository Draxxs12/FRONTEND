// Permisos por rol: define a qué secciones puede entrar cada rol.
// El administrador asigna el ROL al usuario (en la pantalla de Usuarios),
// y ese rol decide qué ve y a qué puede entrar.

export const PERMISOS: Record<string, string[]> = {
  // El administrador ve TODO
  'Administrador': ['*'],

  // Área de ventas / atención al cliente
  'Recepcionista': ['dashboard', 'punto-de-venta', 'historial-ventas', 'devoluciones', 'caja', 'clientes'],

  // Área de almacén / abastecimiento
  'Almacenero': ['dashboard', 'productos', 'categorias', 'stock', 'compras', 'proveedores'],
};

/** Lista de rutas permitidas para un rol (por defecto, solo dashboard). */
export function rutasDe(rol: string | null): string[] {
  if (!rol) return ['dashboard'];
  return PERMISOS[rol] ?? ['dashboard'];
}

/** ¿El rol puede entrar a esa ruta? */
export function puede(rol: string | null, ruta: string): boolean {
  const permitidas = rutasDe(rol);
  return permitidas.includes('*') || permitidas.includes(ruta);
}

/** Primera ruta a la que se puede mandar al usuario según su rol. */
export function primeraRuta(rol: string | null): string {
  const permitidas = rutasDe(rol);
  if (permitidas.includes('*')) return 'dashboard';
  return permitidas[0] ?? 'dashboard';
}
