import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../core/api-response';
import { environment } from '../../environments/environment';
import { CashDashboardResponse } from './dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  getCashDashboard(year?: number, month?: number, companyId?: string): Observable<CashDashboardResponse> {
    const params: Record<string, string> = {};
    if (year != null && year !== undefined) params['year'] = String(year);
    if (month != null && month !== undefined) params['month'] = String(month);
    if (companyId) params['companyId'] = companyId;

    return this.http
      .get<ApiResponse<CashDashboardResponse> | CashDashboardResponse>(
        `${environment.apiBaseUrl}/analysis/cash-dashboard`,
        { params: new HttpParams({ fromObject: params }) }
      )
      .pipe(map((response: any) => response?.data ?? response));
  }
}
