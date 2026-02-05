import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../core/api-response';
import { environment } from '../../environments/environment';
import { CreateLibellePayload, Libelle } from './libelle.model';

@Injectable({ providedIn: 'root' })
export class LibelleService {
  private http = inject(HttpClient);

  createLibelle(payload: CreateLibellePayload): Observable<Libelle> {
    return this.http
      .post<ApiResponse<Libelle>>(`${environment.apiBaseUrl}/libelle`, payload)
      .pipe(map((response) => response.data));
  }

  calculateLibelle(payload: CreateLibellePayload): Observable<{ finalprixHT: string; finalprixTTC: string; tax: { taxAmount: string } }>{
    return this.http
      .post<ApiResponse<{ finalprixHT: string; finalprixTTC: string; tax: { taxAmount: string } }>>(
        `${environment.apiBaseUrl}/libelle/calculate`,
        payload
      )
      .pipe(map((response) => response.data));
  }
}
