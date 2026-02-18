import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../core/api-response';
import { environment } from '../../environments/environment';
import {
  CreateTvaPaymentPayload,
  TvaPayment,
  TvaPaymentListResponse,
  UpdateTvaPaymentPayload,
} from './tva-payments.model';

@Injectable({ providedIn: 'root' })
export class TvaPaymentsService {
  private http = inject(HttpClient);

  createPayment(payload: CreateTvaPaymentPayload): Observable<TvaPayment> {
    return this.http
      .post<ApiResponse<TvaPayment>>(`${environment.apiBaseUrl}/tva-payments`, payload)
      .pipe(map((response) => response.data));
  }

  getPayments(params: {
    page: number;
    limit: number;
    month?: string;
    companyId?: string;
  }): Observable<TvaPaymentListResponse> {
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
      .get<ApiResponse<TvaPaymentListResponse>>(`${environment.apiBaseUrl}/tva-payments`, { params: query })
      .pipe(map((response) => response.data));
  }

  getPaymentById(id: string): Observable<TvaPayment> {
    return this.http
      .get<ApiResponse<TvaPayment>>(`${environment.apiBaseUrl}/tva-payments/${id}`)
      .pipe(map((response) => response.data));
  }

  updatePayment(id: string, payload: UpdateTvaPaymentPayload): Observable<TvaPayment> {
    return this.http
      .patch<ApiResponse<TvaPayment>>(`${environment.apiBaseUrl}/tva-payments/${id}`, payload)
      .pipe(map((response) => response.data));
  }

  deletePayment(id: string): Observable<{ success: boolean }> {
    return this.http
      .delete<ApiResponse<{ success: boolean }>>(`${environment.apiBaseUrl}/tva-payments/${id}`)
      .pipe(map((response) => response.data));
  }
}
