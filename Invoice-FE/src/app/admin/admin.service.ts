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
  companyId: string;
  role: 'MANAGER' | 'ACCOUNTANT';
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/sadmin`;

  getCompanyMemberships(companyId?: string, page: number = 1, limit: number = 20): Observable<{ memberships: CompanyMembership[]; total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (companyId) {
      params = params.set('companyId', companyId);
    }

    return this.http.get<{ memberships: CompanyMembership[]; total: number }>(`${this.apiUrl}/company-memberships`, { params });
  }

  deleteCompanyMembership(membershipId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/company-memberships/${membershipId}`);
  }

  addCompanyUser(payload: CreateCompanyUserPayload): Observable<{ user: any; membershipId: string }> {
    return this.http.post<{ user: any; membershipId: string }>(`${this.apiUrl}/company-users`, payload);
  }

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
