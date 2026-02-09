import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { ApiResponse } from '../core/api-response';
import { environment } from '../../environments/environment';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type SignUpPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  login(payload: LoginPayload): Observable<void> {
    return this.http
      .post<ApiResponse<AuthTokens>>(`${environment.apiBaseUrl}/auth/login`, payload)
      .pipe(
        tap((response) => this.storeTokens(response.data)),
        map(() => void 0)
      );
  }

  signUp(payload: SignUpPayload): Observable<void> {
    return this.http
      .post<ApiResponse<Record<string, unknown>>>(`${environment.apiBaseUrl}/auth/SignUp`, payload)
      .pipe(map(() => void 0));
  }

  logout(): Observable<void> {
    return this.http.post<ApiResponse<string>>(`${environment.apiBaseUrl}/auth/logout`, {}).pipe(
      tap(() => this.clearTokens()),
      map(() => void 0),
      catchError(() => {
        this.clearTokens();
        return of(void 0);
      })
    );
  }

  isLoggedIn(): boolean {
    return isPlatformBrowser(this.platformId) && !!localStorage.getItem('accessToken');
  }

  getAccessToken(): string | null {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem('accessToken') : null;
  }

  getRefreshToken(): string | null {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem('refreshToken') : null;
  }

  private storeTokens(tokens: AuthTokens): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
    }
  }

  clearTokens(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  refreshTokens(): Observable<AuthTokens> {
    const refreshToken = this.getRefreshToken();
    const headers = refreshToken
      ? new HttpHeaders({ Authorization: `Bearer ${refreshToken}` })
      : undefined;

    return this.http
      .post<ApiResponse<AuthTokens>>(`${environment.apiBaseUrl}/auth/refresh`, {}, { headers })
      .pipe(tap((response) => this.storeTokens(response.data)), map((response) => response.data));
  }

  forgotPassword(email: string, resetPassLink: string): Observable<void> {
    return this.http
      .post<ApiResponse<string>>(`${environment.apiBaseUrl}/auth/forgotPassword`, {
        email,
        resetPassLink,
      })
      .pipe(map(() => void 0));
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http
      .post<ApiResponse<string>>(`${environment.apiBaseUrl}/auth/resetPassword?token=${encodeURIComponent(token)}`, {
        token,
        newPassword,
      })
      .pipe(map(() => void 0));
  }
}
