import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CompanyMembership, CompanySwitcherService } from '../core/company-switcher.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-company-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './company-selector.component.html',
  styleUrl: './company-selector.component.scss',
})
export class CompanySelectorComponent implements OnInit {
  protected companySwitcher = inject(CompanySwitcherService);
  protected auth = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  protected loading = signal(true);
  protected error = signal<string | null>(null);
  /** Use a local copy so the template always sees the latest list after load. */
  protected companies = signal<CompanyMembership[]>([]);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.companySwitcher.getUserMemberships().subscribe({
      next: () => {
        const list = this.companySwitcher.availableMemberships();
        this.companies.set(list);
        console.log('[company-selector] load done, companies count=', list.length);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('[company-selector] load error', err);
        this.error.set(err?.error?.message ?? 'Impossible de charger vos societes');
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  /** Called when user clicks a company card. Select and go to dashboard. */
  onSelect(m: CompanyMembership): void {
    const id = this.companySwitcher.idOf(m);
    if (!id) return;
    this.companySwitcher.selectCompany(id);
    this.router.navigate(['/dashboard']);
  }

  trackById(_index: number, m: CompanyMembership): string {
    return this.companySwitcher.idOf(m) || m._id || String(_index);
  }

  createNew(): void {
    this.router.navigate(['/my-companies/new']);
  }
}
