import { NgIf } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from './auth/auth.service';
import { CompanySwitcherComponent } from './core/company-switcher.component';
import { CompanySwitcherService } from './core/company-switcher.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf, CompanySwitcherComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly companySwitcher = inject(CompanySwitcherService);
  protected readonly isAuthRoute = signal(false);

  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  /** True when selected company context is owner (can manage team members). */
  protected isOwnerContext(): boolean {
    return this.companySwitcher.currentMembership()?.role === 'OWNER';
  }

  /** True when current user is super admin (can create companies). */
  protected isSuperAdmin(): boolean {
    return this.auth.isSuperAdmin();
  }

  constructor() {
    this.isAuthRoute.set(this.isAuthPath(this.router.url));

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        const url = (event as NavigationEnd).urlAfterRedirects;
        this.isAuthRoute.set(this.isAuthPath(url));
      });
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => this.navigateToLogin(),
      error: () => this.navigateToLogin(),
    });
  }

  private navigateToLogin(): void {
    this.companySwitcher.clearSelection();
    this.router.navigate(['/login']);
  }

  private isAuthPath(url: string): boolean {
    return (
      url.startsWith('/login') ||
      url.startsWith('/signup') ||
      url.startsWith('/forgot-password') ||
      url.startsWith('/reset-password')
    );
  }
}
