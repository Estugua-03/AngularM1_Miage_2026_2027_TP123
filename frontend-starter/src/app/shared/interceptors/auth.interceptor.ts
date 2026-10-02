import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Adds the bearer token to protected API requests. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  // Ne transmettre le JWT qu'aux routes privées de notre API, jamais à un autre site.
  const protectedApi = /^\/api\/(users|tracks)(\/|\?|$)/.test(request.url);
  const token = auth.token();
  const outgoing = protectedApi && token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(outgoing).pipe(catchError((error: unknown) => {
    // Une ancienne requête ne doit pas fermer une nouvelle session ouverte entre-temps.
    if (protectedApi && error instanceof HttpErrorResponse && error.status === 401
        && token === auth.token()) {
      auth.logout();
      void router.navigateByUrl('/login');
    }
    return throwError(() => error); // Le composant doit encore afficher l'échec.
  }));
};
