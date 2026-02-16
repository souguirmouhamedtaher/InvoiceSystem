import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../core/api-response';
import { environment } from '../../environments/environment';
import { Company, CompanyListResponse, CreateCompanyPayload, UpdateCompanyPayload } from './company.model';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private http = inject(HttpClient);

  createCompany(payload: CreateCompanyPayload): Observable<Company> {
    return this.http
      .post<ApiResponse<Company> | Company>(`${environment.apiBaseUrl}/company`, payload)
      .pipe(map((response: any) => response?.data ?? response));
  }

  getCompanyById(id: string): Observable<Company> {
    return this.http
      .get<ApiResponse<Company>>(`${environment.apiBaseUrl}/company/${id}`)
      .pipe(map((response) => response.data));
  }

  getCompanies(params: {
    page: number;
    limit: number;
    search?: string;
    region?: string;
    country?: string;
  }): Observable<CompanyListResponse> {
    const query = new HttpParams({
      fromObject: Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
        if (value === undefined || value === null || value === '') {
          return acc;
        }
        acc[key] = String(value);
        return acc;
      }, {}),
    });

    return this.http
      .get<ApiResponse<CompanyListResponse>>(`${environment.apiBaseUrl}/company`, { params: query })
      .pipe(map((response) => response.data));
  }

  updateCompany(id: string, payload: UpdateCompanyPayload): Observable<Company> {
    return this.http
      .patch<ApiResponse<Company>>(`${environment.apiBaseUrl}/company/${id}`, payload)
      .pipe(map((response) => response.data));
  }

  deleteCompany(id: string): Observable<{ success: boolean }> {
    return this.http
      .delete<ApiResponse<{ success: boolean }>>(`${environment.apiBaseUrl}/company/${id}`)
      .pipe(map((response) => response.data));
  }
}
