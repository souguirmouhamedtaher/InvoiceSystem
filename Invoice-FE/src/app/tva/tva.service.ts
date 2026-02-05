import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../core/api-response';
import { environment } from '../../environments/environment';
import { VatTotalsResponse } from './tva.model';

@Injectable({ providedIn: 'root' })
export class TvaService {
  private http = inject(HttpClient);

  getMonthlyVat(year?: number, month?: number): Observable<VatTotalsResponse> {
    const params = new HttpParams({
      fromObject: {
        ...(year ? { year: String(year) } : {}),
        ...(month ? { month: String(month) } : {}),
      },
    });

    return this.http
      .get<ApiResponse<VatTotalsResponse>>(`${environment.apiBaseUrl}/analysis/treasury`, {
        params,
      })
      .pipe(map((response) => response.data));
  }
}
