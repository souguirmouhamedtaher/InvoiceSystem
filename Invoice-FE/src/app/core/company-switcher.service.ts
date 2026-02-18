import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

/** One company the user can switch to (owned or invited). */
export interface CompanyMembership {
  _id: string;
  userId: string;
  companyId: {
    _id: string;
    companyname: string;
  };
  role: 'MANAGER' | 'ACCOUNTANT' | 'OWNER';
  createdAt?: string;
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
    const id = this.selectedCompanyId();
    if (!id) return null;
    const sid = String(id);
    return this.memberships().find((m) => this.idOf(m) === sid) ?? null;
  });

  /** Normalize company id from a membership (backend always returns companyId._id as string). */
  idOf(m: CompanyMembership): string {
    const c = m?.companyId;
    if (!c) return '';
    const x = (c as any)._id ?? (c as any).id;
    if (x != null) return String(x);
    if (typeof m._id === 'string' && m._id.startsWith('owner-')) return m._id.slice(6);
    return '';
  }

  /** Load from API. Accept plain { memberships } or wrapped { data: { memberships } }. */
  getUserMemberships(): Observable<{ memberships: CompanyMembership[] }> {
    const url = `${this.apiUrl}/my-memberships`;
    return this.http.get<{ memberships: CompanyMembership[] }>(url).pipe(
      tap((res) => {
        const list = this.parseMemberships(res);
        console.log('[company-switcher] my-memberships response:', res, 'parsed list length=', list.length);
        this.memberships.set(list);
        if (list.length === 0) {
          this.clearSelection();
          return;
        }
        if (!this.selectedCompanyId()) {
          const firstId = this.idOf(list[0]);
          if (firstId) {
            this.selectedCompanyId.set(firstId);
            localStorage.setItem('selectedCompanyId', firstId);
          }
        }
      })
    );
  }

  private parseMemberships(res: unknown): CompanyMembership[] {
    if (Array.isArray(res)) return res as CompanyMembership[];
    if (res && typeof res === 'object') {
      const r = res as Record<string, unknown>;
      const arr = (r['memberships'] ?? (r['data'] as Record<string, unknown>)?.['memberships']) as unknown;
      return Array.isArray(arr) ? arr : [];
    }
    return [];
  }

  /** Set selected company by id and persist. */
  selectCompany(companyId: string): void {
    const id = companyId != null ? String(companyId).trim() : '';
    if (!id) return;
    this.selectedCompanyId.set(id);
    localStorage.setItem('selectedCompanyId', id);
  }

  /** After creating a company: add to list, select it, persist. */
  setCreatedCompany(company: { _id: string; companyname: string }): void {
    const id = company?._id != null ? String(company._id) : '';
    if (!id) return;
    const entry: CompanyMembership = {
      _id: `owner-${id}`,
      userId: '',
      companyId: {
        _id: id,
        companyname: company.companyname ?? '',
      },
      role: 'OWNER',
    };
    const list = this.memberships();
    if (!list.some((m) => this.idOf(m) === id)) {
      this.memberships.set([...list, entry]);
    }
    this.selectedCompanyId.set(id);
    localStorage.setItem('selectedCompanyId', id);
  }

  restoreSelectedCompany(): void {
    const id = localStorage.getItem('selectedCompanyId');
    if (id) this.selectedCompanyId.set(id);
  }

  clearSelection(): void {
    this.selectedCompanyId.set(null);
    localStorage.removeItem('selectedCompanyId');
  }

  clearAll(): void {
    this.memberships.set([]);
    this.clearSelection();
  }
}
