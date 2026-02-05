import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, Observable, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthService, AuthTokens } from './auth.service';

let refreshInFlight$: Observable<AuthTokens> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const isRefreshRequest = req.url.includes('/auth/refresh');

  const token = isRefreshRequest ? authService.getRefreshToken() : authService.getAccessToken();
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isRefreshRequest) {
        return throwError(() => error);
      }

      const refreshToken = authService.getRefreshToken();
      if (!refreshToken) {
        authService.clearTokens();
        router.navigate(['/login']);
        return throwError(() => error);
      }

      if (!refreshInFlight$) {
        refreshInFlight$ = authService.refreshTokens().pipe(
          shareReplay(1),
          finalize(() => {
            refreshInFlight$ = null;
          })
        );
      }

      return refreshInFlight$.pipe(
        switchMap((tokens) => {
          const retryReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          });
          return next(retryReq);
        }),
        catchError((refreshError) => {
          authService.clearTokens();
          router.navigate(['/login']);
          return throwError(() => refreshError);
        })
      );
    })
  );
};
