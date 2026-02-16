import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../core/api-response';
import { environment } from '../../environments/environment';
import { TaxSetting } from './tax-settings.model';

@Injectable({ providedIn: 'root' })
export class TaxSettingsService {
  private http = inject(HttpClient);

  getActiveTaxSettings(companyId: string): Observable<TaxSetting[]> {
    return this.http
      .get<ApiResponse<TaxSetting[]>>(`${environment.apiBaseUrl}/tax-settings/active`, {
        params: { companyId },
      })
      .pipe(map((response) => response.data));
  }

  createTaxSetting(payload: {
    companyId: string;
    name: string;
    taxType: 'TVA' | 'RE';
    taxprice: number;
    isactive?: boolean;
    notes?: string;
  }): Observable<TaxSetting> {
    return this.http
      .post<ApiResponse<TaxSetting>>(`${environment.apiBaseUrl}/tax-settings`, payload)
      .pipe(map((response) => response.data));
  }
}
