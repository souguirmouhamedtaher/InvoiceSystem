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

export type ProfilePayload = {
  phone: string;
};

export type UserProfile = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  login(payload: LoginPayload): Observable<void> {
    return this.http
      .post<ApiResponse<AuthTokens> | AuthTokens>(`${environment.apiBaseUrl}/auth/login`, payload)
      .pipe(
        tap((response: any) => {
          const tokens = response?.data ?? response;
          if (tokens?.accessToken) this.storeTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken ?? '' });
        }),
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

  /** True if the current user has the super_admin role (from JWT). */
  isSuperAdmin(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    try {
      const payload = this.decodeJwtPayload(token);
      const roles: unknown = payload?.['roles'];
      if (!Array.isArray(roles)) return false;
      return roles.some(
        (r) => String(r).toLowerCase() === 'super_admin' || String(r).toLowerCase() === 'superadmin'
      );
    } catch {
      return false;
    }
  }

  private decodeJwtPayload(token: string): Record<string, unknown> | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json) as Record<string, unknown>;
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
      .post<ApiResponse<AuthTokens> | AuthTokens>(`${environment.apiBaseUrl}/auth/refresh`, {}, { headers })
      .pipe(
        tap((response: any) => {
          const tokens = response?.data ?? response;
          if (tokens?.accessToken) this.storeTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken ?? '' });
        }),
        map((response: any) => response?.data ?? response)
      );
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

  loadMe(): Observable<UserProfile> {
    return this.http
      .get<ApiResponse<UserProfile> | UserProfile>(`${environment.apiBaseUrl}/auth/loadme`)
      .pipe(map((response: any) => response?.data ?? response));
  }

  updateProfile(payload: ProfilePayload): Observable<UserProfile> {
    return this.http
      .patch<ApiResponse<UserProfile> | UserProfile>(`${environment.apiBaseUrl}/auth/profile`, payload)
      .pipe(map((response: any) => response?.data ?? response));
  }

  updatePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http
      .post<ApiResponse<string>>(`${environment.apiBaseUrl}/auth/updatePassword`, {
        currentPassword,
        newPassword,
      })
      .pipe(map(() => void 0));
  }
}
