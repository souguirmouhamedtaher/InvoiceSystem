import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../core/api-response';
import { environment } from '../../environments/environment';
import {
  AddInvoicePaymentPayload,
  CreateInvoicePayload,
  Invoice,
  InvoiceCalculatePayload,
  InvoiceListResponse,
  InvoiceTotals,
} from './invoice.model';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private http = inject(HttpClient);

  calculateInvoice(payload: InvoiceCalculatePayload): Observable<InvoiceTotals> {
    return this.http
      .post<ApiResponse<InvoiceTotals>>(`${environment.apiBaseUrl}/invoice/calculate`, payload)
      .pipe(map((response) => response.data));
  }

  createInvoice(payload: CreateInvoicePayload): Observable<Invoice> {
    return this.http
      .post<ApiResponse<Invoice>>(`${environment.apiBaseUrl}/invoice`, payload)
      .pipe(map((response) => response.data));
  }

  getInvoices(params: {
    page: number;
    limit: number;
    search?: string;
    clientType?: string;
    invoiceType?: string;
    invoiceStatus?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Observable<InvoiceListResponse> {
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
      .get<ApiResponse<InvoiceListResponse>>(`${environment.apiBaseUrl}/invoice`, {
        params: query,
      })
      .pipe(map((response) => response.data));
  }

  getInvoiceById(id: string): Observable<Invoice> {
    return this.http
      .get<ApiResponse<Invoice>>(`${environment.apiBaseUrl}/invoice/${id}`)
      .pipe(map((response) => response.data));
  }

  downloadInvoicePdf(id: string): Observable<Blob> {
    return this.http.get(`${environment.apiBaseUrl}/invoice/${id}/pdf`, {
      responseType: 'blob',
    });
  }

  addInvoicePayment(id: string, payload: AddInvoicePaymentPayload): Observable<Invoice> {
    return this.http
      .post<ApiResponse<Invoice>>(`${environment.apiBaseUrl}/invoice/${id}/payments`, payload)
      .pipe(map((response) => response.data));
  }
}
