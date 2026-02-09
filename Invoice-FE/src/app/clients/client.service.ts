import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../core/api-response';
import { environment } from '../../environments/environment';
import { Client, ClientListResponse, CreateClientPayload, UpdateClientPayload } from './client.model';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private http = inject(HttpClient);

  createClient(payload: CreateClientPayload): Observable<Client> {
    return this.http
      .post<ApiResponse<Client>>(`${environment.apiBaseUrl}/company`, payload)
      .pipe(map((response) => response.data));
  }

  getClientById(id: string): Observable<Client> {
    return this.http
      .get<ApiResponse<Client>>(`${environment.apiBaseUrl}/company/${id}`)
      .pipe(map((response) => response.data));
  }

  getClients(params: {
    page: number;
    limit: number;
    search?: string;
    companyType?: string;
    city?: string;
    country?: string;
    companyId?: string;
  }): Observable<ClientListResponse> {
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
      .get<ApiResponse<ClientListResponse>>(`${environment.apiBaseUrl}/company`, { params: query })
      .pipe(map((response) => response.data));
  }

  updateClient(id: string, payload: UpdateClientPayload): Observable<Client> {
    return this.http
      .patch<ApiResponse<Client>>(`${environment.apiBaseUrl}/company/${id}`, payload)
      .pipe(map((response) => response.data));
  }

  deleteClient(id: string): Observable<{ success: boolean }> {
    return this.http
      .delete<ApiResponse<{ success: boolean }>>(`${environment.apiBaseUrl}/company/${id}`)
      .pipe(map((response) => response.data));
  }
}
