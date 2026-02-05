import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../core/api-response';
import { environment } from '../../environments/environment';
import {
  CnssPayment,
  CnssListResponse,
  CreateCnssPaymentPayload,
  UpdateCnssPaymentPayload,
} from './cnss.model';

@Injectable({ providedIn: 'root' })
export class CnssService {
  private http = inject(HttpClient);

  createPayment(payload: CreateCnssPaymentPayload): Observable<CnssPayment> {
    return this.http
      .post<ApiResponse<CnssPayment>>(`${environment.apiBaseUrl}/cnss`, payload)
      .pipe(map((response) => response.data));
  }

  getPayments(params: {
    page: number;
    limit: number;
    employeeId?: string;
    month?: string;
  }): Observable<CnssListResponse> {
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
      .get<ApiResponse<CnssListResponse>>(`${environment.apiBaseUrl}/cnss`, { params: query })
      .pipe(map((response) => response.data));
  }

  getPaymentById(id: string): Observable<CnssPayment> {
    return this.http
      .get<ApiResponse<CnssPayment>>(`${environment.apiBaseUrl}/cnss/${id}`)
      .pipe(map((response) => response.data));
  }

  updatePayment(id: string, payload: UpdateCnssPaymentPayload): Observable<CnssPayment> {
    return this.http
      .patch<ApiResponse<CnssPayment>>(`${environment.apiBaseUrl}/cnss/${id}`, payload)
      .pipe(map((response) => response.data));
  }

  deletePayment(id: string): Observable<{ success: boolean }> {
    return this.http
      .delete<ApiResponse<{ success: boolean }>>(`${environment.apiBaseUrl}/cnss/${id}`)
      .pipe(map((response) => response.data));
  }
}
