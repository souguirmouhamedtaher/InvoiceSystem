import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../core/api-response';
import { environment } from '../../environments/environment';
import { CashDashboardResponse } from './dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  getCashDashboard(year?: number, month?: number): Observable<CashDashboardResponse> {
    const params = new HttpParams({
      fromObject: {
        ...(year ? { year: String(year) } : {}),
        ...(month ? { month: String(month) } : {}),
      },
    });

    return this.http
      .get<ApiResponse<CashDashboardResponse>>(
        `${environment.apiBaseUrl}/analysis/cash-dashboard`,
        { params }
      )
      .pipe(map((response) => response.data));
  }
}
