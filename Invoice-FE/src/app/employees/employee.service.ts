import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../core/api-response';
import { environment } from '../../environments/environment';
import {
  CreateEmployeePayload,
  Employee,
  EmployeeListResponse,
  UpdateEmployeePayload,
} from './employee.model';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private http = inject(HttpClient);

  createEmployee(payload: CreateEmployeePayload): Observable<Employee> {
    return this.http
      .post<ApiResponse<Employee>>(`${environment.apiBaseUrl}/employee`, payload)
      .pipe(map((response) => response.data));
  }

  getEmployees(params: {
    page: number;
    limit: number;
    search?: string;
    companyId?: string;
  }): Observable<EmployeeListResponse> {
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
      .get<ApiResponse<EmployeeListResponse>>(`${environment.apiBaseUrl}/employee`, { params: query })
      .pipe(map((response) => response.data));
  }

  getEmployeeById(id: string): Observable<Employee> {
    return this.http
      .get<ApiResponse<Employee>>(`${environment.apiBaseUrl}/employee/${id}`)
      .pipe(map((response) => response.data));
  }

  updateEmployee(id: string, payload: UpdateEmployeePayload): Observable<Employee> {
    return this.http
      .patch<ApiResponse<Employee>>(`${environment.apiBaseUrl}/employee/${id}`, payload)
      .pipe(map((response) => response.data));
  }

  deleteEmployee(id: string): Observable<{ success: boolean }> {
    return this.http
      .delete<ApiResponse<{ success: boolean }>>(`${environment.apiBaseUrl}/employee/${id}`)
      .pipe(map((response) => response.data));
  }

  generateMonthlyPayroll(payload: {
    month: string;
    companyId?: string;
  }): Observable<{
    month: string;
    companyId: string | null;
    payrollDate: string;
    createdSalaries: number;
    skippedSalaries: number;
    createdCnss: number;
    skippedCnss: number;
    totalSalaryAmount: number;
    totalCnssAmount: number;
  }> {
    return this.http
      .post<
        ApiResponse<{
          month: string;
          companyId: string | null;
          payrollDate: string;
          createdSalaries: number;
          skippedSalaries: number;
          createdCnss: number;
          skippedCnss: number;
          totalSalaryAmount: number;
          totalCnssAmount: number;
        }>
      >(`${environment.apiBaseUrl}/employee/generate-monthly`, payload)
      .pipe(map((response) => response.data));
  }

  getPayrollSummary(params: {
    month: string;
    companyId?: string;
  }): Observable<{
    month: string;
    totalSalaryAmount: number;
    totalCnssAmount: number;
    salaryCount: number;
    cnssCount: number;
  }> {
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
      .get<
        | ApiResponse<{ month: string; totalSalaryAmount: number; totalCnssAmount: number; salaryCount: number; cnssCount: number }>
        | { month: string; totalSalaryAmount: number; totalCnssAmount: number; salaryCount: number; cnssCount: number }
      >(`${environment.apiBaseUrl}/employee/payroll/summary`, { params: query })
      .pipe(map((response: any) => response?.data ?? response));
  }

  importEmployeesCsv(payload: { companyId: string; csv: string }): Observable<{ 
    created: number; 
    skipped: number; 
    errors: Array<{ row: number; data: Record<string, string>; errors: string[] }>; 
    totalRows: number 
  }> {
    return this.http
      .post<ApiResponse<{ 
        created: number; 
        skipped: number; 
        errors: Array<{ row: number; data: Record<string, string>; errors: string[] }>; 
        totalRows: number 
      }>>(`${environment.apiBaseUrl}/employee/import-csv`, payload)
      .pipe(map((response) => response.data));
  }

  exportEmployeesCsv(companyId: string): Observable<string> {
    const params = new HttpParams().set('companyId', companyId);
    return this.http.get(`${environment.apiBaseUrl}/employee/export-csv`, {
      params,
      responseType: 'text',
    });
  }
}
