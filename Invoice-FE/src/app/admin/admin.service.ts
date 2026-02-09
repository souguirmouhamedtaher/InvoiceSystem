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
  role: 'manager' | 'accountant';
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

export interface SimpleUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
}

export interface AssignUserPayload {
  userId: string;
  companyId: string;
  role: 'manager' | 'accountant';
}

export interface CreateCompanyUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  companyId: string;
  role: 'manager' | 'accountant';
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

  getAuditLogs(filters: { companyId?: string; userId?: string; action?: string; page?: number; limit?: number } = {}): Observable<{ logs: AuditLog[]; total: number }> {
    let params = new HttpParams()
      .set('page', (filters.page || 1).toString())
      .set('limit', (filters.limit || 50).toString());
    
    if (filters.companyId) params = params.set('companyId', filters.companyId);
    if (filters.userId) params = params.set('userId', filters.userId);
    if (filters.action) params = params.set('action', filters.action);

    return this.http.get<{ logs: AuditLog[]; total: number }>(`${this.apiUrl}/audit-logs`, { params });
  }

  getAllUsers(page: number = 1, limit: number = 1000): Observable<{ Users: SimpleUser[]; totalUsers: number }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get<{ Users: SimpleUser[]; totalUsers: number }>(`${this.apiUrl}`, { params });
  }

  assignUserToCompany(payload: AssignUserPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/company-memberships`, payload);
  }

  createCompanyUser(payload: CreateCompanyUserPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/company-users`, payload);
  }
}
