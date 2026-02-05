import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../core/api-response';
import { environment } from '../../environments/environment';
import { CreateSalaryPayload, Salary, SalaryListResponse, UpdateSalaryPayload } from './salary.model';

@Injectable({ providedIn: 'root' })
export class SalaryService {
  private http = inject(HttpClient);

  createSalary(payload: CreateSalaryPayload): Observable<Salary> {
    return this.http
      .post<ApiResponse<Salary>>(`${environment.apiBaseUrl}/salary`, payload)
      .pipe(map((response) => response.data));
  }

  getSalaries(params: {
    page: number;
    limit: number;
    employeeId?: string;
    month?: string;
  }): Observable<SalaryListResponse> {
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
      .get<ApiResponse<SalaryListResponse>>(`${environment.apiBaseUrl}/salary`, { params: query })
      .pipe(map((response) => response.data));
  }

  getSalaryById(id: string): Observable<Salary> {
    return this.http
      .get<ApiResponse<Salary>>(`${environment.apiBaseUrl}/salary/${id}`)
      .pipe(map((response) => response.data));
  }

  updateSalary(id: string, payload: UpdateSalaryPayload): Observable<Salary> {
    return this.http
      .patch<ApiResponse<Salary>>(`${environment.apiBaseUrl}/salary/${id}`, payload)
      .pipe(map((response) => response.data));
  }

  deleteSalary(id: string): Observable<{ success: boolean }> {
    return this.http
      .delete<ApiResponse<{ success: boolean }>>(`${environment.apiBaseUrl}/salary/${id}`)
      .pipe(map((response) => response.data));
  }
}
