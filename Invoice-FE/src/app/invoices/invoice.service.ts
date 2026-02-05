import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../core/api-response';
import { environment } from '../../environments/environment';
import {
  CreateInvoicePayload,
  Invoice,
  InvoiceCalculatePayload,
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

  getInvoiceById(id: string): Observable<Invoice> {
    return this.http
      .get<ApiResponse<Invoice>>(`${environment.apiBaseUrl}/invoice/${id}`)
      .pipe(map((response) => response.data));
  }
}
