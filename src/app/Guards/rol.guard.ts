import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../Services/auth.service';
import { puede, primeraRuta } from '../Settings/permisos';

/** Bloquea el acceso a una ruta si el rol del usuario no tiene permiso. */
export const rolGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const rol = auth.getRol();
  const ruta = route.routeConfig?.path ?? '';

  if (puede(rol, ruta)) {
    return true;
  }

  // Si no tiene permiso, lo mandamos a su primera pantalla permitida
  router.navigate(['/' + primeraRuta(rol)]);
  return false;
};
