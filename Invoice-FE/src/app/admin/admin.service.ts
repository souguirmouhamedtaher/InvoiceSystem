import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CompanyMembership {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  companyId: {
    _id: string;
    companyname: string;
  };
  role: 'MANAGER' | 'ACCOUNTANT';
  createdBy: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  userId: string;
  companyId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: any;
  createdAt: string;
}

export interface CreateCompanyUserPayload {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  password?: string;
  companyId: string;
  role: 'MANAGER' | 'ACCOUNTANT';
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/sadmin`;

  /** Company-scoped: list members (owner or super admin). Use selected company. */
  getCompanyMembers(companyId: string): Observable<{ memberships: CompanyMembership[]; total: number }> {
    return this.http.get<{ memberships: CompanyMembership[]; total: number }>(
      `${environment.apiBaseUrl}/company/${companyId}/members`
    );
  }

  /** Company-scoped: add manager/accountant (owner or super admin). */
  addCompanyMember(companyId: string, payload: Omit<CreateCompanyUserPayload, 'companyId'>): Observable<{ user: any; membershipId: string }> {
    return this.http.post<{ user: any; membershipId: string }>(
      `${environment.apiBaseUrl}/company/${companyId}/members`,
      payload
    );
  }

  /** Company-scoped: remove member (owner or super admin). */
  deleteCompanyMembership(membershipId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/company/memberships/${membershipId}`);
  }

  /** Super Admin only: list all memberships (optional company filter). */
  getCompanyMemberships(companyId?: string, page: number = 1, limit: number = 20): Observable<{ memberships: CompanyMembership[]; total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (companyId) params = params.set('companyId', companyId);
    return this.http.get<{ memberships: CompanyMembership[]; total: number }>(`${this.apiUrl}/company-memberships`, { params });
  }

  /** Super Admin only: add user to company. */
  addCompanyUser(payload: CreateCompanyUserPayload): Observable<{ user: any; membershipId: string }> {
    return this.http.post<{ user: any; membershipId: string }>(`${this.apiUrl}/company-users`, payload);
  }

  /** Company-scoped: audit logs for selected company (owner, manager, accountant). */
  getCompanyAuditLogs(companyId: string, filters: { page?: number; limit?: number; action?: string } = {}): Observable<{ logs: AuditLog[]; total: number }> {
    let params = new HttpParams()
      .set('page', (filters.page || 1).toString())
      .set('limit', (filters.limit || 50).toString());
    if (filters.action) params = params.set('action', filters.action);
    return this.http.get<{ logs: AuditLog[]; total: number }>(
      `${environment.apiBaseUrl}/company/${companyId}/audit-logs`,
      { params }
    );
  }

  /** Super Admin only: all audit logs. */
  getAuditLogs(filters: { companyId?: string; userId?: string; action?: string; page?: number; limit?: number } = {}): Observable<{ logs: AuditLog[]; total: number }> {
    let params = new HttpParams()
      .set('page', (filters.page || 1).toString())
      .set('limit', (filters.limit || 50).toString());
    if (filters.companyId) params = params.set('companyId', filters.companyId);
    if (filters.userId) params = params.set('userId', filters.userId);
    if (filters.action) params = params.set('action', filters.action);
    return this.http.get<{ logs: AuditLog[]; total: number }>(`${this.apiUrl}/audit-logs`, { params });
  }
}
