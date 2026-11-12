import { HttpInterceptorFn } from '@angular/common/http';
import { appsettings } from '../Settings/appsettings';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const apiUrl = new URL(appsettings.apiUrl);
  const requestUrl = new URL(req.url, apiUrl);
  const apiPath = apiUrl.pathname.replace(/\/$/, '');

  // El token solo se envía a solicitudes dirigidas al backend configurado.
  const esSolicitudApi =
    requestUrl.origin === apiUrl.origin &&
    (requestUrl.pathname === apiPath || requestUrl.pathname.startsWith(apiPath + '/'));

  if (!esSolicitudApi || typeof localStorage === 'undefined') {
    return next(req);
  }

  const token = localStorage.getItem('token');

  if (!token) {
    return next(req);
  }

  return next(req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  }));
};
