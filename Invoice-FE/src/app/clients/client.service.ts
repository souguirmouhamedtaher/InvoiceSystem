import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../core/api-response';
import { environment } from '../../environments/environment';
import { Client, CreateClientPayload } from './client.model';

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
}
