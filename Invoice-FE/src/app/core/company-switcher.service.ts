import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CompanyMembership {
  _id: string;
  userId: string;
  companyId: {
    _id: string;
    companyname: string;
    companyType: string;
  };
  role: 'MANAGER' | 'ACCOUNTANT';
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class CompanySwitcherService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/employee`;

  private memberships = signal<CompanyMembership[]>([]);
  private selectedCompanyId = signal<string | null>(null);

  readonly availableMemberships = computed(() => this.memberships());
  readonly currentCompanyId = computed(() => this.selectedCompanyId());
  readonly currentMembership = computed(() => {
    const companyId = this.selectedCompanyId();
    if (!companyId) return null;
    return this.memberships().find(m => m.companyId._id === companyId) || null;
  });

  getUserMemberships(): Observable<{ memberships: CompanyMembership[] }> {
    return this.http.get<{ memberships: CompanyMembership[] }>(`${this.apiUrl}/my-memberships`).pipe(
      tap((response) => {
        const memberships = response?.memberships ?? [];
        this.memberships.set(memberships);
        // Auto-select first company if none selected
        if (memberships.length > 0 && !this.selectedCompanyId()) {
          this.selectedCompanyId.set(memberships[0].companyId._id);
          // Store in localStorage for persistence
          localStorage.setItem('selectedCompanyId', memberships[0].companyId._id);
        }
      })
    );
  }

  selectCompany(companyId: string): void {
    const membership = this.memberships().find(m => m.companyId._id === companyId);
    if (membership) {
      this.selectedCompanyId.set(companyId);
      localStorage.setItem('selectedCompanyId', companyId);
    }
  }

  restoreSelectedCompany(): void {
    const savedCompanyId = localStorage.getItem('selectedCompanyId');
    if (savedCompanyId) {
      this.selectedCompanyId.set(savedCompanyId);
    }
  }

  clearSelection(): void {
    this.selectedCompanyId.set(null);
    localStorage.removeItem('selectedCompanyId');
  }
}
