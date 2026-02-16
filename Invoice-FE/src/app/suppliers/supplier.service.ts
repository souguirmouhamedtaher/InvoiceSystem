import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../core/api-response';
import { environment } from '../../environments/environment';
import { CreateSupplierPayload, Supplier, SupplierListResponse, UpdateSupplierPayload } from './supplier.model';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private http = inject(HttpClient);

  createSupplier(payload: CreateSupplierPayload): Observable<Supplier> {
    return this.http
      .post<ApiResponse<Supplier> | Supplier>(`${environment.apiBaseUrl}/suppliers`, payload)
      .pipe(map((response: any) => response?.data ?? response));
  }

  getSupplierById(id: string): Observable<Supplier> {
    return this.http
      .get<ApiResponse<Supplier>>(`${environment.apiBaseUrl}/suppliers/${id}`)
      .pipe(map((response) => response.data));
  }

  getSuppliers(params: {
    companyId: string;
    page: number;
    limit: number;
    search?: string;
  }): Observable<SupplierListResponse> {
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
      .get<ApiResponse<SupplierListResponse>>(`${environment.apiBaseUrl}/suppliers`, { params: query })
      .pipe(map((response) => response.data));
  }

  updateSupplier(id: string, payload: UpdateSupplierPayload): Observable<Supplier> {
    return this.http
      .patch<ApiResponse<Supplier>>(`${environment.apiBaseUrl}/suppliers/${id}`, payload)
      .pipe(map((response) => response.data));
  }

  deleteSupplier(id: string): Observable<{ success: boolean }> {
    return this.http
      .delete<ApiResponse<{ success: boolean }>>(`${environment.apiBaseUrl}/suppliers/${id}`)
      .pipe(map((response) => response.data));
  }
}
